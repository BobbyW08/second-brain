import { Outlet } from "@tanstack/react-router";
import { SidebarProvider } from "../ui/sidebar"; // Assuming sidebar components are in ui/sidebar
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";

export function AppLayout() {
	return (
		<SidebarProvider>
			<div className="flex h-screen w-full overflow-hidden">
				<AppSidebar />
				<div className="flex flex-col flex-1 overflow-hidden">
					<TopBar />
					<main className="flex-1 overflow-y-auto p-4">
						<Outlet />
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}
