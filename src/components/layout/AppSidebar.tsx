import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings } from "lucide-react";
import { BucketPanel } from "@/components/tasks/BucketPanel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";

export function AppSidebar() {
	const { user } = useAuth();
	const navigate = useNavigate();

	const displayName =
		user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "User";
	const avatarUrl = user?.user_metadata?.avatar_url ?? "";
	const initials = displayName.charAt(0).toUpperCase();

	async function handleSignOut() {
		await supabase.auth.signOut();
		navigate({ to: "/login" });
	}

	return (
		<Sidebar collapsible="offcanvas">
			<SidebarContent className="p-0">
				<BucketPanel />
			</SidebarContent>

			<SidebarFooter className="p-2">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
						>
							<Avatar className="h-7 w-7">
								<AvatarImage src={avatarUrl} alt={displayName} />
								<AvatarFallback>{initials}</AvatarFallback>
							</Avatar>
							<span className="flex-1 truncate text-left">{displayName}</span>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent side="top" align="start" className="w-52">
						<DropdownMenuItem asChild>
							<Link to="/settings" className="flex items-center gap-2">
								<Settings className="h-4 w-4" />
								Settings
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleSignOut}
							className="flex items-center gap-2"
						>
							<LogOut className="h-4 w-4" />
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
