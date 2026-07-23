"use client";

import {
  type ReactNode,
  type RefObject,
  type PointerEvent as ReactPointerEvent,
  useEffect,
} from "react";

import { useEditorStore } from "@/app/stores/editorStore";
import { useSelection } from "./hooks/useSelection";
import { useDrag } from "./hooks/useDrag";

const DRAG_THRESHOLD_PX = 4;

interface Props {
  children: ReactNode;
  containerRef: RefObject<HTMLDivElement | null>;
  onContainerReady?: () => void;
}

export function EditorOverlay({
  children,
  containerRef,
  onContainerReady,
}: Props) {
  const { select, hover, clear } = useSelection();
  const { startMove } = useDrag(containerRef);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    onContainerReady?.();
    const doc = el.ownerDocument;

    function elementsAtPoint(x: number, y: number): string[] {
      const seen = new Set<string>();
      const ids: string[] = [];
      for (const hit of doc.elementsFromPoint(x, y)) {
        const bid = (hit as HTMLElement).closest<HTMLElement>("[data-block-id]")
          ?.dataset.blockId;
        if (bid && !seen.has(bid)) {
          seen.add(bid);
          ids.push(bid);
        }
      }
      return ids;
    }

    function handleClick(e: MouseEvent) {
      if (e.detail > 1) return;

      // If clicking on an editable field, don't auto-select the block
      // to avoid re-render that would invalidate a subsequent dblclick
      const target = e.target as HTMLElement;
      if (
        target.closest("[data-editable-field]") ||
        target.closest("[data-editable-item-index]")
      ) {
        return;
      }

      const currentId = useEditorStore.getState().selectedBlockId;
      const stackIds = elementsAtPoint(e.clientX, e.clientY);

      if (stackIds.length === 0) {
        clear();
        return;
      }

      const idx = currentId ? stackIds.indexOf(currentId) : -1;
      if (idx === -1) {
        select(stackIds[0]);
      } else if (stackIds.length > 1) {
        select(stackIds[(idx + 1) % stackIds.length]);
      }
    }

    function handleDblClick(e: MouseEvent) {
      // If the target is an editable text field, let the text editor handle it
      // to avoid a competing select() call that triggers re-render and detaches the target
      const target = e.target as HTMLElement;
      if (
        target.closest("[data-editable-field]") ||
        target.closest("[data-editable-item-index]")
      ) {
        return;
      }

      const stackIds = elementsAtPoint(e.clientX, e.clientY);
      const blockId = stackIds[0];
      if (!blockId) return;

      const blockEl = doc.querySelector<HTMLElement>(
        `[data-block-id="${blockId}"]`,
      );
      const blockType = blockEl?.dataset.blockType ?? "";
      if (
        blockType === "media-video" ||
        blockType === "video" ||
        blockType === "youtube"
      )
        return;

      if (useEditorStore.getState().selectedBlockId !== blockId) {
        select(blockId);
      }
      useEditorStore.getState().setBlockToolbarVisible(true);
    }

    let pending: {
      blockId: string;
      startX: number;
      startY: number;
      pointerId: number;
    } | null = null;

    function handlePointerDown(e: PointerEvent) {
      const state = useEditorStore.getState();
      if (state.drag.kind) return;

      const blockEl = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-block-id]",
      );
      const blockId = blockEl?.dataset.blockId;
      if (!blockEl || !blockId) return;

      // Don't hijack drags that belong to explicitly-draggable children or
      // editable text — those have their own interactions.
      const draggable = (e.target as HTMLElement).closest<HTMLElement>(
        "[draggable='true']",
      );
      if (draggable && blockEl.contains(draggable)) return;

      const target = e.target as HTMLElement;
      if (
        target.isContentEditable ||
        target.closest("[contenteditable='true']") ||
        target.closest("[data-editable-field]") ||
        target.closest("[data-editable-item-index]")
      )
        return;

      // Grab-and-drag: arm a move for whichever block is pressed — no need to
      // click-to-select first (Wix-style direct manipulation). Selection happens
      // when the gesture crosses the drag threshold (below); a plain click still
      // selects/cycles via handleClick, and pointerup clears an unused arm.
      pending = {
        blockId,
        startX: e.clientX,
        startY: e.clientY,
        pointerId: e.pointerId,
      };
    }

    function handlePointerMove(e: PointerEvent) {
      if (useEditorStore.getState().drag.kind) return;

      if (pending && e.pointerId === pending.pointerId) {
        const dx = e.clientX - pending.startX;
        const dy = e.clientY - pending.startY;
        if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD_PX) {
          // Select the grabbed block as the drag begins, then start moving it.
          if (useEditorStore.getState().selectedBlockId !== pending.blockId) {
            select(pending.blockId);
          }
          startMove(
            pending.blockId,
            e as unknown as ReactPointerEvent<HTMLDivElement>,
          );
          pending = null;
        }
      }

      const id = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-block-id]",
      )?.dataset.blockId;
      hover(id ?? null);
    }

    function handlePointerUp() {
      pending = null;
    }
    function handleMouseLeave() {
      hover(null);
    }

    el.addEventListener("click", handleClick);
    el.addEventListener("dblclick", handleDblClick);
    el.addEventListener("pointerdown", handlePointerDown);
    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerup", handlePointerUp);
    el.addEventListener("pointercancel", handlePointerUp);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("click", handleClick);
      el.removeEventListener("dblclick", handleDblClick);
      el.removeEventListener("pointerdown", handlePointerDown);
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerup", handlePointerUp);
      el.removeEventListener("pointercancel", handlePointerUp);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [containerRef, onContainerReady, select, hover, clear, startMove]);

  return (
    <div ref={containerRef} className="relative min-h-full w-full pb-8">
      {children}
      <AlignGuides />
    </div>
  );
}

/**
 * Alignment guide lines shown while dragging a block. Rendered inside the canvas
 * container (same canvas-px coordinate space as the blocks), so guide positions
 * line up with blocks without any scale/iframe reconciliation. Cleared when the
 * drag ends (setAlignGuides([])).
 */
function AlignGuides() {
  const guides = useEditorStore((s) => s.alignGuides);
  if (!guides.length) return null;
  return (
    <>
      {guides.map((g, i) =>
        g.orientation === "v" ? (
          <div
            key={`v-${i}`}
            className="pointer-events-none absolute top-0 bottom-0"
            style={{
              left: g.pos,
              width: 1,
              background: "#3b82f6",
              zIndex: 9999,
            }}
            aria-hidden
          />
        ) : (
          <div
            key={`h-${i}`}
            className="pointer-events-none absolute left-0 right-0"
            style={{
              top: g.pos,
              height: 1,
              background: "#3b82f6",
              zIndex: 9999,
            }}
            aria-hidden
          />
        ),
      )}
    </>
  );
}
