import { describe, expect, it } from "vitest";
import { buildStyles } from "./styles";

const bgImage = "https://example.com/background.jpg";
type StyleSettings = NonNullable<Parameters<typeof buildStyles>[0]>;

function styleSettings(overrides: Partial<StyleSettings>): StyleSettings {
  return overrides as StyleSettings;
}

describe("buildStyles background image zoom and position", () => {
  it("uses zoom and position for full-page non-overlay backgrounds", () => {
    const { css } = buildStyles(
      styleSettings({
        bgImage,
        bgImageLayer: "full-page",
        bgImageBleed: 100,
        bgImageZoom: 125,
        bgImagePositionX: 35,
        bgImagePositionY: 65,
      }),
    );

    expect(css).toContain(`background-image: url('${bgImage}')`);
    expect(css).toContain("background-size: 125% 100%");
    expect(css).toContain("background-repeat: no-repeat");
    expect(css).toContain("background-position: 35% 65%");
  });

  it("uses zoom and position for content-only non-overlay backgrounds", () => {
    const { css } = buildStyles(
      styleSettings({
        bgImage,
        bgImageLayer: "content",
        bgImageBleed: 0,
        bgImageZoom: 80,
        bgImagePositionX: 20,
        bgImagePositionY: 70,
      }),
    );

    expect(css).toContain("#site-content");
    expect(css).toContain(`background-image: url('${bgImage}')`);
    expect(css).toContain("background-size: 80% 100%");
    expect(css).toContain("background-repeat: no-repeat");
    expect(css).toContain("background-position: 20% 70%");
  });

  it("keeps cover and center fallback when zoom and position are absent", () => {
    const { css } = buildStyles(
      styleSettings({
        bgImage,
        bgImageLayer: "full-page",
        bgImageBleed: 100,
      }),
    );

    expect(css).toContain("background-size: cover");
    expect(css).toContain("background-position: center");
    expect(css).not.toContain("undefined%");
  });

  it("does not add non-overlay body background styles for overlay backgrounds", () => {
    const { css } = buildStyles(
      styleSettings({
        bgImage,
        bgImageLayer: "overlay",
        bgImageBleed: 100,
        bgImageZoom: 125,
        bgImagePositionX: 35,
        bgImagePositionY: 65,
      }),
    );

    expect(css).not.toContain(`background-image: url('${bgImage}')`);
    expect(css).not.toContain("background-size: 125% 100%");
  });
});
