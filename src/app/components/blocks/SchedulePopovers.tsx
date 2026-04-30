"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";

export const WEDDING_EMOJIS = [
  "💒", "👰", "🤵", "💍", "🎂", "🥂", "🍽️", "🎶",
  "💃", "🕺", "📸", "✈️", "🚗", "🏨", "⛪", "🎊",
  "🎉", "🌸", "🌺", "💐", "🎤", "🍾", "🥳", "🎭", "🎪",
];

// ── Popover position helper ───────────────────────────────────────────────────
export function usePopoverPosition(anchorRect: DOMRect | null): React.CSSProperties {
  if (!anchorRect) return { top: 0, left: 0, transform: "translateX(-50%)" };
  let top = anchorRect.bottom + 8;
  const left = anchorRect.left + anchorRect.width / 2;
  const transform = "translateX(-50%)";
  if (top + 320 > window.innerHeight) {
    top = anchorRect.top - 8;
  }
  return { top, left, transform };
}

// ── Close-on-escape + click-outside hook ────────────────────────────────────
export function usePopoverDismiss(panelRef: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", handleKey);
    const timer = setTimeout(() => document.addEventListener("mousedown", handleClick), 0);
    return () => {
      document.removeEventListener("keydown", handleKey);
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose, panelRef]);
}

// ── Emoji picker popover ──────────────────────────────────────────────────────
interface EmojiPickerProps {
  anchorRect: DOMRect;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ anchorRect, onSelect, onClose }: EmojiPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  usePopoverDismiss(panelRef, onClose);
  const pos = usePopoverPosition(anchorRect);

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[9999] rounded-lg border border-border bg-popover shadow-lg"
      style={{ ...pos, width: "200px", padding: "0.5rem" }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px" }}>
        {WEDDING_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            style={{
              fontSize: "1.25rem", background: "none", border: "none",
              cursor: "pointer", borderRadius: "4px", padding: "4px",
              lineHeight: 1,
            }}
            className="hover:bg-accent/50"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}

// ── Date picker popover ───────────────────────────────────────────────────────
interface DatePickerPopoverProps {
  anchorRect: DOMRect;
  value: string;
  onSave: (val: string) => void;
  onClose: () => void;
}

export function DatePickerPopover({ anchorRect, value, onSave, onClose }: DatePickerPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  usePopoverDismiss(panelRef, onClose);
  const pos = usePopoverPosition(anchorRect);
  const [local, setLocal] = useState(value);

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[9999] rounded-lg border border-border bg-popover shadow-lg"
      style={{ ...pos, padding: "0.75rem", minWidth: "200px" }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</label>
      <DatePicker
        value={local}
        onChange={setLocal}
        onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") { onSave(local); onClose(); } }}
        className="mt-1 h-7"
        autoFocus
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => { onSave(local); onClose(); }}
          className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Save
        </button>
        {local && (
          <button
            type="button"
            onClick={() => { onSave(""); onClose(); }}
            className="rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent/50"
          >
            Clear
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── Time picker popover ───────────────────────────────────────────────────────
interface TimePickerPopoverProps {
  anchorRect: DOMRect;
  value: string;
  label: string;
  onSave: (val: string) => void;
  onClose: () => void;
}

export function TimePickerPopover({ anchorRect, value, label, onSave, onClose }: TimePickerPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  usePopoverDismiss(panelRef, onClose);
  const pos = usePopoverPosition(anchorRect);
  const [local, setLocal] = useState(value);

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[9999] rounded-lg border border-border bg-popover shadow-lg"
      style={{ ...pos, padding: "0.75rem", minWidth: "180px" }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <TimePicker
        value={local}
        onChange={setLocal}
        onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") { onSave(local); onClose(); } }}
        className="mt-1 h-7"
        autoFocus
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => { onSave(local); onClose(); }}
          className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Save
        </button>
        {local && (
          <button
            type="button"
            onClick={() => { onSave(""); onClose(); }}
            className="rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent/50"
          >
            Clear
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── Maps URL popover ──────────────────────────────────────────────────────────
interface MapsPopoverProps {
  anchorRect: DOMRect;
  value: string;
  onSave: (val: string) => void;
  onClose: () => void;
}

export function MapsPopover({ anchorRect, value, onSave, onClose }: MapsPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  usePopoverDismiss(panelRef, onClose);
  const pos = usePopoverPosition(anchorRect);
  const [local, setLocal] = useState(value);

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[9999] w-64 rounded-lg border border-border bg-popover shadow-lg"
      style={pos}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs font-semibold text-foreground">Location URL</p>
      </div>
      <div className="p-3">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Maps URL</label>
        <input
          type="url"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") { onSave(local); onClose(); } }}
          placeholder="https://maps.google.com/..."
          className="mt-1 h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
        />
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <button
          type="button"
          onClick={() => { onSave(local); onClose(); }}
          className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Save
        </button>
        {value && (
          <button
            type="button"
            onClick={() => { onSave(""); onClose(); }}
            className="rounded-md border border-border px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            Remove
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── Add button (dotted border) ────────────────────────────────────────────────
export function AddEventButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      style={{ minHeight: "80px", width: "100%", background: "transparent", cursor: "pointer" }}
    >
      <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>+</span>
    </button>
  );
}
