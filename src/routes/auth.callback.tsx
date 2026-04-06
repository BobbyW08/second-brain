import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/utils/supabase";

export const Route = createFileRoute("/auth/callback")({
	component: AuthCallbackPage,
});

function AuthCallbackPage() {
	const navigate = useNavigate();

	useEffect(() => {
		async function handleCallback() {
			const code = new URLSearchParams(window.location.search).get("code");

			if (!code) {
				navigate({ to: "/login" });
				return;
			}

			const { data, error } = await supabase.auth.exchangeCodeForSession(code);

			if (error || !data.session) {
				navigate({ to: "/login" });
				return;
			}

			const { provider_token, provider_refresh_token, user } = data.session;

			if (provider_refresh_token) {
				await supabase
					.from("profiles")
					.update({
						google_access_token: provider_token,
						google_refresh_token: provider_refresh_token,
						google_token_expiry: new Date(
							Date.now() + 3600 * 1000,
						).toISOString(),
					})
					.eq("id", user.id)
					.throwOnError();
			}

			navigate({ to: "/dashboard" });
		}

		handleCallback();
	}, [navigate]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<p className="text-muted-foreground">Signing you in...</p>
		</div>
	);
}
