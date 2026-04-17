import type { StateCreator } from "zustand";

export interface Block {
	id: string;
	type: string;
	[key: string]: unknown;
}

export interface DocumentSlice {
	blocks: Block[];
	isDirty: boolean;
	setBlocks: (blocks: Block[]) => void;
	updateBlock: (id: string, updates: Partial<Block>) => void;
	insertBlock: (block: Block, atIndex: number) => void;
	removeBlock: (id: string) => void;
	reorderBlocks: (fromIndex: number, toIndex: number) => void;
	markClean: () => void;
}

export const createDocumentSlice: StateCreator<DocumentSlice> = (set) => ({
	blocks: [],
	isDirty: false,
	setBlocks: (blocks) => set({ blocks }),
	updateBlock: (id, updates) =>
		set((state) => ({
			blocks: state.blocks.map((b) =>
				b.id === id ? { ...b, ...updates } : b,
			),
			isDirty: true,
		})),
	insertBlock: (block, atIndex) =>
		set((state) => {
			const blocks = [...state.blocks];
			const clampedIndex = Math.max(0, Math.min(blocks.length, atIndex));
			blocks.splice(clampedIndex, 0, block);
			return { blocks, isDirty: true };
		}),
	removeBlock: (id) =>
		set((state) => ({
			blocks: state.blocks.filter((b) => b.id !== id),
			isDirty: true,
		})),
	reorderBlocks: (from, to) =>
		set((state) => {
			const blocks = [...state.blocks];
			const [moved] = blocks.splice(from, 1);
			blocks.splice(to, 0, moved);
			return { blocks, isDirty: true };
		}),
	markClean: () => set({ isDirty: false }),
});
