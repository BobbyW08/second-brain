import { create } from "zustand";

interface UIState {
	commandOpen: boolean;
	setCommandOpen: (open: boolean) => void;

	activePageId: string | null;
	setActivePageId: (id: string | null) => void;

	leftPanelMode: "priorities" | "files";
	setLeftPanelMode: (mode: "priorities" | "files") => void;
}

export const useUIStore = create<UIState>((set) => ({
	commandOpen: false,
	setCommandOpen: (open) => set({ commandOpen: open }),

	activePageId: null,
	setActivePageId: (id) => set({ activePageId: id }),

	leftPanelMode: "priorities",
	setLeftPanelMode: (mode) => set({ leftPanelMode: mode }),
}));
