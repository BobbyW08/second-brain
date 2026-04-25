import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import {
	useBuckets,
	useCreateBucket,
	useDeleteBucket,
	useReorderBuckets,
	useUpdateBucket,
} from "@/queries/buckets";
import { useSyncGoogleEvents } from "@/queries/calendarBlocks";
import {
	useDisconnectGoogle,
	useProfile,
	useUpdateProfile,
} from "@/queries/profile";
import { supabase } from "@/utils/supabase";

const profileSchema = z.object({
	display_name: z.string().min(1, "Name is required").max(100),
	avatar_url: z.string().url("Must be a valid URL").or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function SettingsPage() {
	const { user } = useAuth();
	const userId = user?.id ?? "";

	const { data: profile, isLoading: isProfileLoading } = useProfile(userId);
	const { mutateAsync: updateProfile, isPending: isUpdating } =
		useUpdateProfile();

	const { data: buckets = [] } = useBuckets(userId);
	const createBucket = useCreateBucket(userId);
	const updateBucket = useUpdateBucket(userId);
	const deleteBucket = useDeleteBucket(userId);
	const reorderBuckets = useReorderBuckets(userId);

	const disconnectGoogle = useDisconnectGoogle();
	const syncGoogle = useSyncGoogleEvents();

	const { data: taskCounts = {} } = useQuery({
		queryKey: ["tasks-by-bucket-count", userId],
		queryFn: async () => {
			const { data } = await supabase
				.from("tasks")
				.select("bucket_id")
				.eq("user_id", userId)
				.throwOnError();

			const counts: Record<string, number> = {};
			for (const task of data ?? []) {
				const bid = task.bucket_id || "unsorted";
				counts[bid] = (counts[bid] || 0) + 1;
			}
			return counts;
		},
		enabled: !!userId,
	});

	const moveBucket = (index: number, direction: "up" | "down") => {
		const newBuckets = [...buckets];
		const targetIndex = direction === "up" ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= buckets.length) return;

		const [moved] = newBuckets.splice(index, 1);
		newBuckets.splice(targetIndex, 0, moved);

		const updates = newBuckets.map((b, i) => ({ id: b.id, position: i }));
		reorderBuckets.mutate(updates);
	};

	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: { display_name: "", avatar_url: "" },
	});

	useEffect(() => {
		if (profile) {
			form.reset({
				display_name: profile.display_name ?? "",
				avatar_url: profile.avatar_url ?? "",
			});
		}
	}, [profile, form.reset]);

	const avatarUrlValue = form.watch("avatar_url");
	const displayNameValue = form.watch("display_name");

	const initials = (displayNameValue || "")
		.split(" ")
		.map((n) => n[0])
		.join("")
		.substring(0, 2)
		.toUpperCase();

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

	if (isProfileLoading || !user) {
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

			{/* SECTION 3 — BUCKETS */}
			<div className="space-y-4">
				<div>
					<h2 className="text-lg font-semibold">Buckets</h2>
					<p className="text-sm text-muted-foreground">
						Manage your priority buckets and their colors
					</p>
				</div>

				<div className="space-y-3">
					{buckets.map((bucket, index) => (
						<div
							key={bucket.id}
							className="flex items-center gap-3 rounded-lg border border-border p-3"
						>
							<div
								className="h-3 w-3 shrink-0 rounded-full"
								style={{ backgroundColor: bucket.color || "#666672" }}
							/>

							<Input
								className="h-8"
								defaultValue={bucket.name}
								onBlur={(e) => {
									const val = e.target.value.trim();
									if (val && val !== bucket.name) {
										updateBucket.mutate({ id: bucket.id, name: val });
									}
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") e.currentTarget.blur();
								}}
							/>

							<div className="flex gap-1.5 px-2">
								{[
									"#E05555",
									"#D4943A",
									"#3A8FD4",
									"#666672",
									"#3A8A3A",
									"#8A3A8A",
								].map((color) => (
									<button
										key={color}
										type="button"
										onClick={() =>
											updateBucket.mutate({ id: bucket.id, color })
										}
										className={`h-5 w-5 rounded-full transition-all ${
											bucket.color === color
												? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
												: "hover:scale-110"
										}`}
										style={{ backgroundColor: color }}
									/>
								))}
							</div>

							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									disabled={index === 0}
									onClick={() => moveBucket(index, "up")}
								>
									<ArrowUp className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									disabled={index === buckets.length - 1}
									onClick={() => moveBucket(index, "down")}
								>
									<ArrowDown className="h-4 w-4" />
								</Button>
							</div>

							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="ghost"
										className="h-8 text-xs text-muted-foreground hover:text-destructive"
										onClick={(e) => {
											if ((taskCounts[bucket.id] || 0) === 0) {
												e.preventDefault();
												deleteBucket.mutate(bucket.id);
											}
										}}
									>
										Remove
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Remove bucket?</AlertDialogTitle>
										<AlertDialogDescription>
											This bucket has {taskCounts[bucket.id] || 0} tasks.
											Removing the bucket will move them to Unsorted.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => deleteBucket.mutate(bucket.id)}
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										>
											Remove
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					))}
				</div>

				<Button
					variant="ghost"
					className="text-muted-foreground"
					onClick={() =>
						createBucket.mutate({
							name: "New bucket",
							color: "#666672",
							position: buckets.length,
						})
					}
				>
					+ Add bucket
				</Button>
			</div>

			<Separator className="my-8" />

			{/* SECTION 4 — GOOGLE CALENDAR */}
			<div className="space-y-4">
				<div>
					<h2 className="text-lg font-semibold">Google Calendar</h2>
					<p className="text-sm text-muted-foreground">
						Sync your tasks with Google Calendar
					</p>
				</div>

				{!profile?.google_access_token ? (
					<Button
						variant="outline"
						onClick={() =>
							supabase.auth.signInWithOAuth({
								provider: "google",
								options: {
									scopes: "https://www.googleapis.com/auth/calendar",
									queryParams: {
										access_type: "offline",
										prompt: "consent",
									},
								},
							})
						}
					>
						Connect Google Calendar
					</Button>
				) : (
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 rounded-full bg-[#3A8A3A]" />
							<span className="text-[13px] font-medium text-[#e8e8f0]">
								Connected
							</span>
						</div>

						<div className="flex flex-col gap-1">
							<p className="text-[11px] text-[#666672]">
								Last synced: {new Date(profile.updated_at).toLocaleString()}
							</p>
						</div>

						<div className="flex gap-3">
							<Button
								size="sm"
								onClick={() => syncGoogle.mutate(userId)}
								disabled={syncGoogle.isPending}
							>
								{syncGoogle.isPending ? "Syncing..." : "Sync now"}
							</Button>

							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="outline" size="sm">
										Disconnect
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											Disconnect Google Calendar?
										</AlertDialogTitle>
										<AlertDialogDescription>
											Disconnecting will stop syncing events between Second
											Brain and Google Calendar. Existing blocks will remain.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => disconnectGoogle.mutate(userId)}
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										>
											Disconnect
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</div>
				)}
			</div>

			<Separator className="my-8" />

			{/* SECTION 5 — AI PREFERENCES (PLACEHOLDER) */}
			<div className="space-y-4 pb-12">
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
		</div>
	);
}
