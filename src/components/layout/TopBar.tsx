import { Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { CommandDialogComponent } from "@/components/search/CommandDialog";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
	const { theme, setTheme } = useTheme();
	const [searchOpen, setSearchOpen] = useState(false);

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
				onClick={() => setSearchOpen(true)}
				aria-label="Search"
			>
				<Search className="h-4 w-4" />
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
			<CommandDialogComponent open={searchOpen} onOpenChange={setSearchOpen} />
		</header>
	);
}
