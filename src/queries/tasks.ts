import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Database } from "@/types/database.types";
import { supabase } from "@/utils/supabase";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

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
		}) => {
			await supabase
				.from("tasks")
				.insert({ ...input, status: "active" })
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

// ─── Move (priority + position) ──────────────────────────────────────────────

// userId passed as hook param because mutation input doesn't carry it
export function useMoveTask(userId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (input: {
			taskId: string;
			priority: string;
			position: number;
		}) => {
			await supabase
				.from("tasks")
				.update({ priority: input.priority, position: input.position })
				.eq("id", input.taskId)
				.throwOnError();
		},
		onMutate: async ({ taskId, priority, position }) => {
			await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
			const previous = queryClient.getQueryData<Task[]>(["tasks", userId]);
			queryClient.setQueryData<Task[]>(["tasks", userId], (old) =>
				(old ?? []).map((t) =>
					t.id === taskId ? { ...t, priority, position } : t,
				),
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

// ─── Complete ────────────────────────────────────────────────────────────────

export function useCompleteTask(userId: string) {
	const queryClient = useQueryClient();
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
		onSuccess: () => {
			toast.success("Marked complete", {
				action: {
					label: "Undo",
					onClick: () => {}, // Will be implemented in the component
				},
			});
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
		},
	});
}

// ─── Archive ─────────────────────────────────────────────────────────────────

export function useArchiveTask(userId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (taskId: string) => {
			await supabase
				.from("tasks")
				.update({ status: "archived" })
				.eq("id", taskId)
				.throwOnError();
		},
		onMutate: async (taskId) => {
			await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
			const previous = queryClient.getQueryData<Task[]>(["tasks", userId]);
			queryClient.setQueryData<Task[]>(["tasks", userId], (old) =>
				(old ?? []).map((t) =>
					t.id === taskId ? { ...t, status: "archived" } : t,
				),
			);
			return { previous };
		},
		onError: (_err, _taskId, context) => {
			queryClient.setQueryData(["tasks", userId], context?.previous);
		},
		onSuccess: () => {
			toast.success("Task removed");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
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

// ─── Task Details ──────────────────────────────────────────────────────────────

export function useTask(taskId: string) {
	return useQuery({
		queryKey: ["task", taskId],
		enabled: !!taskId,
		queryFn: async () => {
			const { data } = await supabase
				.from("tasks")
				.select("*")
				.eq("id", taskId)
				.single()
				.throwOnError();
			return data;
		},
	});
}

// ─── Reorder ───────────────────────────────────────────────────────────────────

export function useReorderTasks(userId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (input: {
			taskIds: string[];
			newPositions: number[];
		}) => {
			const { taskIds, newPositions } = input;
			// Update positions individually — upsert requires all required fields
			await Promise.all(
				taskIds.map((taskId, index) =>
					supabase
						.from("tasks")
						.update({ position: newPositions[index] })
						.eq("id", taskId)
						.throwOnError(),
				),
			);
		},
		onMutate: async (input) => {
			const { taskIds, newPositions } = input;
			await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
			const previous = queryClient.getQueryData<Task[]>(["tasks", userId]);

			// Optimistically update positions
			queryClient.setQueryData<Task[]>(["tasks", userId], (old) => {
				if (!old) return old;
				const updatedTasks = [...old];
				taskIds.forEach((taskId, index) => {
					const taskIndex = updatedTasks.findIndex((t) => t.id === taskId);
					if (taskIndex !== -1) {
						updatedTasks[taskIndex] = {
							...updatedTasks[taskIndex],
							position: newPositions[index],
						};
					}
				});
				return updatedTasks;
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
			await queryClient.cancelQueries({ queryKey: ["tasks", userId] });
			const previous = queryClient.getQueryData<Task[]>(["tasks", userId]);

			// Optimistically update task status
			queryClient.setQueryData<Task[]>(["tasks", userId], (old) =>
				(old ?? []).map((t) =>
					t.id === taskId
						? {
								...t,
								status: "active",
								completed_at: null,
							}
						: t,
				),
			);

			return { previous };
		},
		onError: (_err, _taskId, context) => {
			queryClient.setQueryData(["tasks", userId], context?.previous);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
		},
	});
}

// ─── Archive Completed ─────────────────────────────────────────────────────────

export function useArchiveCompletedBefore(userId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (threshold: string) => {
			await supabase
				.from("tasks")
				.update({ status: "archived" })
				.eq("user_id", userId)
				.lt("completed_at", threshold)
				.throwOnError();
		},
		onSuccess: (_data, _threshold) => {
			queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
		},
	});
}
