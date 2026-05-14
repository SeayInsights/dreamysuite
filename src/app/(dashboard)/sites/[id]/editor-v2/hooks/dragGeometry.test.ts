import { describe, expect, it } from "vitest";

import {
  snapToGrid,
  rectsOverlap,
  toCanonicalBounds,
  toScaledDomRect,
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
});
