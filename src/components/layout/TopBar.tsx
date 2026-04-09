import { MessageSquare, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { CommandDialogComponent } from "@/components/search/CommandDialog";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useUIStore } from "@/stores/useUIStore";

export function TopBar() {
	const { theme, setTheme } = useTheme();
	const setChatPanelOpen = useUIStore((s) => s.setChatPanelOpen);

	function toggleTheme() {
		setTheme(theme === "dark" ? "light" : "dark");
	}

	return (
		<header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
			<SidebarTrigger className="-ml-1" />
			<div className="flex-1" />
			<Button
				variant="ghost"
				size="icon"
				onClick={() => {
					// The CommandDialog handles keyboard shortcuts, so we just need to make sure it's accessible
					// The actual keyboard handling is in CommandDialog itself
				}}
				aria-label="Search"
			>
				<Search className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setChatPanelOpen(true)}
				className="p-2 rounded hover:bg-accent"
				aria-label="Open AI assistant"
			>
				<MessageSquare className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				onClick={toggleTheme}
				aria-label="Toggle theme"
			>
				<Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
				<Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
			</Button>
			<CommandDialogComponent />
		</header>
	);
}
