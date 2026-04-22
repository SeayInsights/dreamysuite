/**
 * Responsive scaling utilities for published/preview and editor render paths.
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

/**
 * Returns true if >80% of a block's desktop extent falls outside the
 * visible content column — meaning it's a purely decorative element
 * that should be hidden on mobile/tablet.
 */
export function isDecorativeOffscreen(
  cfg: Record<string, unknown>,
  designedAtWidth: number,
): boolean {
  const bw = typeof cfg.blockWidth === "number" ? cfg.blockWidth : 100;
  const ml = typeof cfg.blockMarginLeft === "number" ? cfg.blockMarginLeft : 0;
  const ox = typeof cfg.blockOffsetX === "number" ? cfg.blockOffsetX : 0;
  const widthPx = (bw / 100) * designedAtWidth;
  if (widthPx <= 0) return false;
  const leftPx = (ml / 100) * designedAtWidth + ox;
  const visLeft = Math.max(0, leftPx);
  const visRight = Math.min(designedAtWidth, leftPx + widthPx);
  return Math.max(0, visRight - visLeft) / widthPx < 0.2;
}
