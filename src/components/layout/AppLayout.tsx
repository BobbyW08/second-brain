import { useQueryClient } from "@tanstack/react-query";
import { Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { archiveCompletedTasks } from "@/lib/archiveTasks";
import { syncGoogleCalendar } from "@/server/googleCalendar";
import { useProfile } from "@/queries/profile";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { AIChatPanel } from "@/components/ai/AIChatPanel";

export function AppLayout() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const userId = user?.id;
	
	// Get user profile to access Google tokens
	const { data: profile } = useProfile(userId ?? '');

	// Archive tasks completed before today — runs once per authenticated session
	useEffect(() => {
		if (userId) {
			archiveCompletedTasks(userId)
				.then(() => {
					queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
					queryClient.invalidateQueries({
						queryKey: ["tasks-completed-today", userId],
					});
				})
				.catch(console.error);
		}
	}, [userId, queryClient]);

	// Sync Google Calendar on app load
	useEffect(() => {
		if (userId && profile?.google_access_token && profile?.google_refresh_token) {
			syncGoogleCalendar({ 
				userId, 
				accessToken: profile.google_access_token, 
				refreshToken: profile.google_refresh_token 
			})
			.then(() => {
				queryClient.invalidateQueries({ queryKey: ['calendar-blocks'] })
			})
			.catch(console.error)
		}
	}, [userId, profile?.google_access_token, profile?.google_refresh_token, queryClient]);

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<TopBar />
				<main className="flex-1 overflow-y-auto p-4">
					<Outlet />
				</main>
				<AIChatPanel />
			</SidebarInset>
		</SidebarProvider>
	);
}
