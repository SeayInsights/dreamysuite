/**
 * useLastFocus.ts
 *
 * Tracks the last-focused element within the canvas ([data-breakpoint]).
 * Used by the focus-restoration pattern: instead of exempting inspector/toolbar
 * elements from blur handlers, the inspector calls restoreFocus() on mousedown
 * so focus never leaves the editable element during inspector interactions.
 *
 * The ref is module-level so both useEditEventHandlers and InspectorV2 share
 * the same stored element without needing a context provider.
 */

import { useEffect, useCallback } from "react";

// Module-level singleton — one editor instance per page
const lastFocusedRef = { current: null as HTMLElement | null };

export function useLastFocus() {
  useEffect(() => {
    const canvas = document.querySelector("[data-breakpoint]");
    if (!canvas) return;

    function handleFocusIn(e: Event) {
      lastFocusedRef.current = e.target as HTMLElement;
    }

    canvas.addEventListener("focusin", handleFocusIn);
    return () => canvas.removeEventListener("focusin", handleFocusIn);
  }, []);

  const restoreFocus = useCallback(() => {
    const el = lastFocusedRef.current;
    if (el) el.focus();
  }, []);

  return { restoreFocus };
}
