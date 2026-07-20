import type { CSSProperties } from "react";

/**
 * Structured block-container style/attrs for the React server-render path.
 *
 * The string SSR pipeline computes an equivalent inline `bsAttr` string inside
 * renderBlock's preamble. As block types migrate to React-SSR they need the same
 * container contract as a *structured* value (style object + data-* attrs) that
 * react-dom can serialize. This is the structured mirror of that computation.
 *
 * Values are kept as strings so react-dom emits them verbatim (no unit coercion),
 * matching the hand-written string pipeline byte-for-byte after normalization.
 *
 * NOTE (migration): while types are being migrated one at a time, this duplicates
 * the container logic that still lives inline in renderBlock. Once enough types use
 * the React path, the inline version is deleted and this becomes the single source.
 */
export function blockContainerStyle(cfg: Record<string, unknown>): {
  style: CSSProperties;
  data: Record<string, string>;
} {
  const style: Record<string, string> = {};
  const data: Record<string, string> = {};

  const bg = cfg.background as
    | { type?: string; value?: string }
    | null
    | undefined;
  const bgColor = cfg.backgroundColor as string | undefined;
  if (bgColor) style.background = bgColor;
  else if (bg?.type === "color" && bg?.value)
    style.background = String(bg.value);

  const tc = cfg.textColor as string | undefined;
  if (tc) {
    style.color = tc;
    (style as Record<string, string>)["--block-text"] = tc;
  }

  const bc = cfg.borderColor as string | undefined;
  if (bc && !cfg.hideBorder) style.border = `1px solid ${bc}`;

  const bw =
    typeof cfg.blockWidth === "number" &&
    cfg.blockWidth > 0 &&
    cfg.blockWidth < 100
      ? cfg.blockWidth
      : 0;
  if (bw) {
    const mlLeft =
      typeof cfg.blockMarginLeft === "number" ? cfg.blockMarginLeft : 0;
    style.width = `${bw}%`;
    style.marginLeft = mlLeft > 0 ? `${mlLeft}%` : "0";
    style.marginRight = "0";
  }

  const ox =
    typeof cfg.blockOffsetX === "number" && cfg.blockOffsetX !== 0
      ? cfg.blockOffsetX
      : 0;
  const oy =
    typeof cfg.blockOffsetY === "number" && cfg.blockOffsetY !== 0
      ? cfg.blockOffsetY
      : 0;
  const rot =
    typeof cfg.blockRotation === "number" && cfg.blockRotation !== 0
      ? cfg.blockRotation
      : 0;
  const transforms: string[] = [];
  if (ox || oy) transforms.push(`translate(${ox}px,${oy}px)`);
  if (rot) transforms.push(`rotate(${rot}deg)`);
  if (transforms.length) style.transform = transforms.join(" ");

  const zi = typeof cfg.blockZIndex === "number" ? cfg.blockZIndex : 0;
  if (zi) {
    if (!transforms.length) style.position = "relative";
    style.zIndex = String(zi);
  }

  const bh =
    typeof cfg.blockHeight === "number" && cfg.blockHeight > 0
      ? cfg.blockHeight
      : 0;
  if (bh) {
    style.height = `${bh}px`;
    style.paddingTop = "0";
    style.paddingBottom = "0";
    style.display = "flex";
    style.flexDirection = "column";
    style.alignItems = "stretch";
  }

  const pad = cfg.padding as Record<string, unknown> | null | undefined;
  if (pad && typeof pad === "object" && !Array.isArray(pad)) {
    style.padding = "0";
    if (typeof pad.top === "number") style.paddingTop = `${pad.top}px`;
    if (typeof pad.right === "number") style.paddingRight = `${pad.right}px`;
    if (typeof pad.bottom === "number") style.paddingBottom = `${pad.bottom}px`;
    if (typeof pad.left === "number") style.paddingLeft = `${pad.left}px`;
  }

  if (bw) data["data-bw"] = String(bw);
  const cfgBml =
    typeof cfg.blockMarginLeft === "number" ? cfg.blockMarginLeft : 0;
  if (cfgBml > 0) data["data-bml"] = String(cfgBml);
  if (ox) data["data-box"] = String(ox);
  if (oy) data["data-boy"] = String(oy);
  if (bh) data["data-bh"] = String(bh);
  if (rot) data["data-brot"] = String(rot);

  return { style: style as CSSProperties, data };
}
