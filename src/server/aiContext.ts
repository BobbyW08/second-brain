import { createServerFn } from "@tanstack/react-start";
import { endOfWeek, startOfToday } from "date-fns";
import { supabase } from "@/utils/supabase";

export const getAIContext = createServerFn({ method: "GET" })
	.inputValidator((data: { userId: string; pageId?: string }) => data)
	.handler(async ({ data }) => {
		const { userId, pageId } = data;
		const [tasks, folders, pages, calendarBlocks, currentPage] =
			await Promise.all([
				supabase
					.from("tasks")
					.select(
						"id, title, description, color, labels, due_at, completed_at, bucket_id, short_id",
					)
					.eq("user_id", userId)
					.is("completed_at", null)
					.throwOnError(),
				supabase
					.from("folders")
					.select("id, name, is_system")
					.eq("user_id", userId)
					.throwOnError(),
				supabase
					.from("pages")
					.select("id, title, folder_id, created_at")
					.eq("user_id", userId)
					.throwOnError(),
				supabase
					.from("calendar_blocks")
					.select("id, title, start_at, end_at, google_event_id, all_day")
					.eq("user_id", userId)
					.gte("start_at", startOfToday().toISOString())
					.lte("start_at", endOfWeek(new Date()).toISOString())
					.throwOnError(),
				pageId
					? supabase
							.from("pages")
							.select("id, title, content")
							.eq("id", pageId)
							.single()
							.throwOnError()
					: Promise.resolve({ data: null }),
			]);

		return {
			tasks: tasks.data,
			folders: folders.data,
			pages: pages.data,
			calendarBlocks: calendarBlocks.data,
			currentPage: currentPage.data,
		};
	});
