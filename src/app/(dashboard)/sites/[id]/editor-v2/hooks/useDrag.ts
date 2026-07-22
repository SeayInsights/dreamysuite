"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";
import {
  getCanvasBounds,
  constrainToBounds,
  type Rect,
} from "../lib/boundsCalculator";
import { useCanvasScale } from "../BreakpointFrame";
import {
  COL_PCT,
  detectCollisions,
  handleAutoScroll,
  snapToGrid,
  toCanonicalBounds,
  toScaledDomRect,
} from "./dragGeometry";

// ─── Types ─────────────────────────────────────────────────────────────────

export type HandlePosition =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "move";

interface DragSession {
  kind: "move" | "resize";
  blockId: string;
  handle?: HandlePosition;
  startX: number;
  startY: number;
  // Move (free positioning)
  startOffsetX?: number;
  startOffsetY?: number;
  // Resize — frozen edges at pointerdown (derived from DOM rects)
  containerWidth?: number;
  hadBlockHeightAtStart?: boolean;
  leftEdgePct?: number;
  rightEdgePct?: number;
  topEdgePx?: number;
  bottomEdgePx?: number;
  naturalTopPx?: number;
  /** The most-recent config patch applied during this drag (committed on pointerup). */
  lastConfig?: Record<string, unknown>;
}

// ─── Debug flag — flip to true to trace east-resize in console ────────────
const DEBUG_DRAG = false;

// ─── Snap helpers ─────────────────────────────────────────────────────────

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useDrag(containerRef: React.RefObject<HTMLElement | null>): {
  isDragging: boolean;
  draggedId: string | null;
  collidingIds: string[];
  startMove: (blockId: string, e: React.PointerEvent) => void;
  startResize: (
    blockId: string,
    handle: HandlePosition,
    e: React.PointerEvent,
  ) => void;
} {
  const blocks = useEditorStore(useShallow((s) => s.blocks));
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const resortByOffsetY = useEditorStore((s) => s.resortByOffsetY);
  const setDrag = useEditorStore((s) => s.setDrag);
  const setInspectorTab = useEditorStore((s) => s.setInspectorTab);
  const temporalStore = useEditorStore.temporal;
  const pendingTabSwitchRef = useRef(false);
  const scaleFactor = useCanvasScale();

  const sessionRef = useRef<DragSession | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<{
    config: Record<string, unknown>;
    collisions?: string[];
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const collidingIds = useEditorStore((s) => s.collidingIds);
  const setCollidingIds = useEditorStore((s) => s.setCollidingIds);

  // ── Apply batched update in rAF ────────────────────────────────────────

  const applyUpdate = useCallback(() => {
    const session = sessionRef.current;
    const pending = pendingUpdateRef.current;

    if (!session || !pending) {
      rafRef.current = null;
      return;
    }

    updateBlock(session.blockId, { config: pending.config });
    session.lastConfig = pending.config;

    if (pending.collisions !== undefined) {
      setCollidingIds(pending.collisions);
    }

    pendingUpdateRef.current = null;
    rafRef.current = null;
  }, [updateBlock, setCollidingIds]);

  // ── End drag ───────────────────────────────────────────────────────────

  const endDrag = useCallback(() => {
    const session = sessionRef.current;

    // Cancel any pending frame
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Apply any final pending update before ending
    if (pendingUpdateRef.current) {
      applyUpdate();
    }

    if (DEBUG_DRAG && session) {
      console.group(
        `[useDrag] endDrag handle=${session.handle} block=${session.blockId}`,
      );
      console.log(
        "lastConfig:",
        session.lastConfig
          ? JSON.parse(JSON.stringify(session.lastConfig))
          : "(none — no move)",
      );
      console.log("hadBlockHeightAtStart:", session.hadBlockHeightAtStart);
      console.groupEnd();
    }

    if (session?.lastConfig !== undefined) {
      temporalStore.getState().resume();

      const handle = session.handle;
      const affectsWidth =
        handle && ["nw", "ne", "e", "se", "sw", "w"].includes(handle);
      const affectsHeight =
        handle && ["nw", "n", "ne", "se", "s", "sw"].includes(handle);
      if (
        affectsWidth &&
        !affectsHeight &&
        !session.hadBlockHeightAtStart &&
        session.lastConfig.blockHeight !== undefined
      ) {
        delete session.lastConfig.blockHeight;
        delete session.lastConfig.blockOffsetY;
      }

      updateBlock(session.blockId, { config: session.lastConfig });

      // After a move drag, re-index sortOrder to match visual Y order so
      // tablet/mobile flow order stays in sync with desktop positioning.
      if (session.kind === "move") {
        resortByOffsetY();
      }
    } else {
      // No move happened (pointer up immediately) — just resume without
      // writing so no spurious history entry is created.
      temporalStore.getState().resume();
    }

    pendingTabSwitchRef.current = false;
    setDrag({ kind: null, id: null });
    sessionRef.current = null;
    setIsDragging(false);
    setDraggedId(null);
    setCollidingIds([]);

    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  }, [
    applyUpdate,
    resortByOffsetY,
    setCollidingIds,
    setDrag,
    temporalStore,
    updateBlock,
  ]);

  // ── Pointer move ───────────────────────────────────────────────────────

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const session = sessionRef.current;
      if (!session) return;

      const screenDx = e.clientX - session.startX;
      const screenDy = e.clientY - session.startY;
      // Convert screen-pixel deltas to canonical canvas coordinates
      const dx = screenDx / scaleFactor;
      const dy = screenDy / scaleFactor;

      if (
        pendingTabSwitchRef.current &&
        (Math.abs(dx) > 4 || Math.abs(dy) > 4)
      ) {
        setInspectorTab("advanced");
        pendingTabSwitchRef.current = false;
      }

      if (session.kind === "move") {
        const container = containerRef.current;
        if (!container) return;

        const block = blocks.find((b) => b.id === session.blockId);
        if (!block) return;

        const config = parseCfg(block.config);
        const el = container.querySelector<HTMLElement>(
          `[data-block-id="${session.blockId}"]`,
        );
        if (!el) return;

        // Auto-scroll near viewport edges (FR-002)
        handleAutoScroll(e.clientY, container);

        // Calculate raw offset from drag delta (dx/dy already in canvas pixels)
        const rawOffsetX = (session.startOffsetX ?? 0) + dx;
        const rawOffsetY = (session.startOffsetY ?? 0) + dy;

        // Get element dimensions and position for bounds checking.
        // getBoundingClientRect returns scaled (screen) pixels — divide by
        // scaleFactor to get canonical canvas pixels.
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Get element's current position relative to container (in canvas pixels)
        const currentLeft = (elRect.left - containerRect.left) / scaleFactor;
        const currentTop = (elRect.top - containerRect.top) / scaleFactor;

        // Calculate natural position (where element is positioned in the flow without offset)
        const naturalLeft = currentLeft - (session.startOffsetX ?? 0);
        const naturalTop = currentTop - (session.startOffsetY ?? 0);

        // Calculate desired position with new offset applied
        const desiredLeft = naturalLeft + rawOffsetX;
        const desiredTop = naturalTop + rawOffsetY;

        // Create element rect for bounds checking (in canvas pixels)
        const elementRect: Rect = {
          top: desiredTop,
          left: desiredLeft,
          width: elRect.width / scaleFactor,
          height: elRect.height / scaleFactor,
        };

        // Get canvas bounds and constrain position (TR-001, TR-004).
        // getCanvasBounds returns screen-pixel dimensions; divide by scaleFactor
        // to get canonical canvas-pixel bounds that match elementRect.
        const bounds = toCanonicalBounds(
          getCanvasBounds(container),
          scaleFactor,
        );
        const constrained = constrainToBounds(elementRect, bounds);

        // Calculate constrained offset (difference from natural position)
        const constrainedOffsetX = constrained.left - naturalLeft;
        const constrainedOffsetY = constrained.top - naturalTop;

        // Apply grid snapping to constrained position
        const newConfig = {
          ...config,
          blockOffsetX: snapToGrid(constrainedOffsetX),
          blockOffsetY: snapToGrid(constrainedOffsetY),
        };

        // Detect collisions with constrained bounds.
        // constrained is in canvas pixels; scale back to screen pixels so
        // the rect aligns with getBoundingClientRect() of sibling elements.
        const newBounds = toScaledDomRect(
          containerRect,
          constrained,
          scaleFactor,
        );
        const collisions = detectCollisions(
          session.blockId,
          newBounds,
          blocks,
          container,
        );

        // Store pending update instead of applying immediately
        pendingUpdateRef.current = { config: newConfig, collisions };

        // Schedule rAF if not already scheduled
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(applyUpdate);
        }
      } else if (session.kind === "resize" && session.handle) {
        const container = containerRef.current;
        if (!container || session.containerWidth === undefined) return;

        const handle = session.handle;
        const patch: Record<string, unknown> = {};

        const affectsWidth = ["nw", "ne", "e", "se", "sw", "w"].includes(
          handle,
        );
        const affectsHeight = ["nw", "n", "ne", "se", "s", "sw"].includes(
          handle,
        );
        const isWest = ["nw", "sw", "w"].includes(handle);

        // Get canvas bounds for resize constraints (TR-001, TR-004).
        // Scale to canonical canvas pixels so comparisons match session.*EdgePx.
        const bounds = toCanonicalBounds(
          getCanvasBounds(container),
          scaleFactor,
        );

        if (DEBUG_DRAG) {
          console.log(
            `[useDrag] move handle=${handle} dx=${dx} dy=${dy} affectsWidth=${affectsWidth} affectsHeight=${affectsHeight} isWest=${isWest}`,
          );
        }

        if (
          affectsWidth &&
          session.leftEdgePct !== undefined &&
          session.rightEdgePct !== undefined
        ) {
          const deltaPct = (dx / session.containerWidth) * 100;

          if (DEBUG_DRAG) {
            console.log(
              `[useDrag]   width: deltaPct=${deltaPct.toFixed(2)} leftEdge=${session.leftEdgePct.toFixed(2)} rightEdge=${session.rightEdgePct.toFixed(2)}`,
            );
          }

          if (isWest) {
            // West resize - moving left edge
            const rawLeftEdge = session.leftEdgePct + deltaPct;
            // Constrain to canvas bounds (TR-001)
            const newLeftEdge = Math.max(
              0,
              Math.min(session.rightEdgePct - COL_PCT, rawLeftEdge),
            );
            patch.blockMarginLeft = newLeftEdge;
            patch.blockWidth = session.rightEdgePct - newLeftEdge;
            patch.blockOffsetX = 0;
            if (DEBUG_DRAG) {
              console.log(
                `[useDrag]   west: newLeftEdge=${newLeftEdge.toFixed(2)} → marginLeft=${patch.blockMarginLeft} width=${patch.blockWidth}`,
              );
            }
          } else {
            // East resize - moving right edge
            const rawRightEdge = session.rightEdgePct + deltaPct;
            // Constrain right edge to 100% max (canvas right boundary)
            const maxRightEdge = 100;
            const constrainedRightEdge = Math.min(maxRightEdge, rawRightEdge);
            const newWidth = Math.max(
              COL_PCT,
              constrainedRightEdge - session.leftEdgePct,
            );
            patch.blockWidth = newWidth;
            if (DEBUG_DRAG) {
              console.log(
                `[useDrag]   east: rawRightEdge=${rawRightEdge.toFixed(2)} constrainedRightEdge=${constrainedRightEdge.toFixed(2)} → width=${patch.blockWidth} (min=${COL_PCT.toFixed(2)})`,
              );
            }
          }
        }

        if (
          affectsHeight &&
          session.topEdgePx !== undefined &&
          session.bottomEdgePx !== undefined &&
          session.naturalTopPx !== undefined
        ) {
          const isTop = ["nw", "n", "ne"].includes(handle);

          if (isTop) {
            // Top resize - moving top edge
            const desiredTopEdge = session.topEdgePx + dy;
            // Constrain: top edge can't go above canvas top (bounds.minY),
            // and can't go below bottomEdge - minHeight (20px).
            const minTopEdge = bounds.minY;
            const newTopEdge = Math.max(
              minTopEdge,
              Math.min(session.bottomEdgePx - 20, desiredTopEdge),
            );

            patch.blockOffsetY = Math.round(newTopEdge - session.naturalTopPx);
            patch.blockHeight = Math.round(session.bottomEdgePx - newTopEdge);

            if (DEBUG_DRAG) {
              console.log(
                `[useDrag]   top: desiredTopEdge=${desiredTopEdge} newTopEdge=${newTopEdge} minTopEdge=${minTopEdge}`,
              );
            }
          } else {
            // Bottom resize - moving bottom edge
            const desiredBottomEdge = session.bottomEdgePx + dy;
            // Constrain to canvas bottom boundary and minimum height (TR-001)
            const maxBottomEdge = Math.min(bounds.maxY, desiredBottomEdge);
            const newHeight = Math.max(20, maxBottomEdge - session.topEdgePx);
            patch.blockHeight = Math.round(newHeight);

            if (DEBUG_DRAG) {
              console.log(
                `[useDrag]   bottom: desiredBottomEdge=${desiredBottomEdge} maxBottomEdge=${maxBottomEdge} newHeight=${newHeight}`,
              );
            }
          }
        }

        if (Object.keys(patch).length > 0) {
          const liveBlock = useEditorStore
            .getState()
            .blocks.find((b) => b.id === session.blockId);
          const liveConfig = parseCfg(liveBlock?.config);
          const newConfig = { ...liveConfig, ...patch };

          if (DEBUG_DRAG) {
            console.log(
              `[useDrag]   patch:`,
              JSON.parse(JSON.stringify(patch)),
            );
            console.log(
              `[useDrag]   final config:`,
              JSON.parse(JSON.stringify(newConfig)),
            );
          }

          // Store pending update instead of applying immediately
          pendingUpdateRef.current = { config: newConfig };

          // Schedule rAF if not already scheduled
          if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(applyUpdate);
          }
        }
      }
    },

    [applyUpdate, blocks, containerRef, scaleFactor, setInspectorTab],
  );

  const onPointerUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  // ── Shared listener setup ─────────────────────────────────────────────

  function attachListeners(e: React.PointerEvent) {
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const ownerDoc = target.ownerDocument;
    const ownerWin = ownerDoc.defaultView ?? window;
    const isCrossFrame = ownerWin !== window;

    const preventSelect = (ev: Event) => ev.preventDefault();
    ownerDoc.addEventListener("selectstart", preventSelect);
    ownerDoc.body.style.userSelect = "none";
    if (isCrossFrame) {
      document.addEventListener("selectstart", preventSelect);
      document.body.style.userSelect = "none";
    }

    const move = (ev: PointerEvent) => onPointerMove(ev);
    const up = () => {
      onPointerUp();
      ownerDoc.removeEventListener("selectstart", preventSelect);
      ownerDoc.body.style.userSelect = "";
      ownerWin.removeEventListener("pointermove", move);
      ownerWin.removeEventListener("pointerup", up);
      ownerWin.removeEventListener("pointercancel", up);
      if (isCrossFrame) {
        document.removeEventListener("selectstart", preventSelect);
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      }
    };

    ownerWin.addEventListener("pointermove", move);
    ownerWin.addEventListener("pointerup", up);
    ownerWin.addEventListener("pointercancel", up);
    if (isCrossFrame) {
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    }

    cleanupRef.current = () => {
      ownerDoc.removeEventListener("selectstart", preventSelect);
      ownerDoc.body.style.userSelect = "";
      ownerWin.removeEventListener("pointermove", move);
      ownerWin.removeEventListener("pointerup", up);
      ownerWin.removeEventListener("pointercancel", up);
      if (isCrossFrame) {
        document.removeEventListener("selectstart", preventSelect);
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      }
    };
  }

  // ── Public API ─────────────────────────────────────────────────────────

  const startMove = useCallback(
    (blockId: string, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const block = blocks.find((b) => b.id === blockId);
      const config = parseCfg(block?.config);

      // Pause undo tracking for the duration of the drag. All intermediate
      // pointermove updates are silent; a single entry is committed on pointerup.
      temporalStore.getState().pause();

      // Defer tab switch until actual movement occurs — prevents clicks from switching tab.
      pendingTabSwitchRef.current = true;

      let startOffsetX =
        typeof config.blockOffsetX === "number" ? config.blockOffsetX : 0;
      let startOffsetY =
        typeof config.blockOffsetY === "number" ? config.blockOffsetY : 0;

      // If the block has no stored position, seed from its current DOM position.
      // Without this, a block that just became absolute would snap to top:0 on the
      // first drag move instead of staying where it visually was.
      if (startOffsetX === 0 && startOffsetY === 0) {
        const container = containerRef.current;
        const blockEl = container?.querySelector<HTMLElement>(
          `[data-block-id="${blockId}"]`,
        );
        if (blockEl && container) {
          const blockRect = blockEl.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          // getBoundingClientRect returns scaled (screen) pixels — divide by
          // scaleFactor to seed offsets in canonical canvas pixels.
          const measuredX = Math.round(
            (blockRect.left - containerRect.left) / scaleFactor,
          );
          const measuredY = Math.round(
            (blockRect.top - containerRect.top) / scaleFactor +
              container.scrollTop,
          );
          if (measuredX !== 0 || measuredY !== 0) {
            startOffsetX = measuredX;
            startOffsetY = measuredY;
          }
        }
      }

      sessionRef.current = {
        kind: "move",
        blockId,
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX,
        startOffsetY,
      };

      setDrag({ kind: "block", id: blockId });
      setIsDragging(true);
      setDraggedId(blockId);
      attachListeners(e);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps intentionally narrowed; this effect must not re-run on the omitted stable/ref values
    [
      blocks,
      onPointerMove,
      onPointerUp,
      setDrag,
      setInspectorTab,
      scaleFactor,
      temporalStore,
    ],
  );

  const startResize = useCallback(
    (blockId: string, handle: HandlePosition, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const container = containerRef.current;
      if (!container) return;

      const block = blocks.find((b) => b.id === blockId);
      const config = parseCfg(block?.config);

      const blockEl = container.querySelector<HTMLElement>(
        `[data-block-id="${blockId}"]`,
      );
      if (!blockEl) return;

      const blockRect = blockEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      // Use canonical (unscaled) width so percentage calculations are correct
      // regardless of the CSS transform: scale() applied by BreakpointFrame.
      const containerWidth = containerRect.width / scaleFactor;

      // blockRect values are in screen pixels — divide by scaleFactor to get
      // canonical canvas pixel positions before computing percentages/offsets.
      const leftEdgePct =
        ((blockRect.left - containerRect.left) / scaleFactor / containerWidth) *
        100;
      const rightEdgePct =
        ((blockRect.right - containerRect.left) /
          scaleFactor /
          containerWidth) *
        100;

      const topEdgePx = (blockRect.top - containerRect.top) / scaleFactor;
      const bottomEdgePx = (blockRect.bottom - containerRect.top) / scaleFactor;
      const currentOffsetY =
        typeof config.blockOffsetY === "number" ? config.blockOffsetY : 0;
      const naturalTopPx = topEdgePx - currentOffsetY;

      if (DEBUG_DRAG) {
        console.group(
          `[useDrag] startResize handle=${handle} block=${blockId}`,
        );
        console.log("block type:", block?.type);
        console.log("current config:", JSON.parse(JSON.stringify(config)));
        console.log("containerWidth (canonical px):", containerWidth);
        console.log("blockRect:", {
          left: blockRect.left,
          right: blockRect.right,
          width: blockRect.width,
          top: blockRect.top,
          bottom: blockRect.bottom,
        });
        console.log("containerRect:", {
          left: containerRect.left,
          right: containerRect.right,
          width: containerRect.width,
        });
        console.log(
          "leftEdgePct:",
          leftEdgePct.toFixed(2),
          "rightEdgePct:",
          rightEdgePct.toFixed(2),
        );
        console.log(
          "blockOffsetX:",
          config.blockOffsetX,
          "blockOffsetY:",
          config.blockOffsetY,
        );
        console.log(
          "blockMarginLeft:",
          config.blockMarginLeft,
          "blockWidth:",
          config.blockWidth,
        );
        console.groupEnd();
      }

      temporalStore.getState().pause();

      // Auto-switch to advanced tab when resizing starts (TR-012)
      setInspectorTab("advanced");

      sessionRef.current = {
        kind: "resize",
        blockId,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        containerWidth,
        hadBlockHeightAtStart: typeof config.blockHeight === "number",
        leftEdgePct,
        rightEdgePct,
        topEdgePx,
        bottomEdgePx,
        naturalTopPx,
      };

      setDrag({ kind: "block", id: blockId });
      setIsDragging(true);
      setDraggedId(blockId);
      attachListeners(e);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps intentionally narrowed; this effect must not re-run on the omitted stable/ref values
    [
      blocks,
      containerRef,
      onPointerMove,
      onPointerUp,
      setDrag,
      setInspectorTab,
      scaleFactor,
      temporalStore,
    ],
  );

  return { isDragging, draggedId, collidingIds, startMove, startResize };
}
