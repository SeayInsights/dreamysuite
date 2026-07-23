import { describe, expect, it } from "vitest";

import {
  snapToGrid,
  rectsOverlap,
  toCanonicalBounds,
  toScaledDomRect,
  computeAlignmentSnap,
} from "./dragGeometry";

describe("dragGeometry", () => {
  it("snaps values when they are within the threshold", () => {
    expect(snapToGrid(17, 8, 1)).toBe(16);
    expect(snapToGrid(18, 8, 1)).toBe(18);
  });

  it("detects overlapping rect edges", () => {
    expect(
      rectsOverlap(
        { left: 10, right: 30, top: 10, bottom: 30 },
        { left: 25, right: 40, top: 25, bottom: 40 },
      ),
    ).toBe(true);
    expect(
      rectsOverlap(
        { left: 10, right: 30, top: 10, bottom: 30 },
        { left: 31, right: 40, top: 10, bottom: 30 },
      ),
    ).toBe(false);
  });

  it("converts screen bounds to canonical canvas bounds", () => {
    expect(
      toCanonicalBounds({ minX: 0, minY: 0, maxX: 640, maxY: 320 }, 0.5),
    ).toEqual({ minX: 0, minY: 0, maxX: 1280, maxY: 640 });
  });

  it("converts canonical rects back to scaled DOM coordinates", () => {
    const rect = toScaledDomRect(
      { left: 100, top: 200 },
      { left: 20, top: 30, width: 40, height: 50 },
      0.5,
    );

    expect({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    }).toEqual({ left: 110, top: 215, width: 20, height: 25 });
  });

  describe("computeAlignmentSnap", () => {
    const canvasWidth = 1000;

    it("snaps a left edge to a sibling's left within threshold", () => {
      const dragged = { left: 103, top: 500, width: 200, height: 100 };
      const siblings = [{ left: 100, top: 0, width: 200, height: 80 }];
      const { dx, guides } = computeAlignmentSnap(
        dragged,
        siblings,
        canvasWidth,
      );
      expect(dx).toBe(-3); // 103 -> 100
      expect(guides).toContainEqual({ orientation: "v", pos: 100 });
    });

    it("snaps horizontal centre to the canvas centre", () => {
      // dragged centre-x = 500+? ; put left so centre is 3px off canvas centre (500)
      const dragged = { left: 397, top: 10, width: 200, height: 100 }; // centre 497
      const { dx } = computeAlignmentSnap(dragged, [], canvasWidth);
      expect(dx).toBe(3); // centre 497 -> 500
    });

    it("does not snap beyond the threshold", () => {
      const dragged = { left: 140, top: 500, width: 200, height: 100 };
      const siblings = [{ left: 100, top: 0, width: 200, height: 80 }];
      const { dx, dy, guides } = computeAlignmentSnap(
        dragged,
        siblings,
        canvasWidth,
      );
      expect(dx).toBe(0);
      expect(dy).toBe(0);
      expect(guides).toHaveLength(0);
    });

    it("snaps a top edge to a sibling's bottom (vertical rhythm)", () => {
      const dragged = { left: 0, top: 182, width: 200, height: 100 };
      const siblings = [{ left: 600, top: 0, width: 200, height: 180 }]; // bottom = 180
      const { dy, guides } = computeAlignmentSnap(
        dragged,
        siblings,
        canvasWidth,
      );
      expect(dy).toBe(-2); // top 182 -> 180
      expect(guides).toContainEqual({ orientation: "h", pos: 180 });
    });
  });
});
