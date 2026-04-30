"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate } from "motion/mini";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Position {
  top: number;
  left: number;
}

type ToolbarPhase = "hidden" | "shown" | "exiting";

interface UseToolbarPositionOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  selectedBlockId: string | null;
  blockToolbarVisible: boolean;
  /** Called when the toolbar starts showing so the caller can clear stale popover state. */
  onScroll?: () => void;
}

interface UseToolbarPositionReturn {
  toolbarRef: React.RefObject<HTMLDivElement | null>;
  toolbarPhase: ToolbarPhase;
  renderPos: Position | null;
  renderBlockId: string | null;
  dragOffset: Position;
  onToolbarPointerDown: (e: React.PointerEvent) => void;
  onToolbarPointerMove: (e: React.PointerEvent) => void;
  onToolbarPointerUp: (e: React.PointerEvent) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOOLBAR_HEIGHT = 44;
const TOOLBAR_MARGIN = 8;
const ANIM_MS = 150;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToolbarPosition({
  containerRef,
  selectedBlockId,
  blockToolbarVisible,
  onScroll,
}: UseToolbarPositionOptions): UseToolbarPositionReturn {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Absolute scroll-relative position of the block
  const [position, setPosition] = useState<Position | null>(null);

  // Drag offset applied on top of the calculated position
  const [dragOffset, setDragOffset] = useState<Position>({ top: 0, left: 0 });
  const dragOffsetRef = useRef<Position>({ top: 0, left: 0 });
  const toolbarDragRef = useRef<{ startX: number; startY: number; startOffset: Position } | null>(null);

  // Reset drag offset when block selection changes
  const prevSelectedRef = useRef(selectedBlockId);
  useEffect(() => {
    if (prevSelectedRef.current !== selectedBlockId) {
      dragOffsetRef.current = { top: 0, left: 0 };
      setDragOffset({ top: 0, left: 0 });
      prevSelectedRef.current = selectedBlockId;
    }
  }, [selectedBlockId]);

  // Drag handlers
  const onToolbarPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    toolbarDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffset: { ...dragOffsetRef.current },
    };
  }, []);

  const onToolbarPointerMove = useCallback((e: React.PointerEvent) => {
    const session = toolbarDragRef.current;
    if (!session) return;
    e.stopPropagation();
    const next = {
      top: session.startOffset.top + (e.clientY - session.startY),
      left: session.startOffset.left + (e.clientX - session.startX),
    };
    dragOffsetRef.current = next;
    setDragOffset(next);
  }, []);

  const onToolbarPointerUp = useCallback((e: React.PointerEvent) => {
    toolbarDragRef.current = null;
    e.stopPropagation();
  }, []);

  // Animation phase state machine
  const phaseRef = useRef<ToolbarPhase>("hidden");
  const [toolbarPhase, setToolbarPhaseState] = useState<ToolbarPhase>("hidden");
  const [renderPos, setRenderPos] = useState<Position | null>(null);
  const [renderBlockId, setRenderBlockId] = useState<string | null>(null);
  const renderBlockIdRef = useRef<string | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingShowRef = useRef<{ pos: Position; blockId: string } | null>(null);

  const setToolbarPhase = useCallback((p: ToolbarPhase) => {
    phaseRef.current = p;
    setToolbarPhaseState(p);
  }, []);

  const showBlock = useCallback((pos: Position, blockId: string) => {
    renderBlockIdRef.current = blockId;
    setRenderPos(pos);
    setRenderBlockId(blockId);
    setToolbarPhase("shown");
  }, [setToolbarPhase]);

  // Measure toolbar position relative to the selected block
  const measurePosition = useCallback(() => {
    const container = containerRef.current;
    if (!container || !selectedBlockId) {
      setPosition(null);
      return;
    }
    const node = container.querySelector<HTMLElement>(`[data-block-id="${selectedBlockId}"]`);
    if (!node) {
      setPosition(null);
      return;
    }
    const frameBox = container.getBoundingClientRect();
    const box = node.getBoundingClientRect();
    const relTop = box.top - frameBox.top + (container.scrollTop ?? 0);

    const TOOLBAR_WIDTH = 320;
    const rawLeft = (box.left - frameBox.left) + box.width / 2 - TOOLBAR_WIDTH / 2;
    const maxLeft = frameBox.width - TOOLBAR_WIDTH;
    const clampedLeft = Math.max(0, Math.min(rawLeft, Math.max(0, maxLeft)));

    const spaceAbove = box.top - frameBox.top;
    const fitsAbove = spaceAbove >= TOOLBAR_HEIGHT + TOOLBAR_MARGIN;
    const scrollTop = container.scrollTop ?? 0;
    const viewportBottom = scrollTop + container.clientHeight;

    let top: number;
    if (fitsAbove) {
      top = relTop - TOOLBAR_HEIGHT - TOOLBAR_MARGIN;
    } else {
      const belowPos = relTop + box.height + TOOLBAR_MARGIN;
      if (belowPos + TOOLBAR_HEIGHT <= viewportBottom) {
        top = belowPos;
      } else {
        top = scrollTop + TOOLBAR_MARGIN;
      }
    }

    setPosition({ top, left: clampedLeft });
  }, [containerRef, selectedBlockId]);

  // Re-measure on selection change or resize
  useEffect(() => {
    measurePosition();
  }, [measurePosition]);

  // Re-measure on scroll/resize; close popover on scroll via onScroll callback
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const raf = { id: 0 };
    const onUpdate = () => {
      cancelAnimationFrame(raf.id);
      raf.id = requestAnimationFrame(measurePosition);
    };
    const handleScroll = () => {
      onScroll?.();
      onUpdate();
    };
    window.addEventListener("resize", onUpdate);
    container.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("resize", onUpdate);
      container.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(raf.id);
    };
  }, [containerRef, measurePosition, onScroll]);

  // Enter animation
  useEffect(() => {
    if (toolbarPhase !== "shown") return;
    const el = toolbarRef.current;
    if (!el) return;
    el.style.opacity = "0";
    animate(
      el,
      { opacity: [0, 1], transform: ["translateY(8px)", "translateY(0px)"] },
      { duration: ANIM_MS / 1000, ease: [0.16, 1, 0.3, 1] },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderBlockId]);

  // Exit animation
  useEffect(() => {
    if (toolbarPhase !== "exiting") return;
    const el = toolbarRef.current;
    if (!el) return;
    animate(
      el,
      { opacity: [1, 0], transform: ["translateY(0px)", "translateY(-8px)"] },
      { duration: ANIM_MS / 1000, ease: "easeIn" },
    );
  }, [toolbarPhase]);

  // Show/hide state machine
  useEffect(() => {
    const shouldShow = !!(selectedBlockId && position && blockToolbarVisible);

    if (shouldShow) {
      const switchingBlock =
        phaseRef.current === "shown" &&
        selectedBlockId !== renderBlockIdRef.current;

      if (animTimerRef.current) { clearTimeout(animTimerRef.current); animTimerRef.current = null; }

      if (switchingBlock) {
        pendingShowRef.current = { pos: position, blockId: selectedBlockId };
        setToolbarPhase("exiting");
        animTimerRef.current = setTimeout(() => {
          const pending = pendingShowRef.current;
          pendingShowRef.current = null;
          if (pending) showBlock(pending.pos, pending.blockId);
        }, ANIM_MS);
      } else if (phaseRef.current !== "shown") {
        showBlock(position, selectedBlockId);
      } else {
        setRenderPos(position);
      }
    } else if (phaseRef.current !== "hidden" && phaseRef.current !== "exiting") {
      if (animTimerRef.current) { clearTimeout(animTimerRef.current); animTimerRef.current = null; }
      pendingShowRef.current = null;
      setToolbarPhase("exiting");
      animTimerRef.current = setTimeout(() => {
        phaseRef.current = "hidden";
        setToolbarPhaseState("hidden");
        renderBlockIdRef.current = null;
        setRenderPos(null);
        setRenderBlockId(null);
      }, ANIM_MS);
    }
  }, [selectedBlockId, blockToolbarVisible, position, setToolbarPhase, showBlock]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
  }, []);

  return {
    toolbarRef,
    toolbarPhase,
    renderPos,
    renderBlockId,
    dragOffset,
    onToolbarPointerDown,
    onToolbarPointerMove,
    onToolbarPointerUp,
  };
}
