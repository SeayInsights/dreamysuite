import { useCallback } from "react";

const lastFocusedRef = { current: null as HTMLElement | null };

export function setLastFocusedElement(el: HTMLElement | null) {
  lastFocusedRef.current = el;
}

export function useLastFocus() {
  const restoreFocus = useCallback(() => {
    const el = lastFocusedRef.current;
    if (el) el.focus();
  }, []);

  return { restoreFocus };
}
