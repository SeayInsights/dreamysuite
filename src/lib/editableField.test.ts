import { describe, expect, it } from "vitest";
import {
  cropClipPath,
  parseCfg,
  resolveBreakpointConfig,
} from "./editableField";

// Build a "char-spread" object: {"0":"{","1":"\"",...} — the corrupted shape
// parseCfg is designed to recover from.
const charSpread = (s: string) =>
  Object.fromEntries([...s].map((ch, i) => [String(i), ch]));

describe("parseCfg", () => {
  it("parses JSON strings and passes objects through", () => {
    expect(parseCfg('{"x":1}')).toEqual({ x: 1 });
    expect(parseCfg({ a: 1 })).toEqual({ a: 1 });
  });

  it("returns an empty object for empty/invalid/non-object input", () => {
    expect(parseCfg("")).toEqual({});
    expect(parseCfg("nope")).toEqual({});
    expect(parseCfg("42")).toEqual({}); // valid JSON but not an object
    expect(parseCfg(null)).toEqual({});
    expect(parseCfg(undefined)).toEqual({});
  });

  it("recovers a char-spread config back into an object", () => {
    expect(parseCfg(charSpread('{"a":1}'))).toEqual({ a: 1 });
    expect(parseCfg(JSON.stringify(charSpread('{"a":1}')))).toEqual({ a: 1 });
  });
});

describe("resolveBreakpointConfig", () => {
  it("returns the same config unchanged on desktop", () => {
    const cfg = { fontSize: "16px", blockWidth: 50 };
    expect(resolveBreakpointConfig(cfg, "desktop")).toBe(cfg);
  });

  it("applies <key>_<breakpoint> overrides onto the base key", () => {
    const resolved = resolveBreakpointConfig(
      { fontSize: "16px", fontSize_tablet: "12px" },
      "tablet",
    );
    expect(resolved.fontSize).toBe("12px");

    const mobile = resolveBreakpointConfig(
      { align_mobile: "center" },
      "mobile",
    );
    expect(mobile.align).toBe("center");
  });

  it("resets position keys unless the breakpoint overrides them", () => {
    const reset = resolveBreakpointConfig(
      { blockWidth: 50, blockOffsetY: 20 },
      "tablet",
    );
    expect(reset.blockWidth).toBe(0);
    expect(reset.blockOffsetY).toBe(0);

    const kept = resolveBreakpointConfig(
      { blockWidth: 50, blockWidth_tablet: 30 },
      "tablet",
    );
    expect(kept.blockWidth).toBe(30);
  });
});

describe("cropClipPath", () => {
  it("returns undefined without crop data or when all deltas are zero", () => {
    expect(cropClipPath({})).toBeUndefined();
    expect(cropClipPath({ cropDelta: {} })).toBeUndefined();
    expect(cropClipPath({ cropDelta: { top: 0, left: 0 } })).toBeUndefined();
    // negative values clamp to 0 -> still nothing to clip
    expect(cropClipPath({ cropDelta: { top: -5 } })).toBeUndefined();
  });

  it("emits percentage insets for normalized (<=1) values", () => {
    expect(cropClipPath({ cropDelta: { top: 0.25, left: 0.5 } })).toBe(
      "inset(25% 0% 0% 50%)",
    );
  });

  it("emits pixel insets when any value exceeds 1 (legacy)", () => {
    expect(cropClipPath({ cropDelta: { top: 10, right: 20 } })).toBe(
      "inset(10px 20px 0px 0px)",
    );
  });
});
