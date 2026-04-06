import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import type { Database } from "@/types/database.types";

export const inviteUser = createServerFn({ method: "POST" })
	.inputValidator((data: { email: string }) => data)
	.handler(async ({ data }) => {
		const adminClient = createClient<Database>(
			import.meta.env.VITE_SUPABASE_URL || "",
			process.env.SUPABASE_SERVICE_ROLE_KEY || "",
		);

		const { data: linkData, error } = await adminClient.auth.admin.generateLink(
			{
				type: "invite",
				email: data.email,
			},
		);

		if (error) throw new Error(error.message);

		await adminClient
			.from("invites")
			.insert({ email: data.email, token: linkData.properties.hashed_token })
			.throwOnError();

		return { link: linkData.properties.action_link };
	});
