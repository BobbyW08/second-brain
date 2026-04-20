import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Json } from "@/types/database.types";
import { supabase } from "@/utils/supabase";

export function usePage(pageId: string) {
	return useQuery({
		queryKey: ["page", pageId],
		queryFn: async () => {
			const { data } = await supabase
				.from("pages")
				.select("*")
				.eq("id", pageId)
				.single()
				.throwOnError();
			return data;
		},
	});
}

export function useUpdatePage() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			pageId,
			updates,
		}: {
			pageId: string;
			updates: { title?: string; content?: Json };
		}) => {
			const { data } = await supabase
				.from("pages")
				.update(updates)
				.eq("id", pageId)
				.throwOnError();
			return data;
		},
		onSuccess: (_data, { pageId }) => {
			queryClient.invalidateQueries({ queryKey: ["page", pageId] });
		},
	});
}

// ─── Pages ─────────────────────────────────────────────────────────────────────

export function usePages(folderId?: string) {
	return useQuery({
		queryKey: ["pages", folderId ?? "all"],
		queryFn: async () => {
			let query = supabase
				.from("pages")
				.select("*")
				.order("created_at", { ascending: false });

			if (folderId) {
				query = query.eq("folder_id", folderId);
			}

			const { data } = await query.throwOnError();
			return data;
		},
	});
}

// ─── Delete Page ───────────────────────────────────────────────────────────────

export function useDeletePage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (pageId: string) => {
			await supabase.from("pages").delete().eq("id", pageId).throwOnError();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pages"] });
			queryClient.invalidateQueries({ queryKey: ["folder-tree"] });
		},
	});
}
