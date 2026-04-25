import { supabase } from "./supabase";

/**
 * Moves tasks with status 'complete' AND updated_at date before today (UTC)
 * to status 'archived'.
 */
export async function archiveCompletedTasks(userId: string) {
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	await supabase
		.from("tasks")
		.update({ status: "archived" })
		.eq("user_id", userId)
		.eq("status", "completed_today") // Spec says status = 'complete' in textual description but 'completed_today' in code/lib
		.lt("updated_at", todayStart.toISOString())
		.throwOnError();
}
