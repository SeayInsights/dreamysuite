import { describe, expect, it } from "vitest";
import { blockContainerStyle, fieldTextStyle } from "./container";

// custom CSS properties (e.g. --block-text) aren't on CSSProperties
const styleRec = (s: object) => s as Record<string, unknown>;

describe("blockContainerStyle", () => {
  it("returns empty style/data for empty config", () => {
    expect(blockContainerStyle({})).toEqual({ style: {}, data: {} });
  });

  it("applies background, with backgroundColor winning over background.color", () => {
    expect(
      blockContainerStyle({ backgroundColor: "#fff" }).style.background,
    ).toBe("#fff");
    expect(
      blockContainerStyle({ background: { type: "color", value: "#000" } })
        .style.background,
    ).toBe("#000");
    expect(
      blockContainerStyle({
        backgroundColor: "#fff",
        background: { type: "color", value: "#000" },
      }).style.background,
    ).toBe("#fff");
  });

  it("sets text color (+ --block-text) and a border gated by hideBorder", () => {
    const { style } = blockContainerStyle({
      textColor: "red",
      borderColor: "blue",
    });
    expect(style.color).toBe("red");
    expect(styleRec(style)["--block-text"]).toBe("red");
    expect(style.border).toBe("1px solid blue");
    expect(
      blockContainerStyle({ borderColor: "blue", hideBorder: true }).style
        .border,
    ).toBeUndefined();
  });

  it("applies width/margin only for in-range blockWidth and emits data-*", () => {
    const { style, data } = blockContainerStyle({
      blockWidth: 50,
      blockMarginLeft: 10,
    });
    expect(style.width).toBe("50%");
    expect(style.marginLeft).toBe("10%");
    expect(style.marginRight).toBe("0");
    expect(data["data-bw"]).toBe("50");
    expect(data["data-bml"]).toBe("10");
    // out-of-range widths are ignored
    expect(
      blockContainerStyle({ blockWidth: 100 }).style.width,
    ).toBeUndefined();
    expect(blockContainerStyle({ blockWidth: 0 }).style.width).toBeUndefined();
  });

  it("builds transform from offsets/rotation and positions for z-index", () => {
    expect(
      blockContainerStyle({ blockOffsetX: 5, blockOffsetY: 10 }).style
        .transform,
    ).toBe("translate(5px,10px)");
    expect(blockContainerStyle({ blockRotation: 15 }).style.transform).toBe(
      "rotate(15deg)",
    );
    expect(
      blockContainerStyle({ blockOffsetX: 5, blockRotation: 15 }).style
        .transform,
    ).toBe("translate(5px,0px) rotate(15deg)");

    const z = blockContainerStyle({ blockZIndex: 3 });
    expect(z.style.position).toBe("relative");
    expect(z.style.zIndex).toBe("3");
    // with a transform present, no `position: relative` is added
    expect(
      blockContainerStyle({ blockZIndex: 3, blockOffsetX: 5 }).style.position,
    ).toBeUndefined();
  });

  it("applies blockHeight as a min-height floor with a flex layout, zeroing padding when no padding object", () => {
    const { style, data } = blockContainerStyle({ blockHeight: 300 });
    // minHeight (not height): the box grows with content instead of clipping.
    expect(style.minHeight).toBe("300px");
    expect(style.height).toBeUndefined();
    expect(style.display).toBe("flex");
    expect(style.flexDirection).toBe("column");
    expect(style.alignItems).toBe("stretch");
    expect(style.paddingTop).toBe("0");
    expect(style.paddingBottom).toBe("0");
    expect(data["data-bh"]).toBe("300");
  });

  it("applies a padding object as a reset plus longhands", () => {
    const { style } = blockContainerStyle({
      padding: { top: 10, right: 20, bottom: 30, left: 40 },
    });
    expect(style.padding).toBe("0");
    expect(style.paddingTop).toBe("10px");
    expect(style.paddingRight).toBe("20px");
    expect(style.paddingBottom).toBe("30px");
    expect(style.paddingLeft).toBe("40px");
  });

  it("regression (#283): blockHeight + padding keeps custom top/bottom (not forced 0)", () => {
    const { style } = blockContainerStyle({
      blockHeight: 300,
      padding: { top: 12, bottom: 24 },
    });
    expect(style.minHeight).toBe("300px");
    expect(style.padding).toBe("0");
    // the padding object wins — these must NOT be reset to "0"
    expect(style.paddingTop).toBe("12px");
    expect(style.paddingBottom).toBe("24px");
  });
});

describe("fieldTextStyle", () => {
  it("maps prefixed style keys", () => {
    expect(
      fieldTextStyle(
        {
          titleSize: "2rem",
          titleAlign: "center",
          titleBold: true,
          titleItalic: true,
          titleUnderline: true,
        },
        "title",
      ),
    ).toEqual({
      fontSize: "2rem",
      textAlign: "center",
      fontWeight: 700,
      fontStyle: "italic",
      textDecoration: "underline",
    });
  });

  it("ignores other prefixes and falsy flags", () => {
    expect(
      fieldTextStyle({ bodySize: "1rem", titleBold: false }, "title"),
    ).toEqual({});
  });

  // Parity with the editor's styleFromField: per-field font family + color must
  // reach the published site (previously dropped), and bare numeric sizes are
  // coerced to px so an imported unit-less size renders instead of being ignored.
  it("emits font family and color (matches editor styleFromField)", () => {
    expect(
      fieldTextStyle(
        {
          titleFontFamily: "Playfair Display",
          titleColor: "#B8921A",
          titleSize: "2rem",
        },
        "title",
      ),
    ).toEqual({
      fontFamily: "Playfair Display",
      color: "#B8921A",
      fontSize: "2rem",
    });
  });

  it("coerces a bare numeric size to px", () => {
    expect(fieldTextStyle({ headingSize: "32" }, "heading")).toEqual({
      fontSize: "32px",
    });
  });
});
