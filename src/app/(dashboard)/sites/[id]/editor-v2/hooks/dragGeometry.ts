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

export interface AlignRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A rendered alignment guide. `pos` is a canvas-px coordinate: x for "v", y for "h". */
export interface AlignGuide {
  orientation: "v" | "h";
  pos: number;
}

/**
 * Snap a dragged block into alignment with its siblings and the canvas centre.
 *
 * Compares the dragged rect's left/centre/right (X) and top/centre/bottom (Y)
 * against every sibling's matching edges plus the canvas horizontal centre,
 * picking the nearest candidate within `threshold` on each axis. Returns the
 * delta to apply (dx/dy, canvas px) and the guide lines to draw. Pure — all in
 * canonical canvas pixels, so it's unit-testable independent of the DOM/scale.
 */
export function computeAlignmentSnap(
  dragged: AlignRect,
  siblings: AlignRect[],
  canvasWidth: number,
  threshold = SNAP_THRESHOLD_PX,
): { dx: number; dy: number; guides: AlignGuide[] } {
  const dX = [
    dragged.left,
    dragged.left + dragged.width / 2,
    dragged.left + dragged.width,
  ];
  const dY = [
    dragged.top,
    dragged.top + dragged.height / 2,
    dragged.top + dragged.height,
  ];

  const vLines = [canvasWidth / 2];
  const hLines: number[] = [];
  for (const s of siblings) {
    vLines.push(s.left, s.left + s.width / 2, s.left + s.width);
    hLines.push(s.top, s.top + s.height / 2, s.top + s.height);
  }

  const best = (edges: number[], lines: number[]) => {
    let dist = threshold + 1;
    let delta = 0;
    let line: number | null = null;
    for (const e of edges) {
      for (const l of lines) {
        const d = Math.abs(e - l);
        if (d < dist) {
          dist = d;
          delta = l - e;
          line = l;
        }
      }
    }
    return dist <= threshold ? { delta, line } : { delta: 0, line: null };
  };

  const x = best(dX, vLines);
  const y = best(dY, hLines);
  const guides: AlignGuide[] = [];
  if (x.line !== null) guides.push({ orientation: "v", pos: x.line });
  if (y.line !== null) guides.push({ orientation: "h", pos: y.line });
  return { dx: x.delta, dy: y.delta, guides };
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
