import { Outlet } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

export function AppLayout() {
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
