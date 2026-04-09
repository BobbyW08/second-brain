import { create } from "zustand";

interface TaskStore {
	selectedTaskId: string | null;
	setSelectedTaskId: (id: string | null) => void;
	dragState: {
		isDragging: boolean;
		taskId: string | null;
	};
	setDragState: (state: { isDragging: boolean; taskId: string | null }) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
	selectedTaskId: null,
	setSelectedTaskId: (id) => set({ selectedTaskId: id }),
	dragState: { isDragging: false, taskId: null },
	setDragState: (dragState) => set({ dragState }),
}));
