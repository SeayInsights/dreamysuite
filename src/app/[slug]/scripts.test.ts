import { describe, it, expect } from "vitest";
import { buildBlockAnimationScript, VALID_PRESET_IDS } from "./scripts";

describe("buildBlockAnimationScript", () => {
  it("returns nothing when no valid presets are used", () => {
    expect(buildBlockAnimationScript(new Set())).toBe("");
    expect(buildBlockAnimationScript(new Set(["not-a-preset"]))).toBe("");
  });

  it("emits a module for valid presets", () => {
    const out = buildBlockAnimationScript(new Set(["fade-slide-up"]));
    expect(out).toContain('<script type="module">');
    expect(out).toContain("/animations/presets/");
  });

  it("wraps the body in an async IIFE so top-level return is legal", () => {
    // Regression: a bare top-level `return` inside <script type="module"> is a
    // SyntaxError ("Illegal return statement") that kills every block animation.
    const out = buildBlockAnimationScript(
      new Set(["fade-slide-up", "blur-in"]),
    );
    const iife = out.indexOf("(async () => {");
    expect(iife).toBeGreaterThan(-1);
    // every `return` must appear after the IIFE opener (i.e. inside a function)
    const firstReturn = out.indexOf("return");
    // (the only `return`s in the emitted script are the guard returns in the body)
    expect(firstReturn).toBeGreaterThan(iife);
    expect(out).toContain("})();");
  });

  it("only references allowlisted preset ids", () => {
    const out = buildBlockAnimationScript(
      new Set([...VALID_PRESET_IDS, "evil-preset"]),
    );
    expect(out).not.toContain("evil-preset");
  });
});
