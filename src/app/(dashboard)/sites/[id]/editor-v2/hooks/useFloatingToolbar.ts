"use client";

import { useCallback, useState } from "react";

interface Position {
  top: number;
  left: number;
}

interface UseFloatingToolbarReturn {
  visible: boolean;
  position: Position;
  show(rect: DOMRect): void;
  hide(): void;
}

const TOOLBAR_HEIGHT = 44; // px — used for the flip-below calculation
const TOOLBAR_MARGIN = 8; // gap between toolbar bottom edge and block top

/**
 * Manages floating toolbar visibility and position.
 *
 * `show(rect)` receives a block's DOMRect (viewport-relative) and derives the
 * toolbar position in viewport coordinates. The caller renders the toolbar as
 * position:fixed so these coordinates map directly.
 *
 * Flip logic: if the block sits too close to the top of the viewport (less than
 * toolbar height + margin), the toolbar is pinned below the block instead.
 */
export function useFloatingToolbar(): UseFloatingToolbarReturn {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });

  const show = useCallback((rect: DOMRect) => {
    const spaceAbove = rect.top;
    const fitsAbove = spaceAbove >= TOOLBAR_HEIGHT + TOOLBAR_MARGIN;

    const top = fitsAbove
      ? rect.top - TOOLBAR_HEIGHT - TOOLBAR_MARGIN
      : rect.bottom + TOOLBAR_MARGIN;

    // Center over the block, clamped so the toolbar doesn't bleed off either
    // edge of the viewport (assuming ~340px toolbar width).
    const TOOLBAR_WIDTH = 340;
    const rawLeft = rect.left + rect.width / 2 - TOOLBAR_WIDTH / 2;
    const left = Math.max(8, Math.min(rawLeft, window.innerWidth - TOOLBAR_WIDTH - 8));

    setPosition({ top, left });
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  return { visible, position, show, hide };
}
