"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
} from "react";
import { createPortal } from "react-dom";

import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";
import { FloatingFormatToolbar, type FormatCommand } from "./FloatingFormatToolbar";
import { useFloatingToolbar } from "../hooks/useFloatingToolbar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditState {
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

function parseCfgFromBlock(
  block: { config: Record<string, unknown> },
): Record<string, unknown> {
  return block.config;
}

function applyStyleKeyToCfg(
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * TextEditor
 *
 * Activates on dblclick of any element with `data-editable-field="<cfgKey>"`.
 * Flips contentEditable directly on that element (no overlay — true in-place
 * editing). On blur or Escape, writes the field value + style keys back into
 * cfg via updateBlock. Floating toolbar changes persist immediately.
 *
 * Mount this as a sibling of the canvas content inside EditorOverlay.
 * No ref needed — it attaches listeners to the container.
 */
export function TextEditor({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}): JSX.Element {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const setIsTextEditing = useEditorStore((s) => s.setIsTextEditing);
  const setTranslation = useEditorStore((s) => s.setTranslation);

  const [editState, setEditState] = useState<EditState | null>(null);
  const toolbar = useFloatingToolbar();

  // Keep a ref to editState so event handlers close over the ref, not stale state
  const editStateRef = useRef<EditState | null>(null);
  editStateRef.current = editState;

  // -------------------------------------------------------------------------
  // Commit / discard
  // -------------------------------------------------------------------------

  const commit = useCallback(
    (state: EditState) => {
      const el = state.element;
      const text = el.innerText.trim();

      if (state.translatingLang) {
        // Array-item fields are not routed through the translation system.
        setTranslation(state.blockId, state.translatingLang, state.field, text);
      } else {
        const currentBlock = useEditorStore
          .getState()
          .blocks.find((b) => b.id === state.blockId);
        if (!currentBlock) return;

        const currentCfg = parseCfgFromBlock(currentBlock);

        if (
          state.arrayKey !== undefined &&
          state.itemIndex !== undefined
        ) {
          // Array-item edit: immutably update the one field of the one item.
          const arr = Array.isArray(currentCfg[state.arrayKey])
            ? (currentCfg[state.arrayKey] as Record<string, unknown>[])
            : [];
          const nextArr = arr.map((item, i) =>
            i === state.itemIndex
              ? { ...item, [state.field]: text }
              : item,
          );
          updateBlock(state.blockId, {
            config: { ...currentCfg, [state.arrayKey]: nextArr },
          });
        } else {
          updateBlock(state.blockId, {
            config: { ...currentCfg, [state.field]: text },
          });
        }
      }

      el.removeAttribute("contenteditable");
      el.removeAttribute("spellcheck");
      el.style.outline = "";
      toolbar.hide();
      setEditState(null);
      setIsTextEditing(false);
    },
    [updateBlock, setTranslation, toolbar, setIsTextEditing],
  );

  const discard = useCallback((state: EditState) => {
    const el = state.element;
    // Restore original text
    el.innerText = state.originalText;
    el.removeAttribute("contenteditable");
    el.removeAttribute("spellcheck");
    el.style.outline = "";

    // Restore original cfg (reverts any mid-session style changes)
    updateBlock(state.blockId, { config: state.originalCfg });

    toolbar.hide();
    setEditState(null);
    setIsTextEditing(false);
  }, [updateBlock, toolbar, setIsTextEditing]);

  // -------------------------------------------------------------------------
  // dblclick listener
  // -------------------------------------------------------------------------

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleDblClick(e: MouseEvent) {
      const target = e.target as HTMLElement;

      // -----------------------------------------------------------------------
      // Path 1: array-item field  (data-editable-item-index / item-field / array-key)
      // -----------------------------------------------------------------------
      const itemEl = target.closest<HTMLElement>("[data-editable-item-index]");
      if (itemEl) {
        const rawIndex = itemEl.dataset.editableItemIndex;
        const itemField = itemEl.dataset.editableItemField;
        const arrayKey = itemEl.dataset.editableArrayKey;
        if (rawIndex === undefined || !itemField || !arrayKey) return;

        const itemIndex = parseInt(rawIndex, 10);
        if (!Number.isFinite(itemIndex)) return;

        const blockEl = itemEl.closest<HTMLElement>("[data-block-id]");
        const blockId = blockEl?.dataset.blockId;
        if (!blockId) return;

        e.preventDefault();
        e.stopPropagation();

        const store = useEditorStore.getState();
        const block = store.blocks.find((b) => b.id === blockId);
        if (!block) return;

        const cfg = parseCfgFromBlock(block);
        const blockRect = blockEl!.getBoundingClientRect();

        itemEl.setAttribute("contenteditable", "true");
        itemEl.setAttribute("spellcheck", "true");
        itemEl.style.outline = "2px solid var(--primary, #6366f1)";
        itemEl.style.outlineOffset = "2px";
        itemEl.style.borderRadius = "2px";

        const originalText = itemEl.innerText;

        const state: EditState = {
          blockId,
          field: itemField,
          originalText,
          originalCfg: cfg,
          blockRect,
          element: itemEl,
          translatingLang: null,
          arrayKey,
          itemIndex,
        };
        setEditState(state);
        setIsTextEditing(true);

        requestAnimationFrame(() => {
          itemEl.focus();
          const sel = window.getSelection();
          if (sel && sel.rangeCount === 0) {
            const range = document.createRange();
            range.selectNodeContents(itemEl);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
          toolbar.show(blockRect);
        });
        return;
      }

      // -----------------------------------------------------------------------
      // Path 2: top-level field  (data-editable-field)
      // -----------------------------------------------------------------------
      // Walk up to find an editable field element
      const fieldEl = target.closest<HTMLElement>("[data-editable-field]");
      if (!fieldEl) return;

      const field = fieldEl.dataset.editableField;
      if (!field) return;

      const blockEl = fieldEl.closest<HTMLElement>("[data-block-id]");
      const blockId = blockEl?.dataset.blockId;
      if (!blockId) return;

      e.preventDefault();
      e.stopPropagation();

      const store = useEditorStore.getState();
      const block = store.blocks.find((b) => b.id === blockId);
      if (!block) return;

      const cfg = parseCfgFromBlock(block);
      const blockRect = blockEl!.getBoundingClientRect();

      const displayLang = store.displayLang;
      const mainLang = store.settings.mainLanguage || "en";
      const isTranslating = !!(displayLang && displayLang !== mainLang);

      // Activate contentEditable on the element directly
      fieldEl.setAttribute("contenteditable", "true");
      fieldEl.setAttribute("spellcheck", "true");
      const outlineColor = isTranslating
        ? "var(--amber-500, #f59e0b)"
        : "var(--primary, #6366f1)";
      fieldEl.style.outline = `2px solid ${outlineColor}`;
      fieldEl.style.outlineOffset = "2px";
      fieldEl.style.borderRadius = "2px";

      const originalText = fieldEl.innerText;

      if (isTranslating) {
        let translatedText = store.getTranslation(blockId, displayLang, field);
        if (!translatedText) {
          translatedText = String(cfg[field] ?? "");
          if (translatedText) {
            store.setTranslation(blockId, displayLang, field, translatedText);
          }
        }
        if (translatedText) {
          fieldEl.innerText = translatedText;
        }
      }

      const state: EditState = {
        blockId,
        field,
        originalText,
        originalCfg: cfg,
        blockRect,
        element: fieldEl,
        translatingLang: isTranslating ? displayLang : null,
      };
      setEditState(state);
      setIsTextEditing(true);

      requestAnimationFrame(() => {
        fieldEl.focus();
        // Place cursor at click position (already positioned) or at end
        const sel = window.getSelection();
        if (sel && sel.rangeCount === 0) {
          const range = document.createRange();
          range.selectNodeContents(fieldEl);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        toolbar.show(blockRect);
      });
    }

    container.addEventListener("dblclick", handleDblClick);
    return () => container.removeEventListener("dblclick", handleDblClick);
  }, [containerRef, toolbar]);

  // -------------------------------------------------------------------------
  // Blur → commit
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!editState) return;
    const el = editState.element;

    function handleBlur(e: FocusEvent) {
      const rt = e.relatedTarget as HTMLElement | null;
      if (rt?.closest("[data-format-toolbar]")) {
        return;
      }
      const state = editStateRef.current;
      if (state) commit(state);
    }

    el.addEventListener("blur", handleBlur);
    return () => el.removeEventListener("blur", handleBlur);
  }, [editState, commit]);

  // -------------------------------------------------------------------------
  // Click-outside → commit (catches cases where focus moved to toolbar first)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!editState) return;
    const el = editState.element;

    function handleDocMouseDown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (el.contains(target)) return;
      if (target.closest("[data-format-toolbar]")) return;
      const state = editStateRef.current;
      if (state) commit(state);
    }

    document.addEventListener("mousedown", handleDocMouseDown);
    return () => document.removeEventListener("mousedown", handleDocMouseDown);
  }, [editState, commit]);

  // -------------------------------------------------------------------------
  // Paste → strip HTML, insert plain text only
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!editState) return;
    const el = editState.element;

    function handlePaste(e: ClipboardEvent) {
      e.preventDefault();
      const text = e.clipboardData?.getData("text/plain") ?? "";
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    el.addEventListener("paste", handlePaste);
    return () => el.removeEventListener("paste", handlePaste);
  }, [editState]);

  // -------------------------------------------------------------------------
  // Keyboard shortcuts while editing
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!editState) return;
    const el = editState.element;

    function handleKeyDown(e: KeyboardEvent) {
      const state = editStateRef.current;
      if (!state) return;
      const meta = e.metaKey || e.ctrlKey;

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        discard(state);
        return;
      }

      if (meta && e.key === "b") {
        e.preventDefault();
        handleFormatForState(state, { type: "bold" });
        return;
      }
      if (meta && e.key === "i") {
        e.preventDefault();
        handleFormatForState(state, { type: "italic" });
        return;
      }
      if (meta && e.key === "u") {
        e.preventDefault();
        handleFormatForState(state, { type: "underline" });
        return;
      }
    }

    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [editState, discard]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Format handler — applies to cfg immediately, reflects in element style
  // -------------------------------------------------------------------------

  function handleFormatForState(state: EditState, cmd: FormatCommand) {
    const block = useEditorStore
      .getState()
      .blocks.find((b) => b.id === state.blockId);
    if (!block) return;

    const currentCfg = parseCfgFromBlock(block);
    const nextCfg = applyStyleKeyToCfg(currentCfg, state.field, cmd);
    updateBlock(state.blockId, { config: nextCfg });
    // Keep element's text in sync (style updates re-render via React, but
    // contentEditable element is owned by the DOM; its text won't reset
    // because React won't reconcile contentEditable children)
  }

  const handleFormat = useCallback(
    (cmd: FormatCommand) => {
      const state = editStateRef.current;
      if (!state) return;

      // Apply formatting to the current selection via execCommand so the user
      // sees an immediate visual change. The element keeps focus because toolbar
      // buttons use onMouseDown + e.preventDefault().
      state.element.focus();
      switch (cmd.type) {
        case "bold":         document.execCommand("bold"); break;
        case "italic":       document.execCommand("italic"); break;
        case "underline":    document.execCommand("underline"); break;
        case "foreColor":    document.execCommand("foreColor", false, cmd.value); break;
        case "fontName":     document.execCommand("fontName", false, cmd.value); break;
        case "justifyLeft":  document.execCommand("justifyLeft"); break;
        case "justifyCenter":document.execCommand("justifyCenter"); break;
        case "justifyRight": document.execCommand("justifyRight"); break;
        case "fontSize": {
          // execCommand fontSize uses 1-7 scale; apply via a temporary span instead
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
            const range = sel.getRangeAt(0);
            const span = document.createElement("span");
            span.style.fontSize = cmd.value.includes("px") || cmd.value.includes("rem")
              ? cmd.value
              : cmd.value + "px";
            range.surroundContents(span);
          }
          break;
        }
      }

      // Also persist as a whole-field style in block config
      handleFormatForState(state, cmd);

      requestAnimationFrame(() => {
        editStateRef.current?.element.focus();
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateBlock],
  );

  // -------------------------------------------------------------------------
  // Render toolbar portal only
  // -------------------------------------------------------------------------

  if (!editState) return <></>;

  return (
    <>
      {toolbar.visible &&
        typeof document !== "undefined" &&
        createPortal(
          <FloatingFormatToolbar
            x={toolbar.position.left}
            y={toolbar.position.top}
            onFormat={handleFormat}
          />,
          document.body,
        )}
    </>
  );
}
