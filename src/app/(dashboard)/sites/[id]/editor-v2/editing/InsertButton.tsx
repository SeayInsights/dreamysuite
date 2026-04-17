"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { InsertPalette } from "./InsertPalette";

interface InsertSlot {
  afterBlockId: string | null;
  insertIndex: number;
  top: number;
  left: number;
  width: number;
}

interface Props {
  containerRef: React.RefObject<HTMLElement | null>;
}

const HOVER_ZONE = 24;

export function InsertButton({ containerRef }: Props) {
  const blocks = useEditorStore((s) => s.blocks);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const [slot, setSlot] = useState<InsertSlot | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const computeSlots = useCallback((): InsertSlot[] => {
    const container = containerRef.current;
    if (!container) return [];
    const blockEls = Array.from(container.querySelectorAll<HTMLElement>("[data-block-id]"));
    if (!blockEls.length) return [];

    const containerBox = container.getBoundingClientRect();
    const slots: InsertSlot[] = [];

    blockEls.forEach((el, i) => {
      const box = el.getBoundingClientRect();
      const mid = box.bottom - containerBox.top + container.scrollTop;
      slots.push({
        afterBlockId: el.dataset.blockId ?? null,
        insertIndex: i + 1,
        top: mid,
        left: containerBox.left,
        width: containerBox.width,
      });
    });

    // Also a slot before the first block
    const firstBox = blockEls[0].getBoundingClientRect();
    slots.unshift({
      afterBlockId: null,
      insertIndex: 0,
      top: firstBox.top - containerBox.top + container.scrollTop - 4,
      left: containerBox.left,
      width: containerBox.width,
    });

    return slots;
  }, [containerRef, blocks]);

  function onMouseMove(e: MouseEvent) {
    if (paletteOpen) return;
    const container = containerRef.current;
    if (!container) return;

    const containerBox = container.getBoundingClientRect();
    const relY = e.clientY - containerBox.top + container.scrollTop;

    const slots = computeSlots();
    const hit = slots.find((s) => Math.abs(relY - s.top) < HOVER_ZONE);
    if (hit) {
      if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
      setSlot(hit);
    } else {
      if (!hideTimerRef.current) {
        hideTimerRef.current = setTimeout(() => { setSlot(null); hideTimerRef.current = null; }, 200);
      }
    }
  }

  function onMouseLeave() {
    if (paletteOpen) return;
    hideTimerRef.current = setTimeout(() => { setSlot(null); hideTimerRef.current = null; }, 300);
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);
    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [containerRef, paletteOpen, computeSlots]);

  useEffect(() => () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  if (!slot) return null;

  // Suppress the insert button only at the two slot boundaries that border the
  // selected block (above and below it) — they visually collide with the
  // selection ring. Slots between other blocks remain interactive.
  if (selectedBlockId) {
    const selectedIndex = blocks.findIndex((b) => b.id === selectedBlockId);
    if (
      selectedIndex !== -1 &&
      (slot.insertIndex === selectedIndex || slot.insertIndex === selectedIndex + 1)
    ) {
      return null;
    }
  }

  return (
    <>
      {/* + button */}
      <button
        ref={buttonRef}
        aria-label="Insert block"
        onClick={() => setPaletteOpen(true)}
        style={{
          position: "absolute",
          top: slot.top - 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 40,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "var(--accent, #B8921A)",
          color: "#fff",
          border: "2px solid #fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "16px",
          lineHeight: 1,
          padding: 0,
        }}
      >
        +
      </button>

      {/* Thin guide line across the canvas */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: slot.top,
          left: 0,
          right: 0,
          height: 1,
          background: "var(--accent, #B8921A)",
          opacity: 0.4,
          pointerEvents: "none",
          zIndex: 39,
        }}
      />

      {paletteOpen && (
        <InsertPalette
          insertIndex={slot.insertIndex}
          anchorRef={buttonRef as React.RefObject<HTMLElement | null>}
          onClose={() => { setPaletteOpen(false); setSlot(null); }}
        />
      )}
    </>
  );
}
