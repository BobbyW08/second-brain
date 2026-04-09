import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJournalTitle } from "@/lib/getJournalTitle";
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
			updates: { title?: string; content?: unknown };
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
			queryClient.invalidateQueries({ queryKey: ["journal-pages"] });
		},
	});
}

export function useJournalPages(userId: string) {
	return useQuery({
		queryKey: ["journal-pages", userId],
		enabled: !!userId,
		queryFn: async () => {
			const { data } = await supabase
				.from("pages")
				.select("id, title, journal_date, created_at, updated_at")
				.eq("user_id", userId)
				.eq("page_type", "journal")
				.order("journal_date", { ascending: false })
				.throwOnError();
			return data;
		},
	});
}

export function useCreateJournalPage() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			user_id,
			journal_date,
		}: {
			user_id: string;
			journal_date: string;
		}) => {
			const title = getJournalTitle(new Date(), new Date());
			const { data } = await supabase
				.from("pages")
				.insert({
					user_id,
					journal_date,
					title,
					page_type: "journal",
					content: { type: "doc", content: [] },
				})
				.select()
				.single()
				.throwOnError();
			return data;
		},
		onSuccess: (_data, { user_id }) => {
			queryClient.invalidateQueries({ queryKey: ["journal-pages", user_id] });
		},
	});
}

export function useTodayJournalPage(userId: string) {
	const today = new Date().toISOString().split("T")[0];
	return useQuery({
		queryKey: ["journal-today", userId, today],
		enabled: !!userId,
		queryFn: async () => {
			const { data } = await supabase
				.from("pages")
				.select("*")
				.eq("user_id", userId)
				.eq("page_type", "journal")
				.eq("journal_date", today)
				.maybeSingle()
				.throwOnError();
			return data; // null if not found
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
				.order("created_at", { ascending: false })
				.throwOnError();

			if (folderId) {
				query = query.eq("folder_id", folderId);
			}

			const { data } = await query;
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
