import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createGoogleCalendarEvent,
	deleteGoogleCalendarEvent,
} from "@/server/googleCalendar";
import type { Tables } from "@/types/database.types";
import { supabase } from "@/utils/supabase";

export type CalendarBlock = Tables<"calendar_blocks">;

export function useCalendarBlocks(
	userId: string,
	dateRange: { start: string; end: string },
) {
	return useQuery({
		queryKey: ["calendar-blocks", userId, dateRange.start, dateRange.end],
		enabled: !!userId,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes (cacheTime renamed to gcTime in React Query v5)
		queryFn: async () => {
			const { data } = await supabase
				.from("calendar_blocks")
				.select("*")
				.eq("user_id", userId)
				.gte("start_time", dateRange.start)
				.lte("end_time", dateRange.end)
				.throwOnError();
			return data ?? [];
		},
	});
}

export function useDeleteBlock() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (blockId: string) => {
			// First get the current block to check if it's synced
			const { data: currentBlock } = await supabase
				.from("calendar_blocks")
				.select("*")
				.eq("id", blockId)
				.single()
				.throwOnError();

			// If synced, delete from Google + clean up event_mappings
			if (currentBlock.is_synced && currentBlock.google_event_id) {
				try {
					await deleteGoogleCalendarEvent({
						data: {
							userId: currentBlock.user_id,
							googleEventId: currentBlock.google_event_id,
						},
					});
				} catch {
					// Google delete failed — still clean up local
				}
			}

			// Delete local block (event_mappings cleaned up by server function)
			await supabase
				.from("calendar_blocks")
				.delete()
				.eq("id", blockId)
				.throwOnError();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
		},
	});
}

export function useCreateBlock() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			block,
			syncToGoogle,
		}: {
			block: {
				user_id: string;
				title: string;
				start_time: string;
				end_time: string;
				block_type?: string | null;
				task_id?: string | null;
			};
			syncToGoogle?: boolean;
		}) => {
			const { data: newBlock } = await supabase
				.from("calendar_blocks")
				.insert(block)
				.select()
				.single()
				.throwOnError();

			// If sync enabled, push to Google
			if (syncToGoogle && newBlock) {
				try {
					await createGoogleCalendarEvent({
						data: {
							userId: block.user_id,
							block: {
								id: newBlock.id,
								title: block.title,
								start_time: block.start_time,
								end_time: block.end_time,
							},
						},
					});
				} catch {
					// Non-blocking
				}
			}

			return newBlock;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
		},
	});
}

export function useUpdateBlock() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			blockId,
			userId,
			updates,
		}: {
			blockId: string;
			userId: string;
			updates: {
				start_time?: string;
				end_time?: string;
				title?: string;
			};
		}) => {
			await supabase
				.from("calendar_blocks")
				.update(updates)
				.eq("id", blockId)
				.eq("user_id", userId)
				.throwOnError();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
		},
	});
}
