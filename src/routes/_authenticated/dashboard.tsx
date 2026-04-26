import { createFileRoute } from "@tanstack/react-router";
import { CalendarView } from "../../components/calendar/CalendarView";
import { FilesLandingPage } from "../../components/files/FilesLandingPage";
import { FolderTree } from "../../components/folders/FolderTree";
import { PageView } from "../../components/pages/PageView";
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
		<div className="flex h-full w-full">
			{/* Left Panel */}
			<div
				className="w-[300px] bg-[#141418] border-r border-[#2a2a30]"
				style={{
					transition: "transform 250ms ease",
					transform:
						leftPanelMode === "files" ? "translateX(-100%)" : "translateX(0)",
				}}
			>
				{leftPanelMode === "priorities" ? (
					<BucketPanel />
				) : (
					<FolderTree userId={userId} />
				)}
			</div>

			{/* Right Panel */}
			<div
				className="flex-1 min-w-0"
				style={{
					transition: "transform 250ms ease",
					transform:
						leftPanelMode === "files" ? "translateX(0)" : "translateX(100%)",
				}}
			>
				{leftPanelMode === "priorities" ? (
					<CalendarView />
				) : activePageId ? (
					<PageView />
				) : (
					<FilesLandingPage userId={userId} />
				)}
			</div>
		</div>
	);
}
