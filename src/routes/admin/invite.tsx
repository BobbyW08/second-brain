import { createFileRoute, redirect } from "@tanstack/react-router";
import { useId, useState } from "react";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { inviteUser } from "../../server/inviteUser";
import { getSessionReady } from "../../utils/supabase";

export const Route = createFileRoute("/admin/invite")({
	async beforeLoad() {
		const session = await getSessionReady();
		if (!session || session.user.email !== import.meta.env.VITE_ADMIN_EMAIL) {
			throw redirect({ to: "/" });
		}
	},
	component: AdminInvitePage,
});

function AdminInvitePage() {
	const emailId = useId();
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);
	const [actionLink, setActionLink] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSendInvite = async () => {
		setMessage(null);
		setActionLink(null);
		setIsSubmitting(true);

		try {
			const result = await inviteUser({ data: { email } });
			setMessage({ type: "success", text: `Invite sent to ${email}` });
			setActionLink(result.link);
			setEmail("");
		} catch (error) {
			setMessage({
				type: "error",
				text: error instanceof Error ? error.message : "Failed to send invite",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl">Invite User</CardTitle>
					<CardDescription>Send an invite link to a new user.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{message && (
						<Alert
							variant={message.type === "error" ? "destructive" : "default"}
						>
							<AlertDescription>{message.text}</AlertDescription>
						</Alert>
					)}
					{actionLink && message?.type === "success" && (
						<Alert>
							<AlertDescription>
								Or copy this link manually:{" "}
								<a
									href={actionLink}
									target="_blank"
									rel="noreferrer"
									className="underline"
								>
									{actionLink}
								</a>
							</AlertDescription>
						</Alert>
					)}
					<div className="space-y-2">
						<Label htmlFor={emailId}>Email</Label>
						<Input
							id={emailId}
							type="email"
							placeholder="user@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<Button
						onClick={handleSendInvite}
						disabled={isSubmitting}
						className="w-full"
					>
						{isSubmitting ? "Sending Invite..." : "Send Invite"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
