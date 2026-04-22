/**
 * Responsive scaling utilities for published and preview render paths.
 * The editor is NOT affected — scaling only applies to viewer-facing output.
 */

export const DEFAULT_DESIGNED_AT_WIDTH = 1440;
const WIDE_THRESHOLD = 800;

/**
 * Detect the designedAtWidth for pages that don't have it stored yet.
 * If any block uses a blockMarginLeft or blockOffsetX > 800, the design
 * was likely created at 1440px canvas width; otherwise assume 1280.
 */
export function detectDesignedAtWidth(
  blocks: Array<{ config: Record<string, unknown> }>,
): number {
  const hasWideLayout = blocks.some((b) => {
    const ml = Number(b.config.blockMarginLeft ?? 0);
    const ox = Number(b.config.blockOffsetX ?? 0);
    return ml > WIDE_THRESHOLD || ox > WIDE_THRESHOLD;
  });
  return hasWideLayout ? 1440 : 1280;
}
