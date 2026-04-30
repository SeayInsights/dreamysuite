"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { blockSectionStyle, editableProps, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";
import { useEditorStore } from "@/app/stores/editorStore";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";

interface ScheduleEvent {
  id: string;
  name?: string;
  date?: string;
  time?: string;
  endTime?: string;
  location?: string;
  description?: string;
  dressCode?: string;
  icon?: string;
  mapsUrl?: string;
}

interface Block { id: string; type: string; [key: string]: unknown }

const WEDDING_EMOJIS = [
  "💒", "👰", "🤵", "💍", "🎂", "🥂", "🍽️", "🎶",
  "💃", "🕺", "📸", "✈️", "🚗", "🏨", "⛪", "🎊",
  "🎉", "🌸", "🌺", "💐", "🎤", "🍾", "🥳", "🎭", "🎪",
];

// ── Popover position helper ───────────────────────────────────────────────────
function usePopoverPosition(anchorRect: DOMRect | null): React.CSSProperties {
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
function usePopoverDismiss(panelRef: React.RefObject<HTMLElement | null>, onClose: () => void) {
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

function EmojiPicker({ anchorRect, onSelect, onClose }: EmojiPickerProps) {
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
interface DatePickerProps {
  anchorRect: DOMRect;
  value: string;
  onSave: (val: string) => void;
  onClose: () => void;
}

function DatePickerPopover({ anchorRect, value, onSave, onClose }: DatePickerProps) {
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
interface TimePickerProps {
  anchorRect: DOMRect;
  value: string;
  label: string;
  onSave: (val: string) => void;
  onClose: () => void;
}

function TimePickerPopover({ anchorRect, value, label, onSave, onClose }: TimePickerProps) {
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

function MapsPopover({ anchorRect, value, onSave, onClose }: MapsPopoverProps) {
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
function AddEventButton({ onClick }: { onClick: () => void }) {
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

// ── Popover state type ────────────────────────────────────────────────────────
type PopoverType = "emoji" | "date" | "time" | "endTime" | "mapsUrl";
interface PopoverState {
  type: PopoverType;
  eventId: string;
  rect: DOMRect;
}

// ── Single event card ─────────────────────────────────────────────────────────
interface EventCardProps {
  event: ScheduleEvent;
  index: number;
  editing: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onUpdate: (id: string, patch: Partial<ScheduleEvent>) => void;
  onDelete: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
  onOpenPopover: (type: PopoverType, eventId: string, rect: DOMRect) => void;
}

function EventCard({
  event, index, editing, isDragging, isDropTarget,
  onUpdate, onDelete, onDragStart, onDragOver, onDrop, onDragEnd, onOpenPopover,
}: EventCardProps) {
  const cardStyle: React.CSSProperties = {
    background: "var(--bg, #fff)",
    border: isDropTarget ? "2px dashed var(--accent, #B8921A)" : "1px solid var(--border)",
    borderRadius: "10px",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
    position: "relative",
    opacity: isDragging ? 0.4 : 1,
    transition: "opacity 0.15s, border-color 0.15s",
  };

  function handleTitleBlur(e: React.FocusEvent<HTMLDivElement>) {
    onUpdate(event.id, { name: e.currentTarget.textContent ?? "" });
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }
    e.stopPropagation();
  }

  function handleDescriptionBlur(e: React.FocusEvent<HTMLDivElement>) {
    onUpdate(event.id, { description: e.currentTarget.textContent ?? "" });
  }

  function handleDescriptionKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }
    e.stopPropagation();
  }

  function handleDressCodeBlur(e: React.FocusEvent<HTMLDivElement>) {
    onUpdate(event.id, { dressCode: e.currentTarget.textContent ?? "" });
  }

  function handleDressCodeKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }
    e.stopPropagation();
  }

  function openPopover(type: PopoverType, e: React.MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onOpenPopover(type, event.id, rect);
  }

  // Format display time
  function formatTime(t?: string) {
    if (!t) return null;
    try {
      const [h, m] = t.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const hour = h % 12 || 12;
      return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
    } catch {
      return t;
    }
  }

  // Format display date
  function formatDate(d?: string) {
    if (!d) return null;
    try {
      const [y, mo, da] = d.split("-").map(Number);
      return new Date(y, mo - 1, da).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return d;
    }
  }

  return (
    <div
      style={cardStyle}
      className="group/event"
      onDragOver={(e) => { e.preventDefault(); onDragOver(e, index); }}
      onDrop={(e) => { e.preventDefault(); onDrop(index); }}
    >
      {/* Drag handle + delete — visible on hover in editing mode */}
      {editing && (
        <>
          <div
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnd={onDragEnd}
            className="absolute left-2 top-3 hidden cursor-grab items-center justify-center text-muted-foreground group-hover/event:flex"
            style={{ fontSize: "1rem", userSelect: "none", lineHeight: 1 }}
            title="Drag to reorder"
          >
            ⠿
          </div>
          <button
            type="button"
            onClick={() => onDelete(event.id)}
            className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/event:flex"
            title="Delete event"
          >
            ✕
          </button>
        </>
      )}

      {/* Icon + Title row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", paddingLeft: editing ? "1.25rem" : 0 }}>
        {editing ? (
          <button
            type="button"
            onClick={(e) => openPopover("emoji", e)}
            style={{
              fontSize: "1.25rem", background: "none", border: "none", cursor: "pointer",
              lineHeight: 1, minWidth: "1.5rem", flexShrink: 0, borderRadius: "4px", padding: "1px",
            }}
            className="hover:bg-accent/20"
            title="Change icon"
          >
            {event.icon || "✨"}
          </button>
        ) : (
          event.icon && (
            <span style={{ fontSize: "1.25rem", lineHeight: 1, flexShrink: 0 }}>{event.icon}</span>
          )
        )}
        <div
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          style={{
            fontWeight: 600, fontSize: "0.95rem", flex: 1, outline: "none",
            borderBottom: editing ? "1px dashed var(--border)" : "none",
            minHeight: "1.2em",
            cursor: editing ? "text" : "default",
          }}
          data-placeholder="Event name"
        >
          {event.name || (editing ? "" : <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Event name</span>)}
        </div>
      </div>

      {/* Date row */}
      {(event.date || editing) && (
        editing ? (
          <button
            type="button"
            onClick={(e) => openPopover("date", e)}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              textAlign: "left", fontSize: "0.72rem", fontWeight: 700,
              color: "var(--accent, #B8921A)", textTransform: "uppercase", letterSpacing: "0.04em",
            }}
            className="hover:opacity-70"
          >
            {event.date ? formatDate(event.date) : <span style={{ opacity: 0.4, fontStyle: "italic" }}>+ Add date</span>}
          </button>
        ) : (
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "var(--accent, #B8921A)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {formatDate(event.date)}
          </p>
        )
      )}

      {/* Time row */}
      {(event.time || event.endTime || editing) && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {editing ? (
            <>
              <button
                type="button"
                onClick={(e) => openPopover("time", e)}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                  fontSize: "0.8rem", color: "var(--accent, #B8921A)", fontWeight: 600,
                }}
                className="hover:opacity-70"
              >
                {event.time ? formatTime(event.time) : <span style={{ opacity: 0.4, fontStyle: "italic" }}>+ Time</span>}
              </button>
              {(event.time || event.endTime) && (
                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>–</span>
              )}
              <button
                type="button"
                onClick={(e) => openPopover("endTime", e)}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                  fontSize: "0.8rem", color: "var(--accent, #B8921A)", fontWeight: 600,
                }}
                className="hover:opacity-70"
              >
                {event.endTime ? formatTime(event.endTime) : <span style={{ opacity: 0.4, fontStyle: "italic", fontSize: "0.75rem" }}>+ End</span>}
              </button>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--accent, #B8921A)", fontWeight: 600 }}>
              {formatTime(event.time)}{event.endTime ? ` – ${formatTime(event.endTime)}` : ""}
            </p>
          )}
        </div>
      )}

      {/* Description */}
      {(event.description || editing) && (
        <div
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={handleDescriptionBlur}
          onKeyDown={handleDescriptionKeyDown}
          style={{
            fontSize: "0.82rem", color: "var(--body-color)", lineHeight: 1.55,
            outline: "none", whiteSpace: "pre-wrap", minHeight: "1.3em",
            borderBottom: editing ? "1px dashed var(--border)" : "none",
            cursor: editing ? "text" : "default",
          }}
        >
          {event.description || (editing ? <span style={{ color: "var(--muted)", opacity: 0.5, fontStyle: "italic" }}>+ Description</span> : null)}
        </div>
      )}

      {/* Dress code */}
      {(event.dressCode || editing) && (
        <div
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={handleDressCodeBlur}
          onKeyDown={handleDressCodeKeyDown}
          style={{
            fontSize: "0.75rem", color: "var(--muted)", outline: "none",
            borderBottom: editing ? "1px dashed var(--border)" : "none",
            cursor: editing ? "text" : "default",
          }}
          data-placeholder="Dress code"
        >
          {event.dressCode
            ? `Dress code: ${event.dressCode}`
            : editing
            ? <span style={{ opacity: 0.4, fontStyle: "italic" }}>+ Dress code</span>
            : null}
        </div>
      )}

      {/* Maps URL */}
      {editing ? (
        <button
          type="button"
          onClick={(e) => openPopover("mapsUrl", e)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontSize: "0.78rem", color: event.mapsUrl ? "var(--accent, #B8921A)" : "var(--muted)",
            textAlign: "left", textDecoration: event.mapsUrl ? "underline" : "none",
          }}
          className="hover:opacity-70"
        >
          {event.mapsUrl ? "Edit location link" : <span style={{ fontStyle: "italic", opacity: 0.5 }}>+ Add location</span>}
        </button>
      ) : (
        event.mapsUrl && (
          <a
            href={event.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "0.78rem", color: "var(--accent, #B8921A)", textDecoration: "underline" }}
          >
            {event.location || "View on map"}
          </a>
        )
      )}
    </div>
  );
}

// ── Main ScheduleBlock ────────────────────────────────────────────────────────
export function ScheduleBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as "desktop" | "tablet" | "mobile";
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Schedule of Events");
  const displayMode = String(cfg.displayMode ?? "timeline");
  const events: ScheduleEvent[] = Array.isArray(cfg.events)
    ? (cfg.events as ScheduleEvent[]).filter((e) => e && typeof e === "object" && typeof e.id === "string")
    : [];

  const fullPreview = useEditorStore((s) => s.fullPreview);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const editing = !fullPreview;

  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // ── Event mutation helpers ──────────────────────────────────────────────────
  const addEvent = useCallback(() => {
    const currentCfg = parseCfg(block.config);
    const currentEvents = Array.isArray(currentCfg.events) ? (currentCfg.events as ScheduleEvent[]) : [];
    const newEvent: ScheduleEvent = { id: crypto.randomUUID(), name: "", icon: "🎉" };
    updateBlock(block.id, {
      config: { ...currentCfg, events: [...currentEvents, newEvent] },
    });
  }, [block.id, block.config, updateBlock]);

  const deleteEvent = useCallback((id: string) => {
    const currentCfg = parseCfg(block.config);
    const currentEvents = Array.isArray(currentCfg.events) ? (currentCfg.events as ScheduleEvent[]) : [];
    updateBlock(block.id, {
      config: { ...currentCfg, events: currentEvents.filter((e) => e.id !== id) },
    });
  }, [block.id, block.config, updateBlock]);

  const updateEvent = useCallback((id: string, patch: Partial<ScheduleEvent>) => {
    const currentCfg = parseCfg(block.config);
    const currentEvents = Array.isArray(currentCfg.events) ? (currentCfg.events as ScheduleEvent[]) : [];
    updateBlock(block.id, {
      config: {
        ...currentCfg,
        events: currentEvents.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      },
    });
  }, [block.id, block.config, updateBlock]);

  // ── Drag-and-drop ───────────────────────────────────────────────────────────
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((_e: React.DragEvent, index: number) => {
    setDropIndex(index);
  }, []);

  const handleDrop = useCallback((index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDropIndex(null);
      return;
    }
    const currentCfg = parseCfg(block.config);
    const currentEvents = Array.isArray(currentCfg.events) ? [...(currentCfg.events as ScheduleEvent[])] : [];
    const [moved] = currentEvents.splice(dragIndex, 1);
    currentEvents.splice(index, 0, moved);
    updateBlock(block.id, {
      config: { ...currentCfg, events: currentEvents },
    });
    setDragIndex(null);
    setDropIndex(null);
  }, [dragIndex, block.id, block.config, updateBlock]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDropIndex(null);
  }, []);

  // ── Popover open ────────────────────────────────────────────────────────────
  const handleOpenPopover = useCallback((type: PopoverType, eventId: string, rect: DOMRect) => {
    setPopover({ type, eventId, rect });
  }, []);

  const handleClosePopover = useCallback(() => setPopover(null), []);

  // Find event for active popover
  const activeEvent = popover ? events.find((e) => e.id === popover.eventId) : null;

  // ── Format time for timeline ────────────────────────────────────────────────
  function formatTime(t?: string) {
    if (!t) return "";
    try {
      const [h, m] = t.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const hour = h % 12 || 12;
      return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
    } catch {
      return t;
    }
  }

  function formatDate(d?: string) {
    if (!d) return null;
    try {
      const [y, mo, da] = d.split("-").map(Number);
      return new Date(y, mo - 1, da).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return d;
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section
      className="block block-schedule"
      data-block-id={block.id}
      data-block-type={block.type}
      style={{ padding: "3rem 1.5rem", ...blockSectionStyle(cfg, breakpoint) }}
    >
      <TextEffectWrapper as="h2" className="section-heading" {...editableProps(cfg, "heading")}>
        {heading || <span style={{ opacity: 0.4, fontStyle: "italic" }}>Add heading</span>}
      </TextEffectWrapper>
      <div className="section-rule" aria-hidden="true" />

      {/* ── Empty state ── */}
      {events.length === 0 && !editing && (
        <p style={{ color: "var(--muted)", fontStyle: "italic", textAlign: "center", marginTop: "1.5rem" }}>
          No events yet
        </p>
      )}

      {events.length === 0 && editing && (
        <div style={{ maxWidth: "400px", margin: "2rem auto 0" }}>
          <AddEventButton onClick={addEvent} />
        </div>
      )}

      {/* ── Cards mode ── */}
      {events.length > 0 && displayMode === "cards" && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "1.25rem", maxWidth: "900px", margin: "2rem auto 0",
        }}>
          {events.map((event, i) => (
            <EventCard
              key={event.id}
              event={event}
              index={i}
              editing={editing}
              isDragging={dragIndex === i}
              isDropTarget={dropIndex === i && dragIndex !== i}
              onUpdate={updateEvent}
              onDelete={deleteEvent}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onOpenPopover={handleOpenPopover}
            />
          ))}
          {editing && (
            <AddEventButton onClick={addEvent} />
          )}
        </div>
      )}

      {/* ── Timeline mode ── */}
      {events.length > 0 && displayMode !== "cards" && (
        <div className="timeline" style={{ maxWidth: "600px", margin: "2rem auto 0", position: "relative" }}>
          {/* Vertical rule */}
          <div style={{
            position: "absolute", left: "5.5rem", top: 0, bottom: 0,
            width: "2px", background: "var(--border)",
          }} aria-hidden="true" />

          {events.map((event, i) => (
            <div
              key={event.id}
              className="timeline-item group/event"
              style={{
                display: "flex", gap: "1.25rem", marginBottom: "1.75rem", position: "relative",
                opacity: dragIndex === i ? 0.4 : 1,
                transition: "opacity 0.15s",
              }}
              onDragOver={(e) => { e.preventDefault(); handleDragOver(e, i); }}
              onDrop={(e) => { e.preventDefault(); handleDrop(i); }}
            >
              {/* Drag handle — editing only */}
              {editing && (
                <div
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragEnd={handleDragEnd}
                  className="absolute -left-5 top-0.5 hidden cursor-grab items-center text-muted-foreground group-hover/event:flex"
                  style={{ fontSize: "0.9rem", userSelect: "none", lineHeight: 1 }}
                  title="Drag to reorder"
                >
                  ⠿
                </div>
              )}

              {/* Delete — editing only */}
              {editing && (
                <button
                  type="button"
                  onClick={() => deleteEvent(event.id)}
                  className="absolute right-0 top-0 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/event:flex"
                  title="Delete event"
                >
                  ✕
                </button>
              )}

              {/* Drop indicator */}
              {dropIndex === i && dragIndex !== i && (
                <div style={{
                  position: "absolute", left: 0, right: 0, top: -8,
                  height: "2px", background: "var(--accent, #B8921A)", borderRadius: "1px",
                }} />
              )}

              {/* Time column */}
              <div className="timeline-time" style={{
                width: "4.5rem", flexShrink: 0, textAlign: "right",
                fontSize: "0.8rem", color: "var(--accent, #B8921A)", fontWeight: 600,
                paddingTop: "0.2rem",
              }}>
                {editing ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); handleOpenPopover("time", event.id, rect); }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--accent, #B8921A)", fontWeight: 600, fontSize: "0.8rem" }}
                    className="hover:opacity-70"
                  >
                    {event.time ? formatTime(event.time) : <span style={{ opacity: 0.4, fontStyle: "italic", fontSize: "0.7rem" }}>+ Time</span>}
                  </button>
                ) : (
                  formatTime(event.time)
                )}
              </div>

              {/* Dot */}
              <div style={{
                position: "absolute", left: "5rem", top: "0.4rem",
                width: "10px", height: "10px",
                background: "var(--accent, #B8921A)", borderRadius: "50%",
                border: "2px solid var(--bg, #fff)", zIndex: 1,
              }} aria-hidden="true" />

              {/* Content */}
              <div className="timeline-content" style={{ paddingLeft: "1.25rem", flex: 1, paddingRight: editing ? "1.5rem" : 0 }}>
                {(event.date || editing) && (
                  editing ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); handleOpenPopover("date", event.id, rect); }}
                      style={{
                        background: "none", border: "none", cursor: "pointer", padding: 0,
                        margin: "0 0 0.1rem", fontSize: "0.72rem", fontWeight: 600,
                        color: "var(--accent, #B8921A)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block",
                      }}
                      className="hover:opacity-70"
                    >
                      {event.date ? formatDate(event.date) : <span style={{ opacity: 0.4, fontStyle: "italic" }}>+ Date</span>}
                    </button>
                  ) : (
                    <p style={{ margin: "0 0 0.1rem", fontSize: "0.72rem", fontWeight: 600, color: "var(--accent, #B8921A)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {formatDate(event.date)}
                    </p>
                  )
                )}

                {/* Title */}
                <p style={{ margin: "0 0 0.125rem", fontWeight: 600, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  {editing ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); handleOpenPopover("emoji", event.id, rect); }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", padding: "1px", borderRadius: "3px", lineHeight: 1 }}
                      className="hover:bg-accent/20"
                      title="Change icon"
                    >
                      {event.icon || "✨"}
                    </button>
                  ) : (
                    event.icon && <span style={{ marginRight: "0.4rem" }}>{event.icon}</span>
                  )}
                  <span
                    contentEditable={editing}
                    suppressContentEditableWarning
                    onBlur={(e) => updateEvent(event.id, { name: e.currentTarget.textContent ?? "" })}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); } e.stopPropagation(); }}
                    style={{
                      outline: "none", flex: 1,
                      borderBottom: editing ? "1px dashed var(--border)" : "none",
                      cursor: editing ? "text" : "default",
                    }}
                  >
                    {event.name || (editing ? "" : <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Event name</span>)}
                  </span>
                </p>

                {/* End time */}
                {(event.endTime || editing) && (
                  editing ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); handleOpenPopover("endTime", event.id, rect); }}
                      style={{
                        background: "none", border: "none", cursor: "pointer", padding: 0,
                        fontSize: "0.78rem", color: "var(--accent, #B8921A)", display: "block",
                      }}
                      className="hover:opacity-70"
                    >
                      {event.endTime ? `Until ${formatTime(event.endTime)}` : <span style={{ opacity: 0.35, fontStyle: "italic", fontSize: "0.72rem" }}>+ End time</span>}
                    </button>
                  ) : (
                    event.endTime && (
                      <p style={{ margin: "0 0 0.1rem", fontSize: "0.78rem", color: "var(--accent, #B8921A)" }}>
                        Until {formatTime(event.endTime)}
                      </p>
                    )
                  )
                )}

                {/* Description */}
                {(event.description || editing) && (
                  <p style={{ margin: "0.125rem 0 0", fontSize: "0.82rem", color: "var(--body-color)", lineHeight: 1.55, minHeight: "1.3em" }}>
                    <span
                      contentEditable={editing}
                      suppressContentEditableWarning
                      onBlur={(e) => updateEvent(event.id, { description: e.currentTarget.textContent ?? "" })}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); } e.stopPropagation(); }}
                      style={{
                        outline: "none", whiteSpace: "pre-wrap",
                        borderBottom: editing ? "1px dashed var(--border)" : "none",
                        cursor: editing ? "text" : "default",
                      }}
                    >
                      {event.description || (editing ? <span style={{ color: "var(--muted)", opacity: 0.5, fontStyle: "italic" }}>+ Description</span> : null)}
                    </span>
                  </p>
                )}

                {/* Dress code */}
                {(event.dressCode || editing) && (
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
                    <span
                      contentEditable={editing}
                      suppressContentEditableWarning
                      onBlur={(e) => updateEvent(event.id, { dressCode: e.currentTarget.textContent ?? "" })}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); } e.stopPropagation(); }}
                      style={{
                        outline: "none",
                        borderBottom: editing ? "1px dashed var(--border)" : "none",
                        cursor: editing ? "text" : "default",
                      }}
                    >
                      {event.dressCode
                        ? `Dress code: ${event.dressCode}`
                        : editing
                        ? <span style={{ opacity: 0.4, fontStyle: "italic" }}>+ Dress code</span>
                        : null}
                    </span>
                  </p>
                )}

                {/* Maps URL */}
                {editing ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); handleOpenPopover("mapsUrl", event.id, rect); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer", padding: 0,
                      fontSize: "0.75rem", display: "block", marginTop: "0.2rem",
                      color: event.mapsUrl ? "var(--accent, #B8921A)" : "var(--muted)",
                      textDecoration: event.mapsUrl ? "underline" : "none",
                    }}
                    className="hover:opacity-70"
                  >
                    {event.mapsUrl ? "Edit location link" : <span style={{ fontStyle: "italic", opacity: 0.5 }}>+ Add location</span>}
                  </button>
                ) : (
                  event.mapsUrl && (
                    <p style={{ margin: "0.125rem 0 0", fontSize: "0.82rem", color: "var(--body-color)" }}>
                      <a
                        href={event.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "inherit", textDecoration: "underline" }}
                      >
                        {event.location || "View on map"}
                      </a>
                    </p>
                  )
                )}
              </div>
            </div>
          ))}

          {/* Add event button at end of timeline */}
          {editing && (
            <div style={{ marginLeft: "5.75rem", marginTop: "0.5rem" }}>
              <AddEventButton onClick={addEvent} />
            </div>
          )}
        </div>
      )}

      {/* ── Popovers ── */}
      {popover && activeEvent && popover.type === "emoji" && (
        <EmojiPicker
          anchorRect={popover.rect}
          onSelect={(emoji) => { updateEvent(popover.eventId, { icon: emoji }); handleClosePopover(); }}
          onClose={handleClosePopover}
        />
      )}
      {popover && activeEvent && popover.type === "date" && (
        <DatePickerPopover
          anchorRect={popover.rect}
          value={activeEvent.date ?? ""}
          onSave={(val) => updateEvent(popover.eventId, { date: val })}
          onClose={handleClosePopover}
        />
      )}
      {popover && activeEvent && popover.type === "time" && (
        <TimePickerPopover
          anchorRect={popover.rect}
          value={activeEvent.time ?? ""}
          label="Start Time"
          onSave={(val) => updateEvent(popover.eventId, { time: val })}
          onClose={handleClosePopover}
        />
      )}
      {popover && activeEvent && popover.type === "endTime" && (
        <TimePickerPopover
          anchorRect={popover.rect}
          value={activeEvent.endTime ?? ""}
          label="End Time"
          onSave={(val) => updateEvent(popover.eventId, { endTime: val })}
          onClose={handleClosePopover}
        />
      )}
      {popover && activeEvent && popover.type === "mapsUrl" && (
        <MapsPopover
          anchorRect={popover.rect}
          value={activeEvent.mapsUrl ?? ""}
          onSave={(val) => updateEvent(popover.eventId, { mapsUrl: val })}
          onClose={handleClosePopover}
        />
      )}
    </section>
  );
}
