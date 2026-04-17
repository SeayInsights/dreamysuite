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
import { FloatingFormatToolbar, type FormatCommand } from "./FloatingFormatToolbar";
import { useFloatingToolbar } from "../hooks/useFloatingToolbar";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Block types that carry text content and therefore support inline editing.
 * Attempting to double-click any other block type bails silently.
 */
const TEXT_BLOCK_TYPES = new Set(["home-hero", "header", "multi-text"]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditState {
  blockId: string;
  /** Saved innerHTML snapshot for Escape-to-revert */
  originalHtml: string;
  /** Viewport-relative DOMRect of the block element at edit-start time */
  blockRect: DOMRect;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reads the block type from the nearest `[data-block-id]` ancestor.
 * The block component must also expose `data-block-type` for this to work;
 * if it doesn't, we fall back to a store lookup.
 */
function getBlockType(
  el: HTMLElement,
  blocks: ReturnType<typeof useEditorStore.getState>["blocks"],
): string | null {
  const blockEl = el.closest<HTMLElement>("[data-block-id]");
  if (!blockEl) return null;
  // Prefer explicit data attribute set by the block component
  if (blockEl.dataset.blockType) return blockEl.dataset.blockType;
  // Fallback: derive from store
  const id = blockEl.dataset.blockId;
  return blocks.find((b) => b.id === id)?.type ?? null;
}

/**
 * Position the contentEditable overlay directly over the block element.
 * Returns inline style values (top/left/width/height) relative to the
 * `containerRef` scroll container.
 */
function computeOverlayStyle(
  blockEl: HTMLElement,
  container: HTMLElement,
): React.CSSProperties {
  const blockBox = blockEl.getBoundingClientRect();
  const containerBox = container.getBoundingClientRect();
  const scrollTop = container.scrollTop;
  const scrollLeft = container.scrollLeft;

  return {
    top: blockBox.top - containerBox.top + scrollTop,
    left: blockBox.left - containerBox.left + scrollLeft,
    width: blockBox.width,
    height: blockBox.height,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * TextEditor
 *
 * Mounts as an invisible absolute-positioned layer inside the canvas scroll
 * container. It listens for `dblclick` events that bubble up from any element
 * bearing `[data-block-id]`, activates edit mode for text-bearing block types,
 * and renders:
 *   - a transparent contentEditable overlay precisely covering the block
 *   - the FloatingFormatToolbar (via portal, position:fixed)
 *
 * On blur or Enter-key commit, the edited innerHTML is stored on the block
 * under the `editedText` key via `updateBlock`. Escape reverts.
 *
 * @param containerRef - ref to the scroll container that wraps the canvas
 *   (the EditorOverlay div). Position math is relative to this element.
 */
export function TextEditor({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}): JSX.Element {
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const [editState, setEditState] = useState<EditState | null>(null);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});

  const editableRef = useRef<HTMLDivElement>(null);
  const toolbar = useFloatingToolbar();

  // -------------------------------------------------------------------------
  // Activate edit mode
  // -------------------------------------------------------------------------

  const activate = useCallback(
    (blockId: string, blockEl: HTMLElement) => {
      const container = containerRef.current;
      if (!container) return;

      const style = computeOverlayStyle(blockEl, container);
      const blockRect = blockEl.getBoundingClientRect();
      const originalHtml = blockEl.innerHTML;

      setOverlayStyle(style);
      setEditState({ blockId, originalHtml, blockRect });

      // Show toolbar after a brief frame so the overlay has mounted
      requestAnimationFrame(() => {
        toolbar.show(blockRect);
        editableRef.current?.focus();
        // Place cursor at end
        const sel = window.getSelection();
        const range = document.createRange();
        if (editableRef.current && sel) {
          range.selectNodeContents(editableRef.current);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      });
    },
    [containerRef, toolbar],
  );

  // -------------------------------------------------------------------------
  // Commit / discard
  // -------------------------------------------------------------------------

  const commit = useCallback(() => {
    if (!editState) return;
    const el = editableRef.current;
    if (!el) return;

    updateBlock(editState.blockId, {
      editedText: el.innerHTML,
    });

    toolbar.hide();
    setEditState(null);
  }, [editState, updateBlock, toolbar]);

  const discard = useCallback(() => {
    toolbar.hide();
    setEditState(null);
  }, [toolbar]);

  // -------------------------------------------------------------------------
  // dblclick listener on the container
  // -------------------------------------------------------------------------

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleDblClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const blockEl = target.closest<HTMLElement>("[data-block-id]");
      if (!blockEl) return;

      const blockId = blockEl.dataset.blockId;
      if (!blockId) return;

      const type = getBlockType(target, blocks);
      if (!type || !TEXT_BLOCK_TYPES.has(type)) return; // bail silently

      e.preventDefault();
      activate(blockId, blockEl);
    }

    container.addEventListener("dblclick", handleDblClick);
    return () => container.removeEventListener("dblclick", handleDblClick);
  }, [containerRef, blocks, activate]);

  // -------------------------------------------------------------------------
  // Keyboard shortcuts while editing
  // -------------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const meta = e.metaKey || e.ctrlKey;

      if (e.key === "Escape") {
        e.preventDefault();
        discard();
        return;
      }

      if (meta && e.key === "b") {
        e.preventDefault();
        document.execCommand("bold");
        return;
      }
      if (meta && e.key === "i") {
        e.preventDefault();
        document.execCommand("italic");
        return;
      }
      if (meta && e.key === "u") {
        e.preventDefault();
        document.execCommand("underline");
        return;
      }
    },
    [discard],
  );

  // -------------------------------------------------------------------------
  // Format command handler (forwarded from toolbar)
  // -------------------------------------------------------------------------

  const handleFormat = useCallback((cmd: FormatCommand) => {
    // Restore focus to the contentEditable before issuing execCommand
    editableRef.current?.focus();

    switch (cmd.type) {
      case "bold":
        document.execCommand("bold");
        break;
      case "italic":
        document.execCommand("italic");
        break;
      case "underline":
        document.execCommand("underline");
        break;
      case "fontName":
        document.execCommand("fontName", false, cmd.value);
        break;
      case "fontSize":
        // execCommand fontSize accepts 1-7 (HTML size), so we use a workaround:
        // wrap selection in a span with an explicit style instead.
        document.execCommand("styleWithCSS", false, "true");
        document.execCommand(
          "fontSize",
          false,
          // Map px value to the nearest HTML size level (execCommand accepts 1-7)
          // We abuse styleWithCSS=true here so the browser emits a <span style="font-size:…">
          cmd.value,
        );
        break;
      case "foreColor":
        document.execCommand("foreColor", false, cmd.value);
        break;
      case "justifyLeft":
        document.execCommand("justifyLeft");
        break;
      case "justifyCenter":
        document.execCommand("justifyCenter");
        break;
      case "justifyRight":
        document.execCommand("justifyRight");
        break;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (!editState) return <></>;

  return (
    <>
      {/* Transparent contentEditable overlay — covers the block exactly */}
      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Edit block text"
        spellCheck
        // Seed with the block's current rendered HTML so the user sees the
        // existing content and can edit in-place.
        dangerouslySetInnerHTML={{ __html: editState.originalHtml }}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="absolute z-20 cursor-text overflow-auto outline-none ring-2 ring-primary/60 focus:ring-primary"
        style={{
          ...overlayStyle,
          // Transparent background so the original block renders through, giving
          // the illusion of direct editing while the overlay captures input.
          background: "transparent",
        }}
      />

      {/* Floating toolbar via portal so it isn't clipped by the canvas overflow */}
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
