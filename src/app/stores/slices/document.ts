import type { StateCreator } from "zustand";

export interface Block {
	id: string;
	type: string;
	config: Record<string, unknown>;
	sortOrder?: number;
	isVisible?: number;
}

export interface PendingOps {
	updated: Set<string>;
	inserted: Set<string>;
	removed: Set<string>;
	reordered: boolean;
}

export interface DocumentSlice {
	blocks: Block[];
	isDirty: boolean;
	pendingOps: PendingOps;
	setBlocks: (blocks: Block[]) => void;
	updateBlock: (id: string, updates: Partial<Block>) => void;
	insertBlock: (block: Block, atIndex: number) => void;
	removeBlock: (id: string) => void;
	reorderBlocks: (fromIndex: number, toIndex: number) => void;
	markClean: () => void;
}

const emptyOps = (): PendingOps => ({
	updated: new Set(),
	inserted: new Set(),
	removed: new Set(),
	reordered: false,
});

export const createDocumentSlice: StateCreator<DocumentSlice> = (set) => ({
	blocks: [],
	isDirty: false,
	pendingOps: emptyOps(),
	setBlocks: (blocks) => set({ blocks }),
	updateBlock: (id, updates) =>
		set((state) => {
			const ops = { ...state.pendingOps, updated: new Set(state.pendingOps.updated) };
			ops.updated.add(id);
			return {
				blocks: state.blocks.map((b) =>
					b.id === id ? { ...b, ...updates } : b,
				),
				isDirty: true,
				pendingOps: ops,
			};
		}),
	insertBlock: (block, atIndex) =>
		set((state) => {
			const blocks = [...state.blocks];
			const clampedIndex = Math.max(0, Math.min(blocks.length, atIndex));
			blocks.splice(clampedIndex, 0, block);
			const ops = { ...state.pendingOps, inserted: new Set(state.pendingOps.inserted) };
			ops.inserted.add(block.id);
			return { blocks, isDirty: true, pendingOps: ops };
		}),
	removeBlock: (id) =>
		set((state) => {
			const ops = { ...state.pendingOps, removed: new Set(state.pendingOps.removed) };
			ops.removed.add(id);
			ops.inserted.delete(id);
			ops.updated.delete(id);
			return {
				blocks: state.blocks.filter((b) => b.id !== id),
				isDirty: true,
				pendingOps: ops,
			};
		}),
	reorderBlocks: (from, to) =>
		set((state) => {
			const blocks = [...state.blocks];
			const [moved] = blocks.splice(from, 1);
			blocks.splice(to, 0, moved);
			return { blocks, isDirty: true, pendingOps: { ...state.pendingOps, reordered: true } };
		}),
	markClean: () => set({ isDirty: false, pendingOps: emptyOps() }),
});
