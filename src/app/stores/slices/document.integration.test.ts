import { describe, it, expect, beforeEach } from "vitest";
import { create } from "zustand";
import { createDocumentSlice, type DocumentSlice, type Block } from "./document";
import { createEditorShellSlice, type EditorShellSlice } from "./editorShell";
import { createThemeSlice, type ThemeSlice } from "./theme";
import { createSettingsSlice, type SettingsSlice } from "./settings";
import { getEffectiveConfig } from "@/app/(dashboard)/sites/[id]/editor-v2/lib/cascadeConfig";

type TestStore = DocumentSlice & EditorShellSlice & ThemeSlice & SettingsSlice;

/**
 * Integration tests demonstrating the full override workflow:
 * 1. User edits on desktop → updates base config
 * 2. User switches to tablet → edits create tablet overrides
 * 3. User switches to mobile → edits create mobile overrides
 * 4. getEffectiveConfig returns the right values at each breakpoint
 */
describe("DocumentSlice - Override Integration", () => {
	let store: ReturnType<ReturnType<typeof create<TestStore>>>;

	beforeEach(() => {
		store = create<TestStore>()((...a) => ({
			...createDocumentSlice(...a),
			...createEditorShellSlice(...a),
			...createSettingsSlice(...a),
			...createThemeSlice(...a),
		}));
	});

	it("should demonstrate full cascade workflow: desktop → tablet → mobile", () => {
		// Setup: Start with a basic block
		const block: Block = {
			id: "hero-1",
			type: "hero",
			config: { width: 100, height: 300, bgColor: "blue", padding: 20 },
		};

		store.getState().setBlocks([block]);

		// Step 1: User on desktop edits width and height
		store.getState().setBreakpoint("desktop");
		store.getState().updateBlock("hero-1", {
			config: { width: 120, height: 350, bgColor: "blue", padding: 20 },
		});

		let currentBlock = store.getState().blocks[0];
		expect(currentBlock.config).toEqual({ width: 120, height: 350, bgColor: "blue", padding: 20 });
		expect(currentBlock.overrides).toBeUndefined();

		// Verify effective configs at all breakpoints
		expect(getEffectiveConfig(currentBlock, "desktop")).toEqual({
			width: 120,
			height: 350,
			bgColor: "blue",
			padding: 20,
		});
		expect(getEffectiveConfig(currentBlock, "tablet")).toEqual({
			width: 120,
			height: 350,
			bgColor: "blue",
			padding: 20,
		});
		expect(getEffectiveConfig(currentBlock, "mobile")).toEqual({
			width: 120,
			height: 350,
			bgColor: "blue",
			padding: 20,
		});

		// Step 2: User switches to tablet, edits width to be narrower
		store.getState().setBreakpoint("tablet");
		store.getState().updateBlock("hero-1", {
			config: { width: 90 },
		});

		currentBlock = store.getState().blocks[0];
		expect(currentBlock.config).toEqual({ width: 120, height: 350, bgColor: "blue", padding: 20 });
		expect(currentBlock.overrides?.tablet).toEqual({ width: 90 });

		// Verify effective configs
		expect(getEffectiveConfig(currentBlock, "desktop")).toEqual({
			width: 120,
			height: 350,
			bgColor: "blue",
			padding: 20,
		});
		expect(getEffectiveConfig(currentBlock, "tablet")).toEqual({
			width: 90, // Override applied
			height: 350,
			bgColor: "blue",
			padding: 20,
		});
		expect(getEffectiveConfig(currentBlock, "mobile")).toEqual({
			width: 90, // Inherits from tablet
			height: 350,
			bgColor: "blue",
			padding: 20,
		});

		// Step 3: User switches to mobile, edits width to be even narrower and changes background
		store.getState().setBreakpoint("mobile");
		store.getState().updateBlock("hero-1", {
			config: { width: 60, bgColor: "red" },
		});

		currentBlock = store.getState().blocks[0];
		expect(currentBlock.config).toEqual({ width: 120, height: 350, bgColor: "blue", padding: 20 });
		expect(currentBlock.overrides?.tablet).toEqual({ width: 90 });
		expect(currentBlock.overrides?.mobile).toEqual({ width: 60, bgColor: "red" });

		// Verify final effective configs
		expect(getEffectiveConfig(currentBlock, "desktop")).toEqual({
			width: 120,
			height: 350,
			bgColor: "blue",
			padding: 20,
		});
		expect(getEffectiveConfig(currentBlock, "tablet")).toEqual({
			width: 90, // Tablet override
			height: 350,
			bgColor: "blue",
			padding: 20,
		});
		expect(getEffectiveConfig(currentBlock, "mobile")).toEqual({
			width: 60, // Mobile override
			height: 350,
			bgColor: "red", // Mobile override
			padding: 20,
		});
	});

	it("should demonstrate that desktop edits DO NOT update properties with overrides", () => {
		// Setup: Block with existing tablet override
		const block: Block = {
			id: "section-1",
			type: "section",
			config: { width: 100, height: 200, padding: 10 },
			overrides: {
				tablet: { width: 80 },
			},
		};

		store.getState().setBlocks([block]);

		// User on desktop changes width to 120
		store.getState().setBreakpoint("desktop");
		store.getState().updateBlock("section-1", {
			config: { width: 120, height: 200, padding: 10 },
		});

		const currentBlock = store.getState().blocks[0];

		// Base config is updated
		expect(currentBlock.config.width).toBe(120);

		// Tablet override is preserved (not affected by desktop change)
		expect(currentBlock.overrides?.tablet?.width).toBe(80);

		// Effective config shows that tablet KEEPS its override
		expect(getEffectiveConfig(currentBlock, "desktop").width).toBe(120);
		expect(getEffectiveConfig(currentBlock, "tablet").width).toBe(80); // Still 80, not 120!
		expect(getEffectiveConfig(currentBlock, "mobile").width).toBe(80); // Inherits from tablet
	});

	it("should allow users to progressively override more properties", () => {
		// Scenario: User starts with base config, then progressively adds overrides
		const block: Block = {
			id: "card-1",
			type: "card",
			config: { width: 100, height: 200, bgColor: "white", padding: 20, fontSize: 16 },
		};

		store.getState().setBlocks([block]);

		// First tablet override: just width
		store.getState().setBreakpoint("tablet");
		store.getState().updateBlock("card-1", {
			config: { width: 80 },
		});

		let currentBlock = store.getState().blocks[0];
		expect(currentBlock.overrides?.tablet).toEqual({ width: 80 });

		// Second tablet override: add padding
		store.getState().updateBlock("card-1", {
			config: { padding: 15 },
		});

		currentBlock = store.getState().blocks[0];
		expect(currentBlock.overrides?.tablet).toEqual({ width: 80, padding: 15 });

		// Switch to mobile, override width and fontSize
		store.getState().setBreakpoint("mobile");
		store.getState().updateBlock("card-1", {
			config: { width: 60, fontSize: 14 },
		});

		currentBlock = store.getState().blocks[0];
		expect(currentBlock.overrides?.tablet).toEqual({ width: 80, padding: 15 });
		expect(currentBlock.overrides?.mobile).toEqual({ width: 60, fontSize: 14 });

		// Verify final cascade
		expect(getEffectiveConfig(currentBlock, "desktop")).toEqual({
			width: 100,
			height: 200,
			bgColor: "white",
			padding: 20,
			fontSize: 16,
		});
		expect(getEffectiveConfig(currentBlock, "tablet")).toEqual({
			width: 80, // Override
			height: 200,
			bgColor: "white",
			padding: 15, // Override
			fontSize: 16,
		});
		expect(getEffectiveConfig(currentBlock, "mobile")).toEqual({
			width: 60, // Mobile override
			height: 200,
			bgColor: "white",
			padding: 15, // Inherited from tablet
			fontSize: 14, // Mobile override
		});
	});
});
