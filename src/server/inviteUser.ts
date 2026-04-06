import { createServerFn } from "@tanstack/start";
import { createClient } from "@supabase/supabase-js";
import { getSessionReady } from "@/utils/supabase";

const adminClient = createClient(
	import.meta.env.VITE_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const inviteUser = createServerFn(
	"POST",
	async ({ email }: { email: string }) => {
		const currentUser = await getSessionReady();

		if (!currentUser) {
			throw new Error("User not authenticated.");
		}

		const { data, error } = await adminClient.auth.admin
			.generateLink({
				type: "invite",
				email,
			})
			.throwOnError();

		if (error) {
			throw new Error(error.message);
		}

		await adminClient.from("invites").insert({
			email: email,
			token: data.properties.hashed_token,
			invited_by: currentUser.user.id,
		});

		return data.properties.action_link;
	},
);
