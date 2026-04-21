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
  } else {
    const bg = cfg.background as { type?: string; value?: string } | null | undefined;
    if (bg?.type === "color" && bg?.value) style.background = bg.value;
  }

  if (typeof cfg.blockWidth === "number" && cfg.blockWidth > 0 && cfg.blockWidth < 100) {
    style.width = `${cfg.blockWidth}%`;
    const ml = typeof cfg.blockMarginLeft === "number" ? cfg.blockMarginLeft : 0;
    style.marginLeft = ml > 0 ? `${ml}%` : "0";
    style.marginRight = "0";
  }

  const hasOffsetX = typeof cfg.blockOffsetX === "number" && cfg.blockOffsetX !== 0;
  const hasOffsetY = typeof cfg.blockOffsetY === "number" && cfg.blockOffsetY !== 0;
  const hasRotation = typeof cfg.blockRotation === "number" && cfg.blockRotation !== 0;

  const transforms: string[] = [];
  if (hasOffsetX || hasOffsetY) {
    const ox = hasOffsetX ? (cfg.blockOffsetX as number) : 0;
    const oy = hasOffsetY ? (cfg.blockOffsetY as number) : 0;
    transforms.push(`translate(${ox}px, ${oy}px)`);
  }
  if (hasRotation) {
    transforms.push(`rotate(${cfg.blockRotation}deg)`);
  }
  if (transforms.length > 0) {
    style.transform = transforms.join(" ");
  }

  if (typeof cfg.blockZIndex === "number") {
    style.position = "relative";
    style.zIndex = cfg.blockZIndex;
  }

  if (typeof cfg.blockHeight === "number" && cfg.blockHeight > 0) {
    style.height = `${cfg.blockHeight}px`;
    style.paddingTop = "0";
    style.paddingBottom = "0";
    style.display = "flex";
    style.flexDirection = "column";
    style.alignItems = "stretch";
  }

  const pad = cfg.padding;
  if (pad && typeof pad === "object" && !Array.isArray(pad)) {
    const p = pad as Record<string, unknown>;
    // Baseline ALL sides to 0 so CSS-class padding doesn't mix with user values.
    // Individual sides below override only those the user explicitly set.
    style.padding = "0";
    if (typeof p.top === "number") style.paddingTop = `${p.top}px`;
    if (typeof p.right === "number") style.paddingRight = `${p.right}px`;
    if (typeof p.bottom === "number") style.paddingBottom = `${p.bottom}px`;
    if (typeof p.left === "number") style.paddingLeft = `${p.left}px`;
  }

  return style;
}

/**
 * Resolve breakpoint-scoped config for preview. For non-desktop breakpoints,
 * any key ending in `_tablet` or `_mobile` overrides the corresponding base key.
 */
export function resolveBreakpointConfig(
	cfg: Record<string, unknown>,
	breakpoint: "desktop" | "tablet" | "mobile",
): Record<string, unknown> {
	if (breakpoint === "desktop") return cfg;
	const suffix = `_${breakpoint}`;
	const resolved = { ...cfg };
	for (const key of Object.keys(cfg)) {
		if (key.endsWith(suffix)) {
			resolved[key.slice(0, -suffix.length)] = cfg[key];
		}
	}
	// Reset position offsets on non-desktop breakpoints unless explicitly overridden
	for (const key of ["blockOffsetX", "blockOffsetY", "blockMarginLeft"]) {
		if (cfg[`${key}${suffix}`] === undefined) {
			resolved[key] = 0;
		}
	}
	return resolved;
}

/** Clip-path derived from cfg.cropDelta = { top, left, right, bottom } (0-1 normalized). */
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
  // Legacy pixel values (any > 1) use px units; normalized values use %
  if (t > 1 || l > 1 || r > 1 || b > 1) {
    return `inset(${t}px ${r}px ${b}px ${l}px)`;
  }
  return `inset(${t * 100}% ${r * 100}% ${b * 100}% ${l * 100}%)`;
}
