"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { getVisibleBlocks, BLOCK_REGISTRY } from "../blocks/registry";

interface Props {
  insertIndex: number;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function InsertPalette({ insertIndex, onClose, anchorRef }: Props) {
  const mode = useEditorStore((s) => s.mode);
  const insertBlock = useEditorStore((s) => s.insertBlock);
  const blocks = useEditorStore((s) => s.blocks);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  const category = mode === "simple" ? "Simple" : undefined;
  const allEntries = getVisibleBlocks(category);

  const filtered = query.trim()
    ? allEntries.filter(([, e]) =>
        e.displayName.toLowerCase().includes(query.toLowerCase())
      )
    : allEntries;

  // Reset active index when filter changes
  useEffect(() => { setActiveIndex(0); }, [query]);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Position below anchor
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const box = anchor.getBoundingClientRect();
    setPos({ top: box.bottom + 6, left: Math.max(8, box.left - 80) });
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  const doInsert = useCallback((type: string) => {
    const entry = BLOCK_REGISTRY[type];
    if (!entry) return;
    const id = `block_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    insertBlock(
      { id, type, config: JSON.stringify(entry.defaultData), sortOrder: insertIndex, isVisible: 1 },
      insertIndex,
    );
    // Patch sortOrder on subsequent blocks
    const updated = useEditorStore.getState().blocks;
    updated.forEach((b, i) => {
      if (b.id !== id && (b.sortOrder as number) >= insertIndex) {
        useEditorStore.getState().updateBlock(b.id, { sortOrder: i });
      }
    });
    onClose();
  }, [insertBlock, insertIndex, blocks, onClose]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[activeIndex]) doInsert(filtered[activeIndex][0]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  }

  if (!pos) return null;

  return (
    <div
      ref={paletteRef}
      role="dialog"
      aria-label="Insert block"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: 260,
        background: "#fff",
        border: "1px solid #e0dbd4",
        borderRadius: "8px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        zIndex: 200,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "8px" }}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search blocks…"
          style={{
            width: "100%", padding: "6px 10px", border: "1px solid #e0dbd4",
            borderRadius: "6px", fontSize: "0.85rem", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <p style={{ padding: "12px 16px", color: "#9b8e85", fontSize: "0.82rem", margin: 0 }}>
            No blocks found.
          </p>
        ) : (
          filtered.map(([type, entry], i) => (
            <button
              key={type}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => doInsert(type)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                width: "100%", padding: "8px 12px", border: "none", textAlign: "left",
                background: i === activeIndex ? "#faf8f6" : "transparent",
                cursor: "pointer", fontSize: "0.85rem",
              }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: "6px", background: "#f5f0eb",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", color: "#6b6560", flexShrink: 0,
              }}>
                {entry.displayName.slice(0, 2)}
              </span>
              <span style={{ fontWeight: 500, color: "#1c1917" }}>{entry.displayName}</span>
              {entry.category === "Pro" && (
                <span style={{ marginLeft: "auto", fontSize: "0.65rem", fontWeight: 700, color: "#B8921A", letterSpacing: "0.05em" }}>
                  PRO
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
