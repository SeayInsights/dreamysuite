"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useEditorStore } from "@/app/stores/editorStore";
import { BlockContentPanel } from "../inspector/BlockContentPanel";

// ---------------------------------------------------------------------------
// BlockEditPanel
//
// A fixed floating panel that opens when the user clicks the pencil "Edit"
// button in SectionToolbar. Reuses the existing BlockContentPanel switch
// (FaqEditor, FunFactsEditor, ScheduleEditor, TravelEditor, VideoEditor,
// GalleryEditor) without rewriting them.
//
// Positioning: anchored to the left edge of the canvas main area. If no
// containerRef is provided it falls back to a centered fixed position.
// ---------------------------------------------------------------------------

interface Props {
  /** Ref to the scrollable canvas container so we can anchor the panel. */
  containerRef: React.RefObject<HTMLElement | null>;
}

export function BlockEditPanel({ containerRef }: Props) {
  const editingPanelBlockId = useEditorStore((s) => s.editingPanelBlockId);
  const setEditingPanel = useEditorStore((s) => s.setEditingPanel);
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const panelRef = useRef<HTMLDivElement>(null);

  const block = editingPanelBlockId
    ? (blocks.find((b) => b.id === editingPanelBlockId) ?? null)
    : null;

  // Close on Escape
  useEffect(() => {
    if (!editingPanelBlockId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setEditingPanel(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editingPanelBlockId, setEditingPanel]);

  // Close on outside click (but not inside the panel or canvas toolbar)
  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current && panelRef.current.contains(target)) return;
      setEditingPanel(null);
    },
    [setEditingPanel],
  );

  useEffect(() => {
    if (!editingPanelBlockId) return;
    // Delay so the same click that opened the panel doesn't immediately close it
    const id = setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [editingPanelBlockId, handleOutsideClick]);

  if (!editingPanelBlockId || !block || typeof document === "undefined") {
    return null;
  }

  // Derive position: place panel to the right side of the canvas container,
  // aligned near the top of the viewport so it doesn't fall off-screen.
  // Falls back to a centered position if the container ref isn't available.
  let panelStyle: React.CSSProperties;
  const container = containerRef.current;
  if (container) {
    const box = container.getBoundingClientRect();
    // Sit inside the canvas frame, 16px from the left edge, 72px from top
    // (below the toolbar area)
    panelStyle = {
      position: "fixed",
      top: Math.max(box.top + 72, 72),
      left: Math.max(box.left + 16, 16),
      zIndex: 9998,
      width: 320,
      maxHeight: `calc(100dvh - ${Math.max(box.top + 72, 72) + 32}px)`,
    };
  } else {
    panelStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 9998,
      width: 320,
      maxHeight: "80dvh",
    };
  }

  const blockTypeLabel =
    block.type
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return createPortal(
    <div
      ref={panelRef}
      className="flex flex-col rounded-lg border border-border bg-popover shadow-xl text-popover-foreground overflow-hidden"
      style={panelStyle}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <PencilIcon />
          <span className="text-xs font-semibold">{blockTypeLabel}</span>
        </div>
        <button
          type="button"
          aria-label="Close edit panel"
          onClick={() => setEditingPanel(null)}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Scrollable editor body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <BlockContentPanel block={block} updateBlock={updateBlock} />
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Inline icons — keep the file self-contained
// ---------------------------------------------------------------------------

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2 2l8 8M10 2l-8 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
