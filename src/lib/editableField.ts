/**
 * Editable-field convention shared between block components and the V2
 * TextEditor. Each cfg text field can carry companion style keys that persist
 * formatting at the whole-field level (selection-level formatting is not
 * supported — matches wedding-template ergonomics).
 *
 * Companion keys (all optional):
 *   <field>FontFamily   string
 *   <field>Size         string (e.g. "1.25rem", "32px")
 *   <field>Color        string (CSS color)
 *   <field>Align        "left" | "center" | "right"
 *   <field>Bold         boolean
 *   <field>Italic       boolean
 *   <field>Underline    boolean
 */

import type { CSSProperties } from "react";

export type EditableStyleKey =
  | "FontFamily"
  | "Size"
  | "Color"
  | "Align"
  | "Bold"
  | "Italic"
  | "Underline";

export const EDITABLE_STYLE_KEYS: EditableStyleKey[] = [
  "FontFamily",
  "Size",
  "Color",
  "Align",
  "Bold",
  "Italic",
  "Underline",
];

export function styleFromField(
  cfg: Record<string, unknown>,
  field: string,
): CSSProperties {
  const style: CSSProperties = {};
  const ff = cfg[field + "FontFamily"];
  const sz = cfg[field + "Size"];
  const co = cfg[field + "Color"];
  const al = cfg[field + "Align"];
  if (typeof ff === "string" && ff) style.fontFamily = ff;
  if (typeof sz === "string" && sz) style.fontSize = sz;
  if (typeof co === "string" && co) style.color = co;
  if (al === "left" || al === "center" || al === "right") style.textAlign = al;
  if (cfg[field + "Bold"]) style.fontWeight = 700;
  if (cfg[field + "Italic"]) style.fontStyle = "italic";
  if (cfg[field + "Underline"]) style.textDecoration = "underline";
  return style;
}

/**
 * Spread onto a DOM element to mark it as an inline-editable field. Merges
 * incoming style so callers can layer their own layout styles.
 */
export function editableProps(
  cfg: Record<string, unknown>,
  field: string,
  extraStyle?: CSSProperties,
) {
  return {
    "data-editable-field": field,
    style: { ...styleFromField(cfg, field), ...(extraStyle ?? {}) },
  } as const;
}

/** Parse block.config that may be string-JSON or object. */
export function parseCfg(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      const parsed = raw.length === 0 ? {} : JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

/**
 * Inline styles for a block's root element — background color and padding
 * from the SectionToolbar controls. Merges cleanly with existing inline styles
 * by spreading last so individual longhand properties override any shorthand.
 */
export function blockSectionStyle(cfg: Record<string, unknown>): CSSProperties {
  const style: CSSProperties = {};
  if (typeof cfg.backgroundColor === "string" && cfg.backgroundColor) {
    style.background = cfg.backgroundColor;
  }
  const pad = cfg.padding;
  if (pad && typeof pad === "object" && !Array.isArray(pad)) {
    const p = pad as Record<string, unknown>;
    if (typeof p.top === "number") style.paddingTop = `${p.top}px`;
    if (typeof p.right === "number") style.paddingRight = `${p.right}px`;
    if (typeof p.bottom === "number") style.paddingBottom = `${p.bottom}px`;
    if (typeof p.left === "number") style.paddingLeft = `${p.left}px`;
  }
  return style;
}

/** Clip-path derived from a cfg.cropDelta = { top, left, right, bottom } (px). */
export function cropClipPath(cfg: Record<string, unknown>): string | undefined {
  const d = cfg.cropDelta as
    | { top?: number; left?: number; right?: number; bottom?: number }
    | undefined;
  if (!d) return undefined;
  const t = Math.max(0, d.top ?? 0);
  const l = Math.max(0, d.left ?? 0);
  const r = Math.max(0, d.right ?? 0);
  const b = Math.max(0, d.bottom ?? 0);
  if (t + l + r + b === 0) return undefined;
  return `inset(${t}px ${r}px ${b}px ${l}px)`;
}
