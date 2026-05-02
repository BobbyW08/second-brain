import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createId } from "@paralleldrive/cuid2";
import type { Database } from "@/types/database.types";
import { supabase } from "@/utils/supabase";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

// Task status values: 'active', 'completed_today', 'archived', 'scheduled'
// ('scheduled' = task is on calendar; becomes 'active' again if calendar block is deleted)

// ─── Read ────────────────────────────────────────────────────────────────────

export function useTasksByPriority(userId: string) {
	return useQuery({
		queryKey: ["tasks", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data } = await supabase
				.from("tasks")
				.select("*")
				.eq("user_id", userId)
				.eq("status", "active")
				.order("position")
				.throwOnError();
			return data ?? [];
		},
	});
}

export function useCompletedTodayTasks(userId: string) {
	return useQuery({
		queryKey: ["tasks-completed-today", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data } = await supabase
				.from("tasks")
				.select("*")
				.eq("user_id", userId)
				.eq("status", "completed_today")
				.order("completed_at", { ascending: false })
				.throwOnError();
			return data ?? [];
		},
	});
}

// ─── Create ──────────────────────────────────────────────────────────────────

export function useCreateTask() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (input: {
			user_id: string;
			title: string;
			priority: string;
			block_size?: string;
			position?: number;
			bucket_id?: string | null;
		}) => {
			await supabase
				.from("tasks")
				.insert({
					...input,
					short_id: createId().slice(0, 7),
					status: "active",
				})
				.throwOnError();
		},
		onMutate: async (input) => {
			await queryClient.cancelQueries({
				queryKey: ["tasks", input.user_id],
			});
			const previous = queryClient.getQueryData<Task[]>([
				"tasks",
				input.user_id,
			]);
			const optimistic: Task = {
				id: `temp-${Date.now()}`,
				user_id: input.user_id,
				title: input.title,
				priority: input.priority,
				block_size: input.block_size ?? "M",
				position: input.position ?? 0,
				status: "active",
				notes: null,
				completed_at: null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				attendees: null,
				bucket_id: input.bucket_id ?? null,
				color: null,
				description: null,
				due_at: null,
				end_time: null,
				google_event_id: null,
				labels: null,
				location: null,
				parent_task_id: null,
				recurring: null,
				short_id: createId().slice(0, 7),
				start_time: null,
			};
			queryClient.setQueryData<Task[]>(["tasks", input.user_id], (old) => [
				...(old ?? []),
				optimistic,
			]);
			return { previous };
		},
		onError: (_err, input, context) => {
			queryClient.setQueryData(["tasks", input.user_id], context?.previous);
		},
		onSuccess: () => {
			toast.success("Task added");
		},
		onSettled: (_data, _err, input) => {
			queryClient.invalidateQueries({ queryKey: ["tasks", input.user_id] });
		},
	});
}

// ─── Complete ────────────────────────────────────────────────────────────────

export function useCompleteTask(userId: string) {
	const queryClient = useQueryClient();
	const { mutate: undoCompleteTask } = useUndoCompleteTask(userId);

	return useMutation({
		mutationFn: async (taskId: string) => {
			await supabase
				.from("tasks")
				.update({
					status: "completed_today",
					completed_at: new Date().toISOString(),
				})
				.eq("id", taskId)
				.throwOnError();
		},
		onMutate: async (taskId) => {
			await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
			const previous = queryClient.getQueryData<Task[]>(["tasks", userId]);
			queryClient.setQueryData<Task[]>(["tasks", userId], (old) =>
				(old ?? []).map((t) =>
					t.id === taskId
						? {
								...t,
								status: "completed_today",
								completed_at: new Date().toISOString(),
							}
						: t,
				),
			);
			return { previous };
		},
		onError: (_err, _taskId, context) => {
			queryClient.setQueryData(["tasks", userId], context?.previous);
		},
		onSuccess: (_data, taskId) => {
			toast.success("Task complete", {
				action: {
					label: "Undo",
					onClick: () => undoCompleteTask(taskId),
				},
			});
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
			queryClient.invalidateQueries({
				queryKey: ["tasks-completed-today", userId],
			});
		},
	});
}

// ─── Update (title / block_size edits) ───────────────────────────────────────

export function useUpdateTask(userId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (input: { taskId: string; updates: Partial<Task> }) => {
			await supabase
				.from("tasks")
				.update(input.updates)
				.eq("id", input.taskId)
				.throwOnError();
		},
		onMutate: async ({ taskId, updates }) => {
			await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
			const previous = queryClient.getQueryData<Task[]>(["tasks", userId]);
			queryClient.setQueryData<Task[]>(["tasks", userId], (old) =>
				(old ?? []).map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
			);
			return { previous };
		},
		onError: (_err, _input, context) => {
			queryClient.setQueryData(["tasks", userId], context?.previous);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
		},
	});
}

// ─── Undo Complete ─────────────────────────────────────────────────────
// ─── Reorder Tasks ───────────────────────────────────────────────────

export function useReorderTasks(userId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (input: {
			taskId: string;
			overId: string;
			bucketId: string;
		}) => {
			const { data: tasks } = await supabase
				.from("tasks")
				.select("id, position")
				.eq("user_id", userId)
				.eq("bucket_id", input.bucketId)
				.order("position")
				.throwOnError();

			if (!tasks) return;

			const taskIds = tasks.map((t) => t.id);
			const fromIndex = taskIds.indexOf(input.taskId);
			const toIndex = taskIds.indexOf(input.overId);

			if (fromIndex === -1 || toIndex === -1) return;

			taskIds.splice(fromIndex, 1);
			taskIds.splice(toIndex, 0, input.taskId);

			const updates = taskIds.map((id, index) =>
				supabase
					.from("tasks")
					.update({ position: index })
					.eq("id", id)
					.throwOnError(),
			);

			await Promise.all(updates);
		},
		onMutate: async ({ taskId, overId, bucketId }) => {
			await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
			const previous = queryClient.getQueryData<Task[]>(["tasks", userId]);

			queryClient.setQueryData<Task[]>(["tasks", userId], (old) => {
				if (!old) return old;
				const bucketTasks = old.filter((t) => t.bucket_id === bucketId);
				const otherTasks = old.filter((t) => t.bucket_id !== bucketId);

				const fromIndex = bucketTasks.findIndex((t) => t.id === taskId);
				const toIndex = bucketTasks.findIndex((t) => t.id === overId);

				if (fromIndex === -1 || toIndex === -1) return old;

				const [moved] = bucketTasks.splice(fromIndex, 1);
				bucketTasks.splice(toIndex, 0, moved);

				return [...otherTasks, ...bucketTasks];
			});

			return { previous };
		},
		onError: (_err, _input, context) => {
			queryClient.setQueryData(["tasks", userId], context?.previous);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
		},
	});
}

// ─── Undo Complete ─────────────────────────────────────────────────────────────

export function useUndoCompleteTask(userId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (taskId: string) => {
			await supabase
				.from("tasks")
				.update({
					status: "active",
					completed_at: null,
				})
				.eq("id", taskId)
				.throwOnError();
		},
		onMutate: async (taskId) => {
			await queryClient.cancelQueries({
				queryKey: ["tasks-completed-today", userId],
			});
			const previous = queryClient.getQueryData<Task[]>([
				"tasks-completed-today",
				userId,
			]);

			// Optimistically remove task from completed-today list
			queryClient.setQueryData<Task[]>(
				["tasks-completed-today", userId],
				(old) => (old ?? []).filter((t) => t.id !== taskId),
			);

			return { previous };
		},
		onError: (_err, _taskId, context) => {
			queryClient.setQueryData(
				["tasks-completed-today", userId],
				context?.previous,
			);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
			queryClient.invalidateQueries({
				queryKey: ["tasks-completed-today", userId],
			});
		},
	});
}

// ─── Delete Task ────────────────────────────────────────────────────────────

export function useDeleteTask(userId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (taskId: string) => {
			await supabase.from("tasks").delete().eq("id", taskId).throwOnError();
		},
		onMutate: async (taskId) => {
			await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
			const previous = queryClient.getQueryData<Task[]>(["tasks", userId]);
			queryClient.setQueryData<Task[]>(["tasks", userId], (old) =>
				(old ?? []).filter((t) => t.id !== taskId),
			);
			return { previous };
		},
		onError: (_err, _taskId, context) => {
			queryClient.setQueryData(["tasks", userId], context?.previous);
		},
		onSuccess: () => {
			toast.success("Task deleted");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
		},
	});
}
