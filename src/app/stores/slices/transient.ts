import type { StateCreator } from "zustand";

export interface DragState {
	kind: "block" | "element" | null;
	id: string | null;
	fromIndex?: number;
}

export interface TransientSlice {
	drag: DragState;
	hoveredBlockId: string | null;
	setDrag: (drag: DragState) => void;
	setHoveredBlockId: (id: string | null) => void;
}

export const createTransientSlice: StateCreator<TransientSlice> = (set) => ({
	drag: { kind: null, id: null },
	hoveredBlockId: null,
	setDrag: (drag) => set({ drag }),
	setHoveredBlockId: (hoveredBlockId) => set({ hoveredBlockId }),
});
