import { describe, expect, it } from "vitest";
import type { ThemeColors } from "@/app/stores/slices/theme";
import { themeSwatches } from "./themeSwatches";

const colors: ThemeColors = {
  primary: "#7c3aed",
  secondary: "#a78bfa",
  accent: "#f472b6",
  background: "#fdf4ff",
  text: "#1c1917",
};

describe("themeSwatches", () => {
  it("can omit the live theme background from page background presets", () => {
    expect(themeSwatches(colors, { includeBackground: false })).not.toContain(
      colors.background,
    );
  });

  it("deduplicates equal swatches so one color does not select multiple chips", () => {
    const swatches = themeSwatches({
      ...colors,
      background: "#ffffff",
      primary: "#000000",
      accent: "#000000",
      text: "#000000",
    });

    expect(swatches).toEqual([...new Set(swatches)]);
    expect(swatches.filter((color) => color === "#ffffff")).toHaveLength(1);
    expect(swatches.filter((color) => color === "#000000")).toHaveLength(1);
  });
});
