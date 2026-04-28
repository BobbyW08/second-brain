import { LogOut } from "lucide-react";
import { useEffect } from "react";
import { FolderTree } from "@/components/folders/FolderTree";
import { BucketPanel } from "@/components/tasks/BucketPanel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useUIStore } from "@/stores/useUIStore";
import { supabase } from "@/utils/supabase";

export function AppSidebar() {
	const { user } = useAuth();
	const userId = user?.id ?? "";
	const {
		leftPanelMode,
		setLeftPanelMode,
		sidebarCollapsed,
		setSidebarCollapsed,
	} = useUIStore();

	const displayName =
		user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "User";
	const avatarUrl = user?.user_metadata?.avatar_url ?? "";
	const initials = displayName.charAt(0).toUpperCase();

	// ⌘B keyboard shortcut to toggle sidebar collapse
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setSidebarCollapsed(!sidebarCollapsed);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [sidebarCollapsed, setSidebarCollapsed]);

	async function handleSignOut() {
		await supabase.auth.signOut();
		window.location.href = "/login";
	}

	return (
		<aside
			className={`flex flex-col h-screen bg-[hsl(var(--secondary))] border-r border-border overflow-hidden transition-[width] duration-300 flex-shrink-0 ${
				sidebarCollapsed ? "w-0 min-w-0" : "w-[220px] min-w-[220px]"
			}`}
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

			{/* Content area — ternary swap, not stacking */}
			<div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
				{leftPanelMode === "priorities" ? (
					<BucketPanel />
				) : (
					<FolderTree userId={userId} />
				)}
			</div>

			{/* Footer — user + settings */}
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
		</aside>
	);
}
