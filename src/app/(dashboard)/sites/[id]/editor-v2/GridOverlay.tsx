"use client";

import React, { useEffect, useState } from "react";

const COLUMNS = 12;

/**
 * GridOverlay renders 12 vertical column guide lines over the full canvas.
 *
 * Visible only while the user holds the `G` key. Returns null when hidden,
 * so there is no DOM cost at rest. Lines are positioned at each column
 * boundary (1/12, 2/12, … 11/12) as percentage left offsets. The outer
 * edges (0 and 100%) are omitted — they coincide with the canvas border.
 *
 * Mount this as a sibling of the canvas content inside the same relative
 * container, using `pointer-events-none` so it never intercepts clicks.
 */
export function GridOverlay(): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ignore when focus is in an input / contenteditable
      const tag = (e.target as HTMLElement).tagName;
      const editable = (e.target as HTMLElement).isContentEditable;
      if (tag === "INPUT" || tag === "TEXTAREA" || editable) return;

      if (e.key === "g" || e.key === "G") {
        setVisible(true);
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "g" || e.key === "G") {
        setVisible(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  if (!visible) return null;

  // Render 11 interior column lines (skip 0% and 100% edges)
  const lines = Array.from({ length: COLUMNS - 1 }, (_, i) => i + 1);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[var(--z-canvas-overlay)]"
    >
      {lines.map((col) => (
        <div
          key={col}
          className="absolute top-0 h-full w-px border-primary/20 bg-primary/20"
          style={{ left: `${(col / COLUMNS) * 100}%` }}
        />
      ))}
    </div>
  );
}
