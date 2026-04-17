"use client";

import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LONG_PRESS_DELAY = 500;           // ms before long-press fires
const LONG_PRESS_MOVE_THRESHOLD = 10;   // px — cancel long-press if pointer moves more
const DEFAULT_MIN_SCALE = 0.25;
const DEFAULT_MAX_SCALE = 4;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pointerDist(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseGesturesOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  /** Called after a 500ms hold without significant movement */
  onLongPress?: (position: { x: number; y: number }) => void;
  minScale?: number;
  maxScale?: number;
}

export interface UseGesturesResult {
  /** Current zoom level — apply as CSS transform: scale(scale) on canvas content */
  scale: number;
  /** True while two or more pointers are active (pinch or two-finger scroll) */
  isGesturing: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useGestures
 *
 * Attaches pointer event listeners to containerRef and provides:
 *   - Pinch-to-zoom: two-finger spread/pinch updates `scale`
 *   - Long-press: single finger hold fires `onLongPress` (used to open context menu)
 *   - Two-finger guard: `isGesturing` is true while 2+ pointers are active,
 *     letting EditorOverlay suppress accidental block selection during scroll
 */
export function useGestures({
  containerRef,
  onLongPress,
  minScale = DEFAULT_MIN_SCALE,
  maxScale = DEFAULT_MAX_SCALE,
}: UseGesturesOptions): UseGesturesResult {
  const [scale, setScale] = useState(1);
  const [isGesturing, setIsGesturing] = useState(false);

  // Mutable state in refs — always current inside event handlers
  const activePointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ startDist: number; baseScale: number } | null>(null);
  const scaleRef = useRef(1); // mirrors scale state for use in sync handlers
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressOrigin = useRef<{ x: number; y: number } | null>(null);
  const onLongPressRef = useRef(onLongPress);
  onLongPressRef.current = onLongPress;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // ── Helpers ─────────────────────────────────────────────────────────────

    function cancelLongPress() {
      if (longPressTimer.current !== null) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      longPressOrigin.current = null;
    }

    // ── Handlers ────────────────────────────────────────────────────────────

    function handleDown(e: PointerEvent) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const count = activePointers.current.size;

      if (count >= 2) {
        // Two-finger gesture begins — cancel any pending long-press
        cancelLongPress();
        setIsGesturing(true);

        // Snapshot pinch start values
        const pts = [...activePointers.current.values()];
        pinch.current = {
          startDist: pointerDist(pts[0], pts[1]),
          baseScale: scaleRef.current,
        };
      } else {
        // Single finger — start long-press timer
        setIsGesturing(false);
        pinch.current = null;
        longPressOrigin.current = { x: e.clientX, y: e.clientY };
        longPressTimer.current = setTimeout(() => {
          longPressTimer.current = null;
          const origin = longPressOrigin.current;
          if (origin) onLongPressRef.current?.(origin);
        }, LONG_PRESS_DELAY);
      }
    }

    function handleMove(e: PointerEvent) {
      if (!activePointers.current.has(e.pointerId)) return;
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const count = activePointers.current.size;

      if (count >= 2 && pinch.current) {
        // Pinch — prevent browser page-zoom on mobile
        e.preventDefault();
        const pts = [...activePointers.current.values()];
        const currentDist = pointerDist(pts[0], pts[1]);
        const ratio = currentDist / pinch.current.startDist;
        const next = Math.min(maxScale, Math.max(minScale, pinch.current.baseScale * ratio));
        scaleRef.current = next;
        setScale(next);
      } else if (count === 1 && longPressOrigin.current) {
        // Cancel long-press if finger moved too far
        const o = longPressOrigin.current;
        if (
          Math.abs(e.clientX - o.x) > LONG_PRESS_MOVE_THRESHOLD ||
          Math.abs(e.clientY - o.y) > LONG_PRESS_MOVE_THRESHOLD
        ) {
          cancelLongPress();
        }
      }
    }

    function handleUp(e: PointerEvent) {
      activePointers.current.delete(e.pointerId);
      const count = activePointers.current.size;

      if (count < 2) {
        // Pinch ended — lock in current scale as new base for next pinch
        if (pinch.current) {
          pinch.current = { startDist: 0, baseScale: scaleRef.current };
          pinch.current = null;
        }
        setIsGesturing(false);
      }

      if (count === 0) cancelLongPress();
    }

    function handleCancel(e: PointerEvent) {
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size < 2) {
        pinch.current = null;
        setIsGesturing(false);
      }
      cancelLongPress();
    }

    // passive:false on pointermove so preventDefault() works (blocks browser zoom)
    el.addEventListener("pointerdown", handleDown, { passive: true });
    el.addEventListener("pointermove", handleMove, { passive: false });
    el.addEventListener("pointerup", handleUp, { passive: true });
    el.addEventListener("pointercancel", handleCancel, { passive: true });

    return () => {
      el.removeEventListener("pointerdown", handleDown);
      el.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerup", handleUp);
      el.removeEventListener("pointercancel", handleCancel);
      cancelLongPress();
    };
  }, [containerRef, minScale, maxScale]);

  return { scale, isGesturing };
}
