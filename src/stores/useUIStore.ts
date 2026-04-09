import { create } from "zustand";

interface UIState {
	commandOpen: boolean;
	setCommandOpen: (open: boolean) => void;

	chatPanelOpen: boolean;
	setChatPanelOpen: (open: boolean) => void;

	activePageId: string | null;
	setActivePageId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
	commandOpen: false,
	setCommandOpen: (open) => set({ commandOpen: open }),

	chatPanelOpen: false,
	setChatPanelOpen: (open) => set({ chatPanelOpen: open }),

	activePageId: null,
	setActivePageId: (id) => set({ activePageId: id }),
}));
