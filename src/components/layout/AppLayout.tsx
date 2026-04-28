import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { CalendarView } from "@/components/calendar/CalendarView";
import { FilesLandingPage } from "@/components/files/FilesLandingPage";
import { PageView } from "@/components/pages/PageView";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useAuth } from "@/context/AuthContext";
import { useUIStore } from "@/stores/useUIStore";
import { archiveCompletedTasks } from "@/utils/archiveTasks";
import { AppSidebar } from "./AppSidebar";
import { MiniCalendarDrawer } from "./MiniCalendarDrawer";
import { TopBar } from "./TopBar";

export function AppLayout() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const userId = user?.id ?? "";
	const { leftPanelMode, activePageId } = useUIStore();

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
		<div className="flex h-screen w-full overflow-hidden bg-[hsl(var(--background))]">
			<AppSidebar />
			{/* min-w-0 prevents FullCalendar from blowing out the flex layout */}
			<main className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
				<TopBar />
				{/* min-h-0 is required inside a flex column to allow children to scroll */}
				<div className="flex-1 min-h-0 overflow-hidden">
					<ErrorBoundary>
						{leftPanelMode === "priorities" ? (
							<CalendarView />
						) : activePageId ? (
							<PageView pageId={activePageId} />
						) : (
							<FilesLandingPage userId={userId} />
						)}
					</ErrorBoundary>
				</div>
			</main>
			<MiniCalendarDrawer />
		</div>
	);
}
