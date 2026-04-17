import type { StateCreator } from "zustand";

export interface DragState {
	kind: "block" | "element" | null;
	id: string | null;
	fromIndex?: number;
}

export interface TransientSlice {
	drag: DragState;
	hoveredBlockId: string | null;
	isTextEditing: boolean;
	setDrag: (drag: DragState) => void;
	setHoveredBlockId: (id: string | null) => void;
	setIsTextEditing: (v: boolean) => void;
}

export const createTransientSlice: StateCreator<TransientSlice> = (set) => ({
	drag: { kind: null, id: null },
	hoveredBlockId: null,
	isTextEditing: false,
	setDrag: (drag) => set({ drag }),
	setHoveredBlockId: (hoveredBlockId) => set({ hoveredBlockId }),
	setIsTextEditing: (isTextEditing) => set({ isTextEditing }),
});
