/**
 * Canvas bounds calculation and element constraint utilities.
 *
 * Implements TR-001 (constrain elements within canvas) and TR-004 (prevent negative coordinates).
 *
 * @module boundsCalculator
 */

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * Rectangular bounds defining min/max coordinates.
 */
export interface Bounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

/**
 * Element rectangle with position and dimensions.
 */
export interface Rect {
	top: number;
	left: number;
	width: number;
	height: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────

/**
 * Buffer space at the bottom of the canvas to account for potential footer UI.
 * This prevents elements from being placed too close to the bottom edge where
 * they might overlap with editor controls.
 */
const FOOTER_BUFFER_PX = 60;

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Calculate the valid bounds for element placement within a canvas container.
 *
 * @param container - The canvas container element
 * @returns Bounds object with min/max coordinates
 *
 * @example
 * ```ts
 * const bounds = getCanvasBounds(canvasElement);
 * // Returns: { minX: 0, minY: 0, maxX: 1280, maxY: 740 }
 * ```
 */
export function getCanvasBounds(container: HTMLElement): Bounds {
	const rect = container.getBoundingClientRect();

	return {
		minX: 0,
		minY: 0,
		maxX: rect.width,
		maxY: Math.max(0, rect.height - FOOTER_BUFFER_PX),
	};
}

/**
 * Constrain an element rectangle to fit within the specified bounds.
 *
 * Priority order:
 * 1. Prevent negative coordinates (top-left must be >= bounds.min)
 * 2. Keep top-left corner visible
 * 3. Clamp size if element extends beyond bounds
 *
 * @param element - The element rectangle to constrain
 * @param bounds - The bounds to constrain within
 * @returns A new Rect with constrained coordinates
 *
 * @example
 * ```ts
 * const element = { top: -50, left: 100, width: 200, height: 150 };
 * const bounds = { minX: 0, minY: 0, maxX: 1280, maxY: 800 };
 * const constrained = constrainToBounds(element, bounds);
 * // Returns: { top: 0, left: 100, width: 200, height: 150 }
 * ```
 */
export function constrainToBounds(element: Rect, bounds: Bounds): Rect {
	// Start with the original element
	let { top, left, width, height } = element;

	// Step 1: Clamp top-left to minimum bounds (prevent negative coordinates)
	top = Math.max(bounds.minY, top);
	left = Math.max(bounds.minX, left);

	// Step 2: Calculate right and bottom edges
	const right = left + width;
	const bottom = top + height;

	// Step 3: Clamp size if element extends beyond max bounds
	// Priority is keeping top-left visible, so we shrink from bottom-right
	if (right > bounds.maxX) {
		width = Math.max(0, bounds.maxX - left);
	}

	if (bottom > bounds.maxY) {
		height = Math.max(0, bounds.maxY - top);
	}

	return {
		top,
		left,
		width,
		height,
	};
}

/**
 * Check if an element is fully contained within bounds.
 *
 * @param element - The element rectangle to check
 * @param bounds - The bounds to check against
 * @returns True if element is fully within bounds
 */
export function isWithinBounds(element: Rect, bounds: Bounds): boolean {
	const right = element.left + element.width;
	const bottom = element.top + element.height;

	return (
		element.left >= bounds.minX &&
		element.top >= bounds.minY &&
		right <= bounds.maxX &&
		bottom <= bounds.maxY
	);
}

/**
 * Get the amount by which an element extends beyond bounds.
 *
 * @param element - The element rectangle to check
 * @param bounds - The bounds to check against
 * @returns Object with overflow amounts on each edge (0 if within bounds)
 */
export function getOverflow(
	element: Rect,
	bounds: Bounds,
): { top: number; right: number; bottom: number; left: number } {
	const right = element.left + element.width;
	const bottom = element.top + element.height;

	return {
		top: Math.max(0, bounds.minY - element.top),
		right: Math.max(0, right - bounds.maxX),
		bottom: Math.max(0, bottom - bounds.maxY),
		left: Math.max(0, bounds.minX - element.left),
	};
}
