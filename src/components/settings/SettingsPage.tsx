import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowUp } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import {
	useBuckets,
	useCreateBucket,
	useDeleteBucket,
	useReorderBuckets,
	useUpdateBucket,
} from "@/queries/buckets";
import {
	useDisconnectGoogle,
	useProfile,
	useUpdateProfile,
} from "@/queries/profile";
import { triggerFullSync } from "@/server/googleCalendar";
import { supabase } from "@/utils/supabase";

const profileSchema = z.object({
	display_name: z.string().min(1, "Name is required").max(100),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function SettingsPage() {
	const navigate = useNavigate();
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
	const queryClient = useQueryClient();

	const syncGoogle = useMutation({
		mutationFn: async () => {
			if (!userId) return;
			return triggerFullSync({ data: { userId } });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["calendar-blocks"] });
			queryClient.invalidateQueries({ queryKey: ["google-events"] });
		},
	});

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
		defaultValues: { display_name: "" },
	});

	useEffect(() => {
		if (profile) {
			form.reset({
				display_name: profile.display_name ?? "",
			});
		}
	}, [profile, form.reset]);

	async function handleProfileSubmit(values: ProfileFormValues) {
		if (!userId) return;
		try {
			await updateProfile({
				userId,
				updates: {
					display_name: values.display_name,
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
		<div className="flex-1 min-h-0 overflow-y-auto w-full">
			<div className="mx-auto w-full max-w-[720px] px-8 py-12">
				{/* Back button */}
				<button
					type="button"
					onClick={() => navigate({ to: "/" })}
					className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</button>

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

						{/* Email display (read-only) */}
						<div>
							<Label className="text-xs uppercase tracking-wide text-muted-foreground">
								Signed in as
							</Label>
							<p className="text-[13px] text-foreground mt-1">{user?.email}</p>
						</div>

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

						<div className="flex gap-2">
							<Button type="submit" disabled={isUpdating}>
								{isUpdating ? "Saving..." : "Save profile"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									supabase.auth.signOut().then(() => {
										navigate({ to: "/login" });
									});
								}}
							>
								Sign out
							</Button>
						</div>
					</form>
				</Form>

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

				{/* SECTION 4 — INTEGRATIONS */}
				<div className="space-y-4">
					<div>
						<h2 className="text-lg font-semibold">Integrations</h2>
						<p className="text-sm text-muted-foreground">
							Connect your favorite services
						</p>
					</div>

					<div className="space-y-3">
						{/* Google Calendar Card */}
						<div className="border border-border rounded-lg p-4 space-y-4">
							<div className="flex items-start justify-between">
								<div>
									<h3 className="font-semibold text-[13px]">Google Calendar</h3>
									<p className="text-[11px] text-muted-foreground mt-1">
										Sync your calendar events
									</p>
								</div>
								{profile?.google_access_token && (
									<Badge variant="outline" className="h-fit">
										Connected
									</Badge>
								)}
							</div>

							{!profile?.google_access_token ? (
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										supabase.auth.signInWithOAuth({
											provider: "google",
											options: {
												scopes: "https://www.googleapis.com/auth/calendar",
												queryParams: {
													access_type: "offline",
													prompt: "consent",
												},
												redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
											},
										})
									}
								>
									Connect
								</Button>
							) : (
								<div className="space-y-3">
									<div className="flex flex-col gap-1">
										<p className="text-[11px] text-muted-foreground">
											Last synced:{" "}
											{new Date(profile.updated_at).toLocaleString()}
										</p>
									</div>

									<div className="flex gap-2">
										<Button
											size="sm"
											onClick={() => syncGoogle.mutate()}
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
														Disconnecting will stop syncing events between
														Second Brain and Google Calendar. Existing blocks
														will remain.
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

						{/* Google Drive Card */}
						<div className="border border-border rounded-lg p-4 space-y-4">
							<div className="flex items-start justify-between">
								<div>
									<h3 className="font-semibold text-[13px]">Google Drive</h3>
									<p className="text-[11px] text-muted-foreground mt-1">
										Import and sync your Drive folders
									</p>
								</div>
								<Badge variant="secondary">Coming soon</Badge>
							</div>
						</div>
					</div>
				</div>

				<Separator className="my-8" />
			</div>
		</div>
	);
}
