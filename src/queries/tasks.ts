import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
			await supabase.from("tasks").insert(input).throwOnError();
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
