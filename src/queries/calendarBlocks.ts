import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteGoogleEvent, syncGoogleCalendar } from "@/server/googleCalendar";
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

			await supabase
				.from("calendar_blocks")
				.delete()
				.eq("id", blockId)
				.throwOnError();

			// If this is a synced block, also delete from Google Calendar
			if (currentBlock.is_synced && currentBlock.google_event_id) {
				// Get the user's Google tokens from the profile
				const { data: profileData } = await supabase
					.from("profiles")
					.select("google_access_token, google_refresh_token")
					.eq("id", currentBlock.user_id)
					.single()
					.throwOnError();

				if (
					!profileData.google_access_token ||
					!profileData.google_refresh_token
				)
					return;

				await deleteGoogleEvent({
					data: {
						googleEventId: currentBlock.google_event_id,
						accessToken: profileData.google_access_token,
					},
				});
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
		},
	});
}

// ─── Sync Google Events ────────────────────────────────────────────────────────

export function useSyncGoogleEvents() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (userId: string) => {
			const { data: profile } = await supabase
				.from("profiles")
				.select("google_access_token, google_refresh_token")
				.eq("id", userId)
				.single()
				.throwOnError();

			if (!profile?.google_access_token || !profile?.google_refresh_token)
				return;

			await syncGoogleCalendar({
				data: {
					userId,
					accessToken: profile.google_access_token,
					refreshToken: profile.google_refresh_token,
				},
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
		},
	});
}
