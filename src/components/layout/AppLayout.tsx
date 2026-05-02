import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useEffect, useRef } from "react";
import {
	Group,
	Panel,
	type PanelImperativeHandle,
	Separator,
} from "react-resizable-panels";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { CalendarView } from "@/components/calendar/CalendarView";
import { FilesLandingPage } from "@/components/files/FilesLandingPage";
import { FolderTree } from "@/components/folders/FolderTree";
import { PageView } from "@/components/pages/PageView";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { BucketPanel } from "@/components/tasks/BucketPanel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useUIStore } from "@/stores/useUIStore";
import { archiveCompletedTasks } from "@/utils/archiveTasks";
import { supabase } from "@/utils/supabase";
import { MiniCalendarDrawer } from "./MiniCalendarDrawer";
import { TopBar } from "./TopBar";

export function AppLayout() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const userId = user?.id ?? "";
	const leftPanelRef = useRef<PanelImperativeHandle>(null);
	const {
		leftPanelMode,
		setLeftPanelMode,
		activePageId,
		settingsOpen,
		setSettingsOpen,
		aiPanelOpen,
		setAiPanelOpen,
	} = useUIStore();

	const displayName =
		user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "User";
	const avatarUrl = user?.user_metadata?.avatar_url ?? "";
	const initials = displayName.charAt(0).toUpperCase();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				if (leftPanelRef.current) {
					leftPanelRef.current.isCollapsed()
						? leftPanelRef.current.expand()
						: leftPanelRef.current.collapse();
				}
			} else if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setAiPanelOpen(!aiPanelOpen);
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [aiPanelOpen, setAiPanelOpen]);

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

	async function handleSignOut() {
		await supabase.auth.signOut();
		window.location.href = "/";
	}

	return (
		<div className="flex flex-col h-screen bg-[#141418] overflow-hidden">
			{/* TopBar spans all three panels */}
			<TopBar />

			{/* Three-panel resizable layout */}
			<Group orientation="horizontal" className="flex-1 min-h-0">
				{/* Left — Priorities / Files sidebar */}
				<Panel
					panelRef={leftPanelRef}
					id="left"
					defaultSize={22}
					minSize={15}
					maxSize={35}
					collapsible
					collapsedSize={0}
					className="flex flex-col min-h-0 bg-[hsl(var(--secondary))] border-r border-border overflow-hidden"
				>
					{/* App name header */}
					<div className="flex h-12 items-center px-3 shrink-0 border-b border-border/50">
						<span className="text-[13px] font-medium text-muted-foreground">
							Second Brain
						</span>
					</div>

					{/* Mode toggle */}
					<div className="px-2 py-2 shrink-0 space-y-2">
						<div className="flex gap-1 rounded-md bg-[hsl(var(--accent))] p-0.5">
							<button
								type="button"
								onClick={() => setLeftPanelMode("priorities")}
								className={`flex-1 px-2.5 py-1.5 rounded-sm text-[11px] font-medium transition-colors ${
									leftPanelMode === "priorities"
										? "bg-[hsl(var(--background))] text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								Priorities
							</button>
							<button
								type="button"
								onClick={() => setLeftPanelMode("files")}
								className={`flex-1 px-2.5 py-1.5 rounded-sm text-[11px] font-medium transition-colors ${
									leftPanelMode === "files"
										? "bg-[hsl(var(--background))] text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								Files
							</button>
						</div>
					</div>

					{/* Content area */}
					<div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
						<ErrorBoundary>
							{leftPanelMode === "priorities" ? (
								<BucketPanel />
							) : (
								<FolderTree userId={userId} />
							)}
						</ErrorBoundary>
					</div>

					{/* Footer — user avatar */}
					<div className="shrink-0 border-t border-border/50 p-1 space-y-1">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-[hsl(var(--accent))]"
								>
									<Avatar className="h-6 w-6">
										<AvatarImage src={avatarUrl} alt={displayName} />
										<AvatarFallback>{initials}</AvatarFallback>
									</Avatar>
									<span className="flex-1 truncate text-left text-[13px] font-medium">
										{displayName}
									</span>
								</button>
							</DropdownMenuTrigger>

							<DropdownMenuContent side="top" align="start" className="w-48">
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleSignOut}
									className="flex items-center gap-2 cursor-pointer"
								>
									<LogOut className="h-4 w-4" />
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</Panel>

				<Separator className="w-px bg-[#2a2a30] hover:bg-[#3A8FD4] transition-colors cursor-col-resize" />

				{/* Center — Calendar / Editor / Capture */}
				{/* biome-ignore lint/correctness/useUniqueElementIds: Panel IDs are required for react-resizable-panels */}
				<Panel id="main" minSize={30} className="flex flex-col min-h-0">
					<div className="flex-1 min-h-0 flex flex-col">
						<ErrorBoundary>
							{leftPanelMode === "priorities" ? (
								<div className="flex-1 min-h-0">
									<CalendarView />
								</div>
							) : activePageId ? (
								<PageView pageId={activePageId} />
							) : (
								<FilesLandingPage userId={userId} />
							)}
						</ErrorBoundary>
					</div>
				</Panel>

				{/* Right — AI panel — only mounts when open */}
				{aiPanelOpen && (
					<>
						<Separator className="w-px bg-[#2a2a30] hover:bg-[#3A8FD4] transition-colors cursor-col-resize" />
						<Panel
							id="right"
							defaultSize={28}
							minSize={20}
							maxSize={45}
							collapsible
							collapsedSize={0}
							className="flex flex-col min-h-0 bg-[#18181c] border-l border-[#2a2a30]"
						>
							<AIChatPanel />
						</Panel>
					</>
				)}
			</Group>

			<MiniCalendarDrawer />
			<Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
				<SheetContent side="right" className="w-[500px] overflow-y-auto">
					<SettingsPage />
				</SheetContent>
			</Sheet>
		</div>
	);
}
