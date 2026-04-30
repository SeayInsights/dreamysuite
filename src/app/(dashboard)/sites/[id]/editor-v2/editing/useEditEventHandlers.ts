/**
 * useEditEventHandlers.ts
 *
 * Wires up all DOM event listeners that run while an edit session is active:
 *   - blur → commit
 *   - mousedown outside → commit
 *   - paste → strip HTML / insert plain text
 *   - keydown → Escape (discard) + Cmd/Ctrl+B/I/U shortcuts
 *
 * Also provides `handleFormat` for toolbar button presses.
 */

import { useCallback, useEffect } from "react";

import { useEditorStore } from "@/app/stores/editorStore";
import { type FormatCommand } from "./FloatingFormatToolbar";
import {
  type EditState,
  applyStyleKeyToCfg,
  parseCfgFromBlock,
} from "./textEditorTypes";

export function useEditEventHandlers({
  editState,
  editStateRef,
  commit,
  discard,
}: {
  editState: EditState | null;
  editStateRef: React.MutableRefObject<EditState | null>;
  commit: (state: EditState) => void;
  discard: (state: EditState) => void;
}) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  // -------------------------------------------------------------------------
  // Blur → commit
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!editState) return;
    const el = editState.element;

    function handleBlur(e: FocusEvent) {
      const rt = e.relatedTarget as HTMLElement | null;
      if (rt?.closest("[data-format-toolbar]")) return;
      const state = editStateRef.current;
      if (state) commit(state);
    }

    el.addEventListener("blur", handleBlur);
    return () => el.removeEventListener("blur", handleBlur);
  }, [editState, commit, editStateRef]);

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
  }, [editState, commit, editStateRef]);

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
  }, [editState, discard, editStateRef]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }

  const handleFormat = useCallback(
    (cmd: FormatCommand) => {
      const state = editStateRef.current;
      if (!state) return;

      state.element.focus();
      switch (cmd.type) {
        case "bold":          document.execCommand("bold"); break;
        case "italic":        document.execCommand("italic"); break;
        case "underline":     document.execCommand("underline"); break;
        case "foreColor":     document.execCommand("foreColor", false, cmd.value); break;
        case "fontName":      document.execCommand("fontName", false, cmd.value); break;
        case "justifyLeft":   document.execCommand("justifyLeft"); break;
        case "justifyCenter": document.execCommand("justifyCenter"); break;
        case "justifyRight":  document.execCommand("justifyRight"); break;
        case "fontSize": {
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

      handleFormatForState(state, cmd);

      requestAnimationFrame(() => {
        editStateRef.current?.element.focus();
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateBlock],
  );

  return { handleFormat };
}
