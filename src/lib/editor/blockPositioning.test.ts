import { describe, expect, it } from "vitest";
import {
  getBlockStyle,
  getCenteredPosition,
  hasPositioning,
} from "./blockPositioning";

describe("getBlockStyle", () => {
  it("returns undefined on non-desktop breakpoints (flex stack)", () => {
    expect(getBlockStyle({ blockOffsetX: 10 }, "tablet")).toBeUndefined();
    expect(getBlockStyle({ blockOffsetX: 10 }, "mobile")).toBeUndefined();
  });

  it("positions absolutely with sensible defaults on desktop", () => {
    expect(getBlockStyle({}, "desktop")).toEqual({
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
    });
  });

  it("adds a GPU transform only when an offset is present", () => {
    expect(
      getBlockStyle({ blockOffsetX: 10, blockOffsetY: 20 }, "desktop"),
    ).toEqual({
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      transform: "translate(10px, 20px)",
      willChange: "transform",
    });
    expect(
      getBlockStyle({ blockOffsetX: 0, blockOffsetY: 0 }, "desktop"),
    ).not.toHaveProperty("transform");
  });

  it("applies blockWidth/blockMarginLeft, ignoring out-of-range widths", () => {
    expect(
      getBlockStyle({ blockWidth: 50, blockMarginLeft: 20 }, "desktop"),
    ).toEqual({ position: "absolute", top: 0, left: "20%", width: "50%" });
    // 100 and 0 are out of the (0,100) range -> fall back to 100%
    // (getBlockStyle is always defined on desktop, hence the `!`)
    expect(getBlockStyle({ blockWidth: 100 }, "desktop")!.width).toBe("100%");
    expect(getBlockStyle({ blockWidth: 0 }, "desktop")!.width).toBe("100%");
  });
});

describe("getCenteredPosition", () => {
  it("centers within the viewport minus nav height", () => {
    expect(getCenteredPosition(1000)).toEqual({
      blockOffsetY: 436,
      zIndex: 10,
    });
    expect(getCenteredPosition(1000, 100)).toEqual({
      blockOffsetY: 400,
      zIndex: 10,
    });
  });

  it("clamps to a 100px minimum for short viewports", () => {
    expect(getCenteredPosition(200)).toEqual({ blockOffsetY: 100, zIndex: 10 });
  });
});

describe("hasPositioning", () => {
  it("is true only for a non-zero numeric offset", () => {
    expect(hasPositioning({ blockOffsetX: 5 })).toBe(true);
    expect(hasPositioning({ blockOffsetY: -3 })).toBe(true);
    expect(hasPositioning({})).toBe(false);
    expect(hasPositioning({ blockOffsetX: 0, blockOffsetY: 0 })).toBe(false);
    expect(hasPositioning({ blockOffsetX: "5" })).toBe(false); // non-number ignored
  });
});
