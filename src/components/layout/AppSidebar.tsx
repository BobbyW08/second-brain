import { Link, useNavigate } from "@tanstack/react-router";
import { FolderTree } from "@/components/folders/FolderTree";

import { BookOpen, CalendarDays, LogOut, Settings, Table2 } from "lucide-react";
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
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabase";
import { PriorityBucket } from "@/components/tasks/PriorityBucket";

const NAV_ITEMS = [
	{ label: "Calendar", icon: CalendarDays, to: "/calendar" },
	{ label: "Pages", icon: BookOpen, to: "/pages" },
	{ label: "Tables", icon: Table2, to: "/tables" },
] as const;

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
		<Sidebar>
			<SidebarHeader className="px-4 py-3">
				<span className="text-base font-semibold tracking-tight">
					Second Brain
				</span>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{NAV_ITEMS.map(({ label, icon: Icon, to }) => (
								<SidebarMenuItem key={label}>
									<SidebarMenuButton asChild>
										<Link to={to} className="flex items-center gap-2">
											<Icon className="h-4 w-4" />
											<span>{label}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				
				{/* Priority Bucket - Task List */}
				<SidebarGroup>
					<SidebarGroupContent>
						{user ? (
							<PriorityBucket userId={user.id} />
						) : (
							<div className="p-4 text-center text-muted-foreground">
								Please sign in to view tasks
							</div>
						)}
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Folder Tree */}
				<SidebarGroup>
					<SidebarGroupContent>
						{user ? (
							<FolderTree userId={user.id} />
						) : (
							<div className="p-4 text-center text-muted-foreground">
								Please sign in to view pages
							</div>
						)}
					</SidebarGroupContent>
				</SidebarGroup>
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
