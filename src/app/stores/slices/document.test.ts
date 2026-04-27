import { describe, it, expect, beforeEach } from "vitest";
import { create } from "zustand";
import { createDocumentSlice, type DocumentSlice, type Block } from "./document";
import { createEditorShellSlice, type EditorShellSlice } from "./editorShell";
import { createThemeSlice, type ThemeSlice } from "./theme";
import { createSettingsSlice, type SettingsSlice } from "./settings";

type TestStore = DocumentSlice & EditorShellSlice & ThemeSlice & SettingsSlice;

describe("DocumentSlice - Override Detection", () => {
	let store: ReturnType<ReturnType<typeof create<TestStore>>>;

	beforeEach(() => {
		// Create a minimal test store that combines the slices
		store = create<TestStore>()((...a) => ({
			...createDocumentSlice(...a),
			...createEditorShellSlice(...a),
			...createSettingsSlice(...a),
			...createThemeSlice(...a),
		}));
	});

	it("should update base config when on desktop breakpoint", () => {
		// Setup: Add a block and set desktop breakpoint
		const block: Block = {
			id: "block-1",
			type: "header",
			config: { width: 100, height: 50, bgColor: "blue" },
		};

		store.getState().setBlocks([block]);
		store.getState().setBreakpoint("desktop");

		// Act: Update the block config
		store.getState().updateBlock("block-1", {
			config: { width: 120, height: 50, bgColor: "blue" },
		});

		// Assert: Base config should be updated, no overrides created
		const updatedBlock = store.getState().blocks[0];
		expect(updatedBlock.config).toEqual({ width: 120, height: 50, bgColor: "blue" });
		expect(updatedBlock.overrides).toBeUndefined();
	});

	it("should create tablet override when editing on tablet breakpoint", () => {
		// Setup: Add a block and set tablet breakpoint
		const block: Block = {
			id: "block-2",
			type: "hero",
			config: { width: 100, height: 50, bgColor: "blue" },
		};

		store.getState().setBlocks([block]);
		store.getState().setBreakpoint("tablet");

		// Act: Update the block config
		store.getState().updateBlock("block-2", {
			config: { width: 80 },
		});

		// Assert: Base config unchanged, tablet override created
		const updatedBlock = store.getState().blocks[0];
		expect(updatedBlock.config).toEqual({ width: 100, height: 50, bgColor: "blue" });
		expect(updatedBlock.overrides?.tablet).toEqual({ width: 80 });
		expect(updatedBlock.overrides?.mobile).toBeUndefined();
	});

	it("should create mobile override when editing on mobile breakpoint", () => {
		// Setup: Add a block and set mobile breakpoint
		const block: Block = {
			id: "block-3",
			type: "section",
			config: { width: 100, height: 50, bgColor: "blue" },
		};

		store.getState().setBlocks([block]);
		store.getState().setBreakpoint("mobile");

		// Act: Update the block config
		store.getState().updateBlock("block-3", {
			config: { width: 60, bgColor: "red" },
		});

		// Assert: Base config unchanged, mobile override created
		const updatedBlock = store.getState().blocks[0];
		expect(updatedBlock.config).toEqual({ width: 100, height: 50, bgColor: "blue" });
		expect(updatedBlock.overrides?.mobile).toEqual({ width: 60, bgColor: "red" });
		expect(updatedBlock.overrides?.tablet).toBeUndefined();
	});

	it("should merge with existing tablet overrides", () => {
		// Setup: Block with existing tablet overrides
		const block: Block = {
			id: "block-4",
			type: "header",
			config: { width: 100, height: 50, bgColor: "blue" },
			overrides: {
				tablet: { width: 80 },
			},
		};

		store.getState().setBlocks([block]);
		store.getState().setBreakpoint("tablet");

		// Act: Update a different property
		store.getState().updateBlock("block-4", {
			config: { bgColor: "green" },
		});

		// Assert: Existing override preserved, new property added
		const updatedBlock = store.getState().blocks[0];
		expect(updatedBlock.config).toEqual({ width: 100, height: 50, bgColor: "blue" });
		expect(updatedBlock.overrides?.tablet).toEqual({ width: 80, bgColor: "green" });
	});

	it("should merge with existing mobile overrides", () => {
		// Setup: Block with existing mobile overrides
		const block: Block = {
			id: "block-5",
			type: "section",
			config: { width: 100, height: 50, bgColor: "blue", padding: 10 },
			overrides: {
				mobile: { width: 60 },
			},
		};

		store.getState().setBlocks([block]);
		store.getState().setBreakpoint("mobile");

		// Act: Update a different property
		store.getState().updateBlock("block-5", {
			config: { bgColor: "red", padding: 5 },
		});

		// Assert: Existing override preserved, new properties added
		const updatedBlock = store.getState().blocks[0];
		expect(updatedBlock.config).toEqual({ width: 100, height: 50, bgColor: "blue", padding: 10 });
		expect(updatedBlock.overrides?.mobile).toEqual({ width: 60, bgColor: "red", padding: 5 });
	});

	it("should preserve tablet overrides when editing mobile", () => {
		// Setup: Block with existing tablet overrides
		const block: Block = {
			id: "block-6",
			type: "hero",
			config: { width: 100, height: 50, bgColor: "blue" },
			overrides: {
				tablet: { width: 80 },
			},
		};

		store.getState().setBlocks([block]);
		store.getState().setBreakpoint("mobile");

		// Act: Create mobile override
		store.getState().updateBlock("block-6", {
			config: { width: 60 },
		});

		// Assert: Both tablet and mobile overrides exist
		const updatedBlock = store.getState().blocks[0];
		expect(updatedBlock.config).toEqual({ width: 100, height: 50, bgColor: "blue" });
		expect(updatedBlock.overrides?.tablet).toEqual({ width: 80 });
		expect(updatedBlock.overrides?.mobile).toEqual({ width: 60 });
	});

	it("should allow non-config updates on any breakpoint", () => {
		// Setup: Block on tablet breakpoint
		const block: Block = {
			id: "block-7",
			type: "section",
			config: { width: 100 },
			isVisible: 1,
		};

		store.getState().setBlocks([block]);
		store.getState().setBreakpoint("tablet");

		// Act: Update non-config property (isVisible)
		store.getState().updateBlock("block-7", {
			isVisible: 0,
		});

		// Assert: isVisible updated, no overrides created
		const updatedBlock = store.getState().blocks[0];
		expect(updatedBlock.isVisible).toBe(0);
		expect(updatedBlock.config).toEqual({ width: 100 });
		expect(updatedBlock.overrides).toBeUndefined();
	});

	it("should handle combined config and non-config updates on tablet", () => {
		// Setup: Block on tablet breakpoint
		const block: Block = {
			id: "block-8",
			type: "header",
			config: { width: 100, height: 50 },
			isVisible: 1,
			sortOrder: 0,
		};

		store.getState().setBlocks([block]);
		store.getState().setBreakpoint("tablet");

		// Act: Update both config and non-config properties
		store.getState().updateBlock("block-8", {
			config: { width: 80 },
			isVisible: 0,
			sortOrder: 1,
		});

		// Assert: Config routed to overrides, other properties updated normally
		const updatedBlock = store.getState().blocks[0];
		expect(updatedBlock.config).toEqual({ width: 100, height: 50 });
		expect(updatedBlock.overrides?.tablet).toEqual({ width: 80 });
		expect(updatedBlock.isVisible).toBe(0);
		expect(updatedBlock.sortOrder).toBe(1);
	});

	it("should mark block as dirty and add to pending ops", () => {
		// Setup: Block on mobile breakpoint
		const block: Block = {
			id: "block-9",
			type: "section",
			config: { width: 100 },
		};

		store.getState().setBlocks([block]);
		store.getState().setBreakpoint("mobile");

		// Act: Update config
		store.getState().updateBlock("block-9", {
			config: { width: 60 },
		});

		// Assert: Store is dirty and block is in pending ops
		expect(store.getState().isDirty).toBe(true);
		expect(store.getState().pendingOps.updated.has("block-9")).toBe(true);
	});

	it("should handle empty config updates gracefully", () => {
		// Setup: Block on tablet breakpoint
		const block: Block = {
			id: "block-10",
			type: "header",
			config: { width: 100 },
		};

		store.getState().setBlocks([block]);
		store.getState().setBreakpoint("tablet");

		// Act: Update with empty config object
		store.getState().updateBlock("block-10", {
			config: {},
		});

		// Assert: Should create override with empty object (edge case)
		const updatedBlock = store.getState().blocks[0];
		expect(updatedBlock.config).toEqual({ width: 100 });
		expect(updatedBlock.overrides?.tablet).toEqual({});
	});
});
