import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Json } from "@/types/database.types";
import { supabase } from "@/utils/supabase";

export function useThreads(userId: string) {
	return useQuery({
		queryKey: ["aiThreads", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data } = await supabase
				.from("ai_threads")
				.select("*")
				.eq("user_id", userId)
				.order("updated_at", { ascending: false })
				.throwOnError();
			return data;
		},
	});
}

export function useCreateThread() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			userId,
			threadId,
			title,
		}: {
			userId: string;
			threadId: string;
			title?: string;
		}) => {
			await supabase
				.from("ai_threads")
				.insert({
					id: threadId,
					user_id: userId,
					title: title ?? "New conversation",
					messages: [],
				})
				.throwOnError();
		},
		onSuccess: (_data, { userId }) => {
			queryClient.invalidateQueries({ queryKey: ["aiThreads", userId] });
		},
	});
}

export function useRenameThread() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			threadId,
			title,
		}: {
			threadId: string;
			title: string;
			userId: string;
		}) => {
			await supabase
				.from("ai_threads")
				.update({ title })
				.eq("id", threadId)
				.throwOnError();
		},
		onSuccess: (_data, { userId }) => {
			queryClient.invalidateQueries({ queryKey: ["aiThreads", userId] });
		},
	});
}

export function useDeleteThread() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ threadId }: { threadId: string; userId: string }) => {
			await supabase
				.from("ai_threads")
				.delete()
				.eq("id", threadId)
				.throwOnError();
		},
		onSuccess: (_data, { userId }) => {
			queryClient.invalidateQueries({ queryKey: ["aiThreads", userId] });
		},
	});
}

export function useUpdateThreadMessages() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			threadId,
			messages,
		}: {
			threadId: string;
			messages: Json;
			userId: string;
		}) => {
			await supabase
				.from("ai_threads")
				.update({ messages, updated_at: new Date().toISOString() })
				.eq("id", threadId)
				.throwOnError();
		},
		onSuccess: (_data, { userId }) => {
			queryClient.invalidateQueries({ queryKey: ["aiThreads", userId] });
		},
	});
}
