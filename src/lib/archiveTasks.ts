import { supabase } from "@/utils/supabase";

export async function archiveCompletedTasks(userId: string) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	await supabase
		.from("tasks")
		.update({ status: "archived" })
		.eq("user_id", userId)
		.eq("status", "completed_today")
		.lt("completed_at", today.toISOString())
		.throwOnError();
}
