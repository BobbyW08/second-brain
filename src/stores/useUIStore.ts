import { create } from "zustand";

interface UIState {
	commandOpen: boolean;
	setCommandOpen: (open: boolean) => void;

	activePageId: string | null;
	setActivePageId: (id: string | null) => void;

	leftPanelMode: "priorities" | "files";
	setLeftPanelMode: (mode: "priorities" | "files") => void;

	sidebarCollapsed: boolean;
	setSidebarCollapsed: (collapsed: boolean) => void;

	openTaskId: string | null;
	setOpenTaskId: (id: string | null) => void;

	sidePanelBlockId: string | null;
	setSidePanelBlockId: (id: string | null) => void;

	miniCalendarOpen: boolean;
	setMiniCalendarOpen: (open: boolean) => void;

	settingsOpen: boolean;
	setSettingsOpen: (open: boolean) => void;

	commandMode: "navigation" | "link";
	setCommandMode: (mode: "navigation" | "link") => void;

	// New properties to address TypeScript errors
	scrollToTaskId: string | null;
	setScrollToTaskId: (id: string | null) => void;

	pendingLinkPickerCallback:
		| ((result: { id: string; type: string }) => void)
		| null;
	openLinkPicker: (
		callback: (result: { id: string; type: string }) => void,
	) => void;
	resolveLinkPicker: (result: { id: string; type: string }) => void;
}

export const useUIStore = create<UIState>((set) => ({
	commandOpen: false,
	setCommandOpen: (open) => set({ commandOpen: open }),

	commandMode: "navigation",
	setCommandMode: (mode) => set({ commandMode: mode }),

	activePageId: null,
	setActivePageId: (id) => set({ activePageId: id }),

	leftPanelMode: "priorities",
	setLeftPanelMode: (mode) => set({ leftPanelMode: mode }),

	sidebarCollapsed: false,
	setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

	openTaskId: null,
	setOpenTaskId: (id) => set({ openTaskId: id }),

	sidePanelBlockId: null,
	setSidePanelBlockId: (id) => set({ sidePanelBlockId: id }),

	miniCalendarOpen: false,
	setMiniCalendarOpen: (open) => set({ miniCalendarOpen: open }),

	settingsOpen: false,
	setSettingsOpen: (open) => set({ settingsOpen: open }),

	scrollToTaskId: null,
	setScrollToTaskId: (id) => set({ scrollToTaskId: id }),

	pendingLinkPickerCallback: null,
	openLinkPicker: (callback) => {
		set({
			pendingLinkPickerCallback: callback,
			commandOpen: true,
			commandMode: "link",
		});
	},
	resolveLinkPicker: (result) => {
		set((state) => {
			if (state.pendingLinkPickerCallback) {
				state.pendingLinkPickerCallback(result);
			}
			return { pendingLinkPickerCallback: null, commandMode: "navigation" };
		});
	},
}));
