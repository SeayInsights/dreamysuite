/**
 * Out-of-bounds element migration — Task T004
 *
 * Fixes existing blocks that are positioned outside canvas bounds or have
 * negative coordinates. This migration runs on editor load to fix legacy data
 * from before bounds constraints were enforced (TR-001, TR-004).
 *
 * Implements TR-003: migrate existing out-of-bounds elements
 *
 * @module migrateOutOfBoundsElements
 */

import { constrainToBounds, type Bounds, type Rect } from "@/app/(dashboard)/sites/[id]/editor-v2/lib/boundsCalculator";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Block {
	id: string;
	type: string;
	config: Record<string, unknown>;
	sortOrder?: number;
	isVisible?: number;
	overrides?: {
		tablet?: Partial<Record<string, unknown>>;
		mobile?: Partial<Record<string, unknown>>;
	};
}

/**
 * Result of an out-of-bounds migration
 */
export interface MigrationResult {
	/** Migrated blocks (includes both changed and unchanged) */
	blocks: Block[];
	/** Count of blocks that were fixed */
	fixed: number;
	/** Count of blocks that did not need fixing */
	unchanged: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────

/**
 * Desktop canvas bounds for migration.
 * Uses desktop breakpoint (1280px width) as the reference canvas size.
 * Height is generous to avoid false positives on long pages.
 */
const DESKTOP_CANVAS_BOUNDS: Bounds = {
	minX: 0,
	minY: 0,
	maxX: 1280,
	maxY: 10000, // Generous height for long-form pages
};

/**
 * Buffer at bottom for footer UI (matches boundsCalculator.ts)
 */
const FOOTER_BUFFER_PX = 60;

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Extract position and size from block config.
 * Returns null if block doesn't have positioning data.
 */
function extractRect(config: Record<string, unknown>): Rect | null {
	const top = typeof config.top === "number" ? config.top : null;
	const left = typeof config.left === "number" ? config.left : null;
	const width = typeof config.width === "number" ? config.width : null;
	const height = typeof config.height === "number" ? config.height : null;

	// Block must have all position/size properties to be considered positioned
	if (top === null || left === null || width === null || height === null) {
		return null;
	}

	return { top, left, width, height };
}

/**
 * Check if a positioned element is out of bounds.
 * Returns true if element has negative coordinates or extends beyond canvas.
 */
function isOutOfBounds(rect: Rect, bounds: Bounds): boolean {
	const hasNegativeCoords = rect.top < bounds.minY || rect.left < bounds.minX;
	const exceedsMaxBounds =
		rect.left + rect.width > bounds.maxX ||
		rect.top + rect.height > bounds.maxY - FOOTER_BUFFER_PX;

	return hasNegativeCoords || exceedsMaxBounds;
}

/**
 * Apply constrained position/size to block config.
 * Returns a new config object with updated coordinates.
 */
function applyConstrainedRect(
	config: Record<string, unknown>,
	constrained: Rect,
): Record<string, unknown> {
	return {
		...config,
		top: constrained.top,
		left: constrained.left,
		width: constrained.width,
		height: constrained.height,
	};
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Migrate blocks with out-of-bounds positions or negative coordinates.
 *
 * For each block:
 * 1. Check if it has positioning data (top, left, width, height)
 * 2. If positioned, check if it's out of bounds or has negative coords
 * 3. If out of bounds, constrain to canvas bounds using boundsCalculator
 * 4. Update block config with constrained coordinates
 *
 * This migration is:
 * - Idempotent: safe to run multiple times
 * - Backward compatible: doesn't break valid data
 * - Non-destructive: only updates out-of-bounds elements
 *
 * @param blocks - Array of blocks to potentially migrate
 * @returns Migration result with updated blocks and fix stats
 *
 * @example
 * ```ts
 * const result = migrateOutOfBoundsElements([
 *   { id: "1", type: "text", config: { top: -50, left: 100, width: 200, height: 150 } },
 *   { id: "2", type: "image", config: { url: "photo.jpg" } }, // No positioning
 * ]);
 * // result.blocks: [
 * //   { id: "1", type: "text", config: { top: 0, left: 100, width: 200, height: 150 } },
 * //   { id: "2", type: "image", config: { url: "photo.jpg" } }
 * // ]
 * // result.fixed: 1
 * // result.unchanged: 1
 * ```
 */
export function migrateOutOfBoundsElements(blocks: Block[]): MigrationResult {
	let fixed = 0;

	const migratedBlocks = blocks.map((block) => {
		// Extract positioning from config
		const rect = extractRect(block.config);

		// Skip blocks without positioning data
		if (!rect) {
			return block;
		}

		// Check if element is out of bounds
		if (!isOutOfBounds(rect, DESKTOP_CANVAS_BOUNDS)) {
			return block;
		}

		// Constrain to bounds
		const constrained = constrainToBounds(rect, DESKTOP_CANVAS_BOUNDS);

		// Apply constrained coordinates
		const updatedConfig = applyConstrainedRect(block.config, constrained);

		fixed++;

		return {
			...block,
			config: updatedConfig,
		};
	});

	return {
		blocks: migratedBlocks,
		fixed,
		unchanged: blocks.length - fixed,
	};
}

/**
 * Check if a block needs bounds migration.
 *
 * @param block - Block to check
 * @returns True if block has positioning data and is out of bounds
 *
 * @example
 * ```ts
 * needsMigration({ id: "1", type: "text", config: { top: -10, left: 0, width: 100, height: 100 } }) // true
 * needsMigration({ id: "2", type: "text", config: { top: 100, left: 100, width: 100, height: 100 } }) // false
 * needsMigration({ id: "3", type: "text", config: { content: "Hello" } }) // false (no positioning)
 * ```
 */
export function needsMigration(block: Block): boolean {
	const rect = extractRect(block.config);
	if (!rect) return false;
	return isOutOfBounds(rect, DESKTOP_CANVAS_BOUNDS);
}
