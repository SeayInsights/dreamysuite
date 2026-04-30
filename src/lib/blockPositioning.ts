/**
 * Block Positioning - Single Source of Truth
 *
 * Implements: TR-001, TR-002
 *
 * All block positioning logic lives here. No scattered transforms.
 *
 * @example
 * const style = getBlockStyle(block.config, breakpoint);
 * // Returns: { position: 'absolute', transform: 'translate(100px, 200px)' }
 * // Or: undefined (render in flex flow)
 */

export type Breakpoint = "desktop" | "tablet" | "mobile";

export interface BlockPositionStyle {
  position: "absolute";
  top: number;
  left: number | string;
  width: string;
  transform: string;
  willChange: "transform";
}

/**
 * Calculate positioning style for a block.
 *
 * @param config - Block config (already cascaded via getEffectiveConfig)
 * @param breakpoint - Current breakpoint
 * @returns CSS style object or undefined (flex flow)
 *
 * Behavior:
 * - Desktop with offsets: Absolute positioning with GPU transform
 * - Desktop without offsets: undefined (flex flow)
 * - Tablet/Mobile: undefined (force flex stack)
 */
export function getBlockStyle(
  config: Record<string, unknown>,
  breakpoint: Breakpoint
): Partial<BlockPositionStyle> | undefined {
  // Mobile/tablet: always use flex stack (ignore positioning)
  if (breakpoint !== "desktop") {
    return undefined;
  }

  const offsetX = typeof config.blockOffsetX === "number" ? config.blockOffsetX : 0;
  const offsetY = typeof config.blockOffsetY === "number" ? config.blockOffsetY : 0;

  // blockWidth and blockMarginLeft live on the wrapper so the DOM rect matches the
  // visual element — selection boxes and resize math both read from this wrapper.
  const blockWidth =
    typeof config.blockWidth === "number" && config.blockWidth > 0 && config.blockWidth < 100
      ? config.blockWidth
      : 100;
  const marginLeft =
    typeof config.blockMarginLeft === "number" && config.blockMarginLeft > 0
      ? config.blockMarginLeft
      : 0;

  return {
    position: "absolute",
    top: 0,
    left: marginLeft > 0 ? `${marginLeft}%` : 0,
    width: `${blockWidth}%`,
    ...(offsetX !== 0 || offsetY !== 0
      ? { transform: `translate(${offsetX}px, ${offsetY}px)`, willChange: "transform" as const }
      : {}),
  };
}

/**
 * Calculate centered position for new blocks.
 *
 * @param viewportHeight - Window inner height
 * @param navHeight - Navigation header height (default 64px)
 * @returns Y offset for viewport center
 */
export function getCenteredPosition(
  viewportHeight: number,
  navHeight: number = 64
): { blockOffsetY: number; zIndex: number } {
  const centerY = (viewportHeight / 2) - navHeight;

  return {
    blockOffsetY: Math.max(100, centerY), // Minimum 100px from top
    zIndex: 10, // Appear in front of existing blocks
  };
}

/**
 * Check if a block has positioning data.
 *
 * @param config - Block config
 * @returns true if block has offsets
 */
export function hasPositioning(config: Record<string, unknown>): boolean {
  const offsetX = typeof config.blockOffsetX === "number" ? config.blockOffsetX : 0;
  const offsetY = typeof config.blockOffsetY === "number" ? config.blockOffsetY : 0;
  return offsetX !== 0 || offsetY !== 0;
}
