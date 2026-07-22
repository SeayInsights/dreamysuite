import { describe, it, expect } from "vitest";
import { contrastRatio, ensureReadableText } from "./helpers";
import { buildStyles } from "./styles";
import type { SiteSettingRow } from "./types";

describe("contrastRatio", () => {
  it("computes known WCAG ratios", () => {
    expect(Math.round(contrastRatio("#000000", "#ffffff"))).toBe(21);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 0); // 3-digit hex
  });
  it("fails open on unparseable input", () => {
    expect(contrastRatio("not-a-color", "#fff")).toBe(1);
  });
});

describe("ensureReadableText", () => {
  it("passes AA-compliant colors through unchanged", () => {
    expect(ensureReadableText("#1c1917", "#ffffff")).toBe("#1c1917");
    expect(ensureReadableText("#57534e", "#ffffff")).toBe("#57534e");
  });
  it("floors a pale body color on a light field to a dark fallback", () => {
    // The flagship site's bodyColor (#a78bfa) on its field (#fdf4ff) fails AA.
    expect(ensureReadableText("#a78bfa", "#fdf4ff")).toBe("#1c1917");
  });
  it("uses a light fallback against a dark field", () => {
    expect(ensureReadableText("#333333", "#000000")).toBe("#f5f5f4");
  });
  it("leaves unparseable colors alone", () => {
    expect(ensureReadableText("currentColor", "#fff")).toBe("currentColor");
  });
});

describe("buildStyles body-text readability floor", () => {
  it("floors a pale bodyColor to a legible value", () => {
    const s = {
      bodyColor: "#a78bfa",
      bgColor: "#fdf4ff",
    } as unknown as SiteSettingRow;
    const { css } = buildStyles(s);
    expect(css).toContain("--body-color: #1c1917");
    expect(css).toContain("--site-muted: #1c1917");
    expect(css).not.toContain("#a78bfa");
  });
  it("honors a readable bodyColor", () => {
    const s = {
      bodyColor: "#57534e",
      bgColor: "#ffffff",
    } as unknown as SiteSettingRow;
    const { css } = buildStyles(s);
    expect(css).toContain("--body-color: #57534e");
  });
});
