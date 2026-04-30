/**
 * textEditorTypes.ts
 *
 * Shared types and pure helpers for TextEditor and its extracted hooks.
 * No React dependency — safe to import anywhere.
 */

import { type FormatCommand } from "./FloatingFormatToolbar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EditState {
  blockId: string;
  field: string;
  /** Saved text snapshot for Escape-to-revert */
  originalText: string;
  /** Saved cfg snapshot for Escape-to-revert of style keys */
  originalCfg: Record<string, unknown>;
  /** Viewport-relative DOMRect at edit-start */
  blockRect: DOMRect;
  /** The actual DOM element being edited */
  element: HTMLElement;
  /** Non-null when editing a translated language instead of primary */
  translatingLang: string | null;
  /**
   * When editing an item inside an array field (e.g. fun-facts, faq, schedule,
   * travel) these two fields are set.  `arrayKey` is the cfg key holding the
   * array (e.g. "items", "events") and `itemIndex` is the 0-based position of
   * the item being edited.  When set, `field` carries the per-item field name
   * (e.g. "title", "body", "question") and the top-level `[field]: text`
   * commit path is bypassed in favour of an immutable array update.
   */
  arrayKey?: string;
  itemIndex?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function parseCfgFromBlock(
  block: { config: Record<string, unknown> },
): Record<string, unknown> {
  return block.config;
}

export function applyStyleKeyToCfg(
  cfg: Record<string, unknown>,
  field: string,
  cmd: FormatCommand,
): Record<string, unknown> {
  const next = { ...cfg };
  switch (cmd.type) {
    case "fontName":
      next[field + "FontFamily"] = cmd.value;
      break;
    case "fontSize":
      next[field + "Size"] = cmd.value.includes("px") || cmd.value.includes("rem")
        ? cmd.value
        : cmd.value + "px";
      break;
    case "foreColor":
      next[field + "Color"] = cmd.value;
      break;
    case "justifyLeft":
      next[field + "Align"] = "left";
      break;
    case "justifyCenter":
      next[field + "Align"] = "center";
      break;
    case "justifyRight":
      next[field + "Align"] = "right";
      break;
    case "bold":
      next[field + "Bold"] = !cfg[field + "Bold"];
      break;
    case "italic":
      next[field + "Italic"] = !cfg[field + "Italic"];
      break;
    case "underline":
      next[field + "Underline"] = !cfg[field + "Underline"];
      break;
  }
  return next;
}
