import { describe, expect, it } from "vitest";

import {
  editorBgImageStyle,
  getFrameScale,
  resolveEditorBgImageLayer,
} from "./BreakpointFrame";

describe("BreakpointFrame editor background image placement", () => {
  it("resolves overlay mode explicitly", () => {
    expect(resolveEditorBgImageLayer("overlay", 0)).toBe("overlay");
  });

  it("resolves full-page non-overlay modes to the frame surface", () => {
    expect(resolveEditorBgImageLayer("full-page", 0)).toBe("full-page");
    expect(resolveEditorBgImageLayer("fullPage", 0)).toBe("full-page");
    expect(resolveEditorBgImageLayer("page", 0)).toBe("full-page");
    expect(resolveEditorBgImageLayer("behind", 1)).toBe("full-page");
    expect(resolveEditorBgImageLayer(undefined, 1)).toBe("full-page");
  });

  it("resolves content-only modes and legacy bleed fallback to the content surface", () => {
    expect(resolveEditorBgImageLayer("content", 1)).toBe("content");
    expect(resolveEditorBgImageLayer("content-only", 1)).toBe("content");
    expect(resolveEditorBgImageLayer("content_only", 1)).toBe("content");
    expect(resolveEditorBgImageLayer("behind", 0)).toBe("content");
    expect(resolveEditorBgImageLayer(undefined, 0)).toBe("content");
  });

  it("builds zoom and position styles with safe fallbacks", () => {
    expect(
      editorBgImageStyle({
        bgImage: "https://cdn.example/bg.jpg",
        bgImageZoom: 135,
        bgImagePositionX: 25,
        bgImagePositionY: 70,
      }),
    ).toMatchObject({
      backgroundImage: "url('https://cdn.example/bg.jpg')",
      backgroundSize: "135% 100%",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "25% 70%",
    });

    expect(
      editorBgImageStyle({
        bgImage: "https://cdn.example/bg.jpg",
        bgImageZoom: null,
        bgImagePositionX: undefined,
        bgImagePositionY: "",
      }),
    ).toMatchObject({
      backgroundSize: "100% 100%",
      backgroundPosition: "50% 50%",
    });
  });
});

describe("BreakpointFrame scale calculation", () => {
  it("scales down from the measured canvas content box and never scales up", () => {
    expect(getFrameScale(1280, 1280)).toBe(1);
    expect(getFrameScale(1600, 1280)).toBe(1);
    expect(getFrameScale(640, 1280)).toBe(0.5);
  });

  it("guards against invalid measured widths", () => {
    expect(getFrameScale(-100, 1280)).toBe(0);
    expect(getFrameScale(100, 0)).toBe(1);
  });
});
