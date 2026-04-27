import { useQueryClient } from "@tanstack/react-query";
import { Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { useUIStore } from "@/stores/useUIStore";
import { archiveCompletedTasks } from "@/utils/archiveTasks";
import { AppSidebar } from "./AppSidebar";
import { MiniCalendarDrawer } from "./MiniCalendarDrawer";
import { TopBar } from "./TopBar";

export function AppLayout() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const userId = user?.id;
	const { leftPanelMode } = useUIStore();

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

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className="flex flex-col relative overflow-hidden">
				<TopBar />
				<div className="flex flex-1 min-h-0 overflow-hidden">
					<main className="flex-1 min-w-0 flex flex-col overflow-hidden">
						<ErrorBoundary>
							<Outlet />
						</ErrorBoundary>
					</main>
					{leftPanelMode === "files" && <MiniCalendarDrawer />}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
