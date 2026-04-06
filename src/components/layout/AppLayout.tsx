import { useQueryClient } from "@tanstack/react-query";
import { Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { archiveCompletedTasks } from "@/lib/archiveTasks";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

export function AppLayout() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const userId = user?.id;

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
			<SidebarInset>
				<TopBar />
				<main className="flex-1 overflow-y-auto p-4">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
