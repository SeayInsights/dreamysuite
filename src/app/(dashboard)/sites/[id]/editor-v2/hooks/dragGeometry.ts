import { type Bounds, type Rect } from "../lib/boundsCalculator";

export const COLUMNS = 12;
export const COL_PCT = 100 / COLUMNS;
export const SNAP_THRESHOLD_PX = 8;
export const GRID_SIZE_PX = 8;
export const AUTO_SCROLL_EDGE_DISTANCE_PX = 50;
export const AUTO_SCROLL_SPEED_PX = 5;

export interface RectEdges {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ScaledRect extends RectEdges {
  width: number;
  height: number;
}

export function snapToGrid(
  value: number,
  gridSize = GRID_SIZE_PX,
  threshold = SNAP_THRESHOLD_PX,
): number {
  const nearest = Math.round(value / gridSize) * gridSize;
  return Math.abs(value - nearest) <= threshold ? nearest : value;
}

export function rectsOverlap(a: RectEdges, b: RectEdges): boolean {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

export function toCanonicalBounds(bounds: Bounds, scaleFactor: number): Bounds {
  return {
    minX: bounds.minX / scaleFactor,
    minY: bounds.minY / scaleFactor,
    maxX: bounds.maxX / scaleFactor,
    maxY: bounds.maxY / scaleFactor,
  };
}

export function toScaledDomRect(
  containerRect: Pick<RectEdges, "left" | "top">,
  rect: Rect,
  scaleFactor: number,
): ScaledRect {
  const left = containerRect.left + rect.left * scaleFactor;
  const top = containerRect.top + rect.top * scaleFactor;
  const width = rect.width * scaleFactor;
  const height = rect.height * scaleFactor;

  return {
    left,
    right: left + width,
    top,
    bottom: top + height,
    width,
    height,
  };
}

export function detectCollisions(
  blockId: string,
  newBounds: RectEdges,
  allBlocks: Array<{ id: string }>,
  container: HTMLElement,
): string[] {
  const collisions: string[] = [];
  for (const block of allBlocks) {
    if (block.id === blockId) continue;
    const el = container.querySelector<HTMLElement>(
      `[data-block-id="${block.id}"]`,
    );
    if (!el) continue;
    const otherBounds = el.getBoundingClientRect();
    if (rectsOverlap(newBounds, otherBounds)) {
      collisions.push(block.id);
    }
  }
  return collisions;
}

export function handleAutoScroll(
  clientY: number,
  container: HTMLElement,
): void {
  const scrollEl = container.closest(".editor-canvas-scroll") ?? container;
  const rect = scrollEl.getBoundingClientRect();
  const distanceFromTop = clientY - rect.top;
  const distanceFromBottom = rect.bottom - clientY;

  let scrollDelta = 0;

  if (distanceFromTop < AUTO_SCROLL_EDGE_DISTANCE_PX) {
    scrollDelta = -AUTO_SCROLL_SPEED_PX;
  } else if (distanceFromBottom < AUTO_SCROLL_EDGE_DISTANCE_PX) {
    scrollDelta = AUTO_SCROLL_SPEED_PX;
  }

  if (scrollDelta !== 0) {
    scrollEl.scrollBy({ top: scrollDelta, behavior: "auto" });
  }
}
