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
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseCfgFromBlock(
  block: { config?: unknown } & Record<string, unknown>,
): Record<string, unknown> {
  return parseCfg(block.config);
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
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const setIsTextEditing = useEditorStore((s) => s.setIsTextEditing);

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
      const currentBlock = useEditorStore
        .getState()
        .blocks.find((b) => b.id === state.blockId);
      if (!currentBlock) return;

      const currentCfg = parseCfgFromBlock(currentBlock);
      updateBlock(state.blockId, {
        config: { ...currentCfg, [state.field]: text },
      });

      el.removeAttribute("contenteditable");
      el.removeAttribute("spellcheck");
      el.style.outline = "";
      toolbar.hide();
      setEditState(null);
      setIsTextEditing(false);
    },
    [updateBlock, toolbar, setIsTextEditing],
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

      const block = useEditorStore.getState().blocks.find((b) => b.id === blockId);
      if (!block) return;

      const cfg = parseCfgFromBlock(block);
      const blockRect = blockEl!.getBoundingClientRect();

      // Activate contentEditable on the element directly
      fieldEl.setAttribute("contenteditable", "true");
      fieldEl.setAttribute("spellcheck", "true");
      fieldEl.style.outline = "2px solid var(--primary, #6366f1)";
      fieldEl.style.outlineOffset = "2px";
      fieldEl.style.borderRadius = "2px";

      const state: EditState = {
        blockId,
        field,
        originalText: fieldEl.innerText,
        originalCfg: cfg,
        blockRect,
        element: fieldEl,
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
        // Focus moved to the format toolbar — don't commit; restore focus after interaction
        setTimeout(() => {
          const state = editStateRef.current;
          if (state) state.element.focus();
        }, 0);
        return;
      }
      const state = editStateRef.current;
      if (state) commit(state);
    }

    el.addEventListener("blur", handleBlur);
    return () => el.removeEventListener("blur", handleBlur);
  }, [editState, commit]);

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
      handleFormatForState(state, cmd);
      // Restore focus to the editable element after toolbar interaction
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
            top={toolbar.position.top}
            left={toolbar.position.left}
            onFormat={handleFormat}
          />,
          document.body,
        )}
    </>
  );
}
