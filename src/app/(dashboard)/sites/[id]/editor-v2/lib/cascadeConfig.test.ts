import { describe, it, expect } from "vitest";
import { getEffectiveConfig, getEffectiveOrder } from "./cascadeConfig";
import type { Block } from "@/app/stores/slices/document";

describe("cascadeConfig.getEffectiveConfig", () => {
  it("should return base config unchanged for desktop breakpoint", () => {
    const block: Block = {
      id: "1",
      type: "header",
      config: { width: 100, height: 50, bgColor: "blue" },
    };

    const result = getEffectiveConfig(block, "desktop");

    expect(result).toEqual({ width: 100, height: 50, bgColor: "blue" });
  });

  it("should merge base config with tablet overrides when no mobile overrides exist", () => {
    const block: Block = {
      id: "2",
      type: "hero",
      config: { width: 100, height: 50, bgColor: "blue", padding: 10 },
      overrides: {
        tablet: { width: 80 },
      },
    };

    const result = getEffectiveConfig(block, "tablet");

    expect(result).toEqual({
      width: 80,
      height: 50,
      bgColor: "blue",
      padding: 10,
    });
  });

  it("should cascade through tablet and apply mobile overrides with highest priority", () => {
    const block: Block = {
      id: "3",
      type: "section",
      config: {
        width: 100,
        height: 50,
        bgColor: "blue",
        padding: 10,
        fontSize: 16,
      },
      overrides: {
        tablet: { width: 80 },
        mobile: { width: 60, bgColor: "red" },
      },
    };

    const result = getEffectiveConfig(block, "mobile");

    expect(result).toEqual({
      width: 60,
      height: 50,
      bgColor: "red",
      padding: 10,
      fontSize: 16,
    });
  });

  it("should handle mobile overrides without tablet overrides", () => {
    const block: Block = {
      id: "4",
      type: "button",
      config: { width: 100, height: 40, bgColor: "green" },
      overrides: {
        mobile: { width: 50 },
      },
    };

    const result = getEffectiveConfig(block, "mobile");

    expect(result).toEqual({ width: 50, height: 40, bgColor: "green" });
  });

  it("should return base config when no overrides exist at all", () => {
    const block: Block = {
      id: "5",
      type: "text",
      config: { fontSize: 14, color: "black" },
    };

    const desktop = getEffectiveConfig(block, "desktop");
    const tablet = getEffectiveConfig(block, "tablet");
    const mobile = getEffectiveConfig(block, "mobile");

    expect(desktop).toEqual({ fontSize: 14, color: "black" });
    expect(tablet).toEqual({ fontSize: 14, color: "black" });
    expect(mobile).toEqual({ fontSize: 14, color: "black" });
  });

  it("should create a new object and not mutate the original block", () => {
    const block: Block = {
      id: "6",
      type: "card",
      config: { width: 100, height: 50 },
      overrides: {
        tablet: { width: 80 },
      },
    };

    const original = JSON.stringify(block);
    getEffectiveConfig(block, "tablet");
    const after = JSON.stringify(block);

    expect(original).toBe(after);
  });
});

describe("cascadeConfig.getEffectiveOrder", () => {
  it("should use the fallback index when no sortOrder exists", () => {
    const block: Block = {
      id: "1",
      type: "header",
      config: { width: 100 },
    };

    expect(getEffectiveOrder(block, "desktop", 5)).toBe(5);
    expect(getEffectiveOrder(block, "tablet", 5)).toBe(5);
    expect(getEffectiveOrder(block, "mobile", 5)).toBe(5);
  });

  it("should inherit base sortOrder across breakpoints", () => {
    const block: Block = {
      id: "2",
      type: "hero",
      config: { width: 100 },
      sortOrder: 3,
    };

    expect(getEffectiveOrder(block, "desktop", 99)).toBe(3);
    expect(getEffectiveOrder(block, "tablet", 99)).toBe(3);
    expect(getEffectiveOrder(block, "mobile", 99)).toBe(3);
  });

  it("should let mobile inherit tablet sortOrder when no mobile override exists", () => {
    const block: Block = {
      id: "3",
      type: "section",
      config: { width: 100 },
      sortOrder: 1,
      overrides: {
        tablet: { sortOrder: 2 },
      },
    };

    expect(getEffectiveOrder(block, "desktop", 99)).toBe(1);
    expect(getEffectiveOrder(block, "tablet", 99)).toBe(2);
    expect(getEffectiveOrder(block, "mobile", 99)).toBe(2);
  });

  it("should prefer mobile sortOrder over tablet and base values", () => {
    const block: Block = {
      id: "4",
      type: "gallery",
      config: { width: 100 },
      sortOrder: 1,
      overrides: {
        tablet: { sortOrder: 2 },
        mobile: { sortOrder: 3 },
      },
    };

    expect(getEffectiveOrder(block, "desktop", 99)).toBe(1);
    expect(getEffectiveOrder(block, "tablet", 99)).toBe(2);
    expect(getEffectiveOrder(block, "mobile", 99)).toBe(3);
  });
});
