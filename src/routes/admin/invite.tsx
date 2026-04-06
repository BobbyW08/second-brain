import { createFileRoute, redirect } from "@tanstack/react-router";
import { useId, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteUser } from "@/server/inviteUser";
import { requireAuth } from "@/utils/auth";

export const Route = createFileRoute("/admin/invite")({
	beforeLoad: async () => {
		const session = await requireAuth();
		if (session.user.email !== import.meta.env.VITE_ADMIN_EMAIL) {
			throw redirect({ to: "/dashboard" });
		}
	},
	component: InvitePage,
});

function InvitePage() {
	const emailId = useId();
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [link, setLink] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSendInvite() {
		if (!email) return;
		setError(null);
		setMessage(null);
		setLink(null);
		setIsSubmitting(true);

		try {
			const result = await inviteUser({ data: { email } });
			setMessage(`Invite sent to ${email}`);
			setLink(result.link);
			setEmail("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
			<div className="w-full max-w-md space-y-6">
				<div>
					<h1 className="text-2xl font-bold">Send Invite</h1>
					<p className="text-muted-foreground mt-1">
						Enter an email address to send an invite link.
					</p>
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<label htmlFor={emailId} className="block text-sm font-medium">
							Email
						</label>
						<Input
							id={emailId}
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
							placeholder="user@example.com"
						/>
					</div>

					<Button
						onClick={handleSendInvite}
						className="w-full"
						disabled={!email || isSubmitting}
					>
						{isSubmitting ? "Sending..." : "Send Invite"}
					</Button>

					{message && (
						<Alert>
							<AlertDescription>{message}</AlertDescription>
						</Alert>
					)}

					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{link && (
						<div className="rounded-md border p-4 bg-muted">
							<p className="text-sm text-muted-foreground">
								Copy this link manually if the email doesn't arrive:
							</p>
							<p className="mt-1 font-mono text-xs break-all select-all">
								{link}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
