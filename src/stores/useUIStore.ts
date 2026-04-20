import { create } from "zustand";

interface UIState {
	commandOpen: boolean;
	setCommandOpen: (open: boolean) => void;

	activePageId: string | null;
	setActivePageId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
	commandOpen: false,
	setCommandOpen: (open) => set({ commandOpen: open }),

	activePageId: null,
	setActivePageId: (id) => set({ activePageId: id }),
}));
