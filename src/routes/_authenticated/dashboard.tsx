import { createFileRoute } from "@tanstack/react-router";
import { CalendarView } from "../../components/calendar/CalendarView";
import { FilesLandingPage } from "../../components/files/FilesLandingPage";
import { FolderTree } from "../../components/folders/FolderTree";
import { PageView } from "../../components/pages/PageView";
import { ErrorBoundary } from "../../components/shared/ErrorBoundary";
import { BucketPanel } from "../../components/tasks/BucketPanel";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useUIStore } from "../../stores/useUIStore";
import { requireAuth } from "../../utils/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
	beforeLoad: () => requireAuth(),
	component: DashboardPage,
});

function DashboardPage() {
	const { userId } = useCurrentUser();
	const { leftPanelMode, activePageId } = useUIStore();

	return (
		<div className="flex h-full w-full overflow-hidden">
			{/* Left Panel */}
			<div className="w-[300px] bg-[hsl(var(--secondary))] border-r border-border overflow-hidden">
				<ErrorBoundary>
					{leftPanelMode === "priorities" ? (
						<BucketPanel />
					) : (
						<FolderTree userId={userId} />
					)}
				</ErrorBoundary>
			</div>

			{/* Right Panel */}
			<div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
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
		</div>
	);
}
