import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/ui/theme-provider";
import { useAuth } from "@/context/AuthContext";
import { useProfile, useUpdateProfile } from "@/queries/profile";
import { supabase } from "@/utils/supabase";

const GOOGLE_CALLBACK_URL = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`;

const profileSchema = z.object({
	display_name: z.string().min(1, "Name is required").max(100),
	avatar_url: z.string().url("Must be a valid URL").or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function SettingsPage() {
	const { user } = useAuth();
	const userId = user?.id ?? "";

	const { data: profile, isLoading } = useProfile(userId);
	const { mutateAsync: updateProfile, isPending: isUpdating } =
		useUpdateProfile();

	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: { display_name: "", avatar_url: "" },
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: form.reset is stable
	useEffect(() => {
		if (profile) {
			form.reset({
				display_name: profile.display_name ?? "",
				avatar_url: profile.avatar_url ?? "",
			});
		}
	}, [profile]);

	const avatarUrlValue = form.watch("avatar_url");
	const displayNameValue = form.watch("display_name");

	const initials = displayNameValue
		.split(" ")
		.map((n) => n[0])
		.join("")
		.substring(0, 2)
		.toUpperCase();

	const isConnected = !!(
		profile?.google_calendar_id && profile?.google_refresh_token
	);

	async function handleProfileSubmit(values: ProfileFormValues) {
		if (!userId) return;
		try {
			await updateProfile({
				userId,
				updates: {
					display_name: values.display_name,
					avatar_url: values.avatar_url,
				},
			});
			toast.success("Profile updated");
		} catch {
			toast.error("Could not save profile. Try again.");
		}
	}

	async function handleGoogleConnect() {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				scopes: "https://www.googleapis.com/auth/calendar",
				queryParams: { access_type: "offline", prompt: "consent" },
				redirectTo: GOOGLE_CALLBACK_URL,
			},
		});
		if (error) toast.error("Could not connect Google Calendar. Try again.");
	}

	async function handleGoogleDisconnect() {
		if (!userId) return;
		try {
			await updateProfile({
				userId,
				updates: {
					google_access_token: null,
					google_refresh_token: null,
					google_token_expiry: null,
					google_calendar_id: null,
				},
			});
			toast.success("Google Calendar disconnected");
		} catch {
			toast.error("Could not disconnect. Try again.");
		}
	}

	if (isLoading || !user) {
		return (
			<div className="max-w-2xl mx-auto px-4 py-8">
				<div className="h-8 w-32 animate-pulse rounded bg-muted" />
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-8">Settings</h1>

			{/* SECTION 1 — PROFILE */}
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(handleProfileSubmit)}
					className="space-y-6"
				>
					<div>
						<h2 className="text-lg font-semibold">Profile</h2>
						<p className="text-sm text-muted-foreground">
							Manage your account information
						</p>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							control={form.control}
							name="display_name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Display name</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="avatar_url"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Avatar URL</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="flex items-center gap-3">
						<Avatar className="h-14 w-14">
							{avatarUrlValue && (
								<AvatarImage src={avatarUrlValue} alt={displayNameValue} />
							)}
							<AvatarFallback>{initials}</AvatarFallback>
						</Avatar>
						<span className="text-sm text-muted-foreground">Preview</span>
					</div>

					<Button type="submit" disabled={isUpdating}>
						{isUpdating ? "Saving..." : "Save profile"}
					</Button>
				</form>
			</Form>

			<Separator className="my-8" />

			{/* SECTION 2 — APPEARANCE */}
			<div className="space-y-4">
				<div>
					<h2 className="text-lg font-semibold">Appearance</h2>
					<p className="text-sm text-muted-foreground">
						Customize the look and feel of the app
					</p>
				</div>
				<div className="flex items-center justify-between">
					<Label>Theme</Label>
					<ModeToggle />
				</div>
			</div>

			<Separator className="my-8" />

			{/* SECTION 3 — AI PREFERENCES (PLACEHOLDER) */}
			<div className="space-y-4">
				<div>
					<h2 className="text-lg font-semibold">AI Preferences</h2>
					<p className="text-sm text-muted-foreground">
						Personalization options for your AI assistant will appear here.
					</p>
					<Badge variant="secondary" className="mt-2">
						Coming soon
					</Badge>
				</div>
				{/* TODO: Phase 7 — AI preferences */}
			</div>

			<Separator className="my-8" />

			{/* SECTION 4 — CONNECTED SERVICES */}
			<div className="space-y-4">
				<div>
					<h2 className="text-lg font-semibold">Connected Services</h2>
					<p className="text-sm text-muted-foreground">
						Manage your connected accounts and integrations
					</p>
				</div>

				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<p className="text-sm font-medium">Google Calendar</p>
						{isConnected ? (
							<>
								<Badge className="bg-green-600 text-white hover:bg-green-700">
									Connected
								</Badge>
								<p className="text-xs text-muted-foreground">
									{profile?.google_calendar_id}
								</p>
							</>
						) : (
							<p className="text-sm text-muted-foreground">Not connected</p>
						)}
					</div>
					{isConnected ? (
						<Button variant="outline" onClick={handleGoogleDisconnect}>
							Disconnect
						</Button>
					) : (
						<Button onClick={handleGoogleConnect}>
							Connect Google Calendar
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
