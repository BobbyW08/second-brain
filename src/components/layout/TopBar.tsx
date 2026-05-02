import { Menu, MessageSquare, Search, Settings } from "lucide-react";
import { useState } from "react";
import { CommandDialogComponent } from "@/components/search/CommandDialog";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/useUIStore";

export function TopBar() {
	const {
		sidebarCollapsed,
		setSidebarCollapsed,
		setSettingsOpen,
		aiPanelOpen,
		setAiPanelOpen,
	} = useUIStore();
	const [searchOpen, setSearchOpen] = useState(false);

	return (
		<header className="flex h-14 shrink-0 items-center gap-2 border-b border-[#2a2a30] bg-[#141418] px-4">
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
				aria-label="Toggle sidebar"
				className="text-[#aaaaB8] hover:text-[#eaeaee]"
			>
				<Menu className="h-4 w-4" />
			</Button>
			<div className="flex-1" />
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setSearchOpen(true)}
				aria-label="Search"
				className="text-[#aaaaB8] hover:text-[#eaeaee]"
			>
				<Search className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setAiPanelOpen(!aiPanelOpen)}
				aria-label="Toggle AI panel"
				className={`text-[#aaaaB8] hover:text-[#eaeaee] ${aiPanelOpen ? "bg-[#2a2a30]" : ""}`}
			>
				<MessageSquare className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setSettingsOpen(true)}
				aria-label="Settings"
				className="text-[#aaaaB8] hover:text-[#eaeaee]"
			>
				<Settings className="h-4 w-4" />
			</Button>
			<CommandDialogComponent open={searchOpen} onOpenChange={setSearchOpen} />
		</header>
	);
}
