import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getSessionReady } from "@/utils/supabase";
import { inviteUser } from "@/server/inviteUser";

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
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
		null,
	);
	const [actionLink, setActionLink] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSendInvite = async () => {
		setMessage(null);
		setActionLink(null);
		setIsSubmitting(true);

		try {
			const link = await inviteUser({ email });
			setMessage({ type: "success", text: `Invite sent to ${email}` });
			setActionLink(link);
			setEmail("");
		} catch (error) {
			setMessage({ type: "error", text: error.message });
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
						<Alert variant={message.type === "error" ? "destructive" : "default"}>
							<AlertDescription>{message.text}</AlertDescription>
						</Alert>
					)}
					{actionLink && message?.type === "success" && (
						<Alert>
							<AlertDescription>
								Or copy this link manually:{" "}
								<a href={actionLink} target="_blank" rel="noreferrer" className="underline">
									{actionLink}
								</a>
							</AlertDescription>
						</Alert>
					)}
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="user@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<Button onClick={handleSendInvite} disabled={isSubmitting} className="w-full">
						{isSubmitting ? "Sending Invite..." : "Send Invite"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
