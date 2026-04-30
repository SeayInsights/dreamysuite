"use client";

import { useState, useCallback } from "react";
import {
  blockSectionStyle,
  editableProps,
  parseCfg,
} from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";
import { useEditorStore } from "@/app/stores/editorStore";
import {
  ScheduleEvent,
  Block,
  PopoverType,
  PopoverState,
} from "./ScheduleTypes";
import {
  EmojiPicker,
  DatePickerPopover,
  TimePickerPopover,
  MapsPopover,
  AddEventButton,
} from "./SchedulePopovers";
import { EventCard } from "./ScheduleEventCard";
import { ScheduleTimeline } from "./ScheduleTimeline";

export function ScheduleBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as
    | "desktop"
    | "tablet"
    | "mobile";
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Schedule of Events");
  const displayMode = String(cfg.displayMode ?? "timeline");
  const events: ScheduleEvent[] = Array.isArray(cfg.events)
    ? (cfg.events as ScheduleEvent[]).filter(
        (e) => e && typeof e === "object" && typeof e.id === "string",
      )
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
    const currentEvents = Array.isArray(currentCfg.events)
      ? (currentCfg.events as ScheduleEvent[])
      : [];
    const newEvent: ScheduleEvent = {
      id: crypto.randomUUID(),
      name: "",
      icon: "🎉",
    };
    updateBlock(block.id, {
      config: { ...currentCfg, events: [...currentEvents, newEvent] },
    });
  }, [block.id, block.config, updateBlock]);

  const deleteEvent = useCallback(
    (id: string) => {
      const currentCfg = parseCfg(block.config);
      const currentEvents = Array.isArray(currentCfg.events)
        ? (currentCfg.events as ScheduleEvent[])
        : [];
      updateBlock(block.id, {
        config: {
          ...currentCfg,
          events: currentEvents.filter((e) => e.id !== id),
        },
      });
    },
    [block.id, block.config, updateBlock],
  );

  const updateEvent = useCallback(
    (id: string, patch: Partial<ScheduleEvent>) => {
      const currentCfg = parseCfg(block.config);
      const currentEvents = Array.isArray(currentCfg.events)
        ? (currentCfg.events as ScheduleEvent[])
        : [];
      updateBlock(block.id, {
        config: {
          ...currentCfg,
          events: currentEvents.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        },
      });
    },
    [block.id, block.config, updateBlock],
  );

  // ── Drag-and-drop ───────────────────────────────────────────────────────────
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((_e: React.DragEvent, index: number) => {
    setDropIndex(index);
  }, []);

  const handleDrop = useCallback(
    (index: number) => {
      if (dragIndex === null || dragIndex === index) {
        setDragIndex(null);
        setDropIndex(null);
        return;
      }
      const currentCfg = parseCfg(block.config);
      const currentEvents = Array.isArray(currentCfg.events)
        ? [...(currentCfg.events as ScheduleEvent[])]
        : [];
      const [moved] = currentEvents.splice(dragIndex, 1);
      currentEvents.splice(index, 0, moved);
      updateBlock(block.id, {
        config: { ...currentCfg, events: currentEvents },
      });
      setDragIndex(null);
      setDropIndex(null);
    },
    [dragIndex, block.id, block.config, updateBlock],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDropIndex(null);
  }, []);

  // ── Popover open/close ──────────────────────────────────────────────────────
  const handleOpenPopover = useCallback(
    (type: PopoverType, eventId: string, rect: DOMRect) => {
      setPopover({ type, eventId, rect });
    },
    [],
  );

  const handleClosePopover = useCallback(() => setPopover(null), []);

  // Find event for active popover
  const activeEvent = popover
    ? events.find((e) => e.id === popover.eventId)
    : null;

  // ── Shared drag/event props ─────────────────────────────────────────────────
  const dragProps = {
    dragIndex,
    dropIndex,
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    onDragEnd: handleDragEnd,
    onOpenPopover: handleOpenPopover,
  };

  return (
    <section
      className="block block-schedule"
      data-block-id={block.id}
      data-block-type={block.type}
      style={{ padding: "3rem 1.5rem", ...blockSectionStyle(cfg, breakpoint) }}
    >
      <TextEffectWrapper
        as="h2"
        className="section-heading"
        {...editableProps(cfg, "heading")}
      >
        {heading || (
          <span style={{ opacity: 0.4, fontStyle: "italic" }}>Add heading</span>
        )}
      </TextEffectWrapper>
      <div className="section-rule" aria-hidden="true" />

      {/* ── Empty state ── */}
      {events.length === 0 && !editing && (
        <p
          style={{
            color: "var(--site-muted)",
            fontStyle: "italic",
            textAlign: "center",
            marginTop: "1.5rem",
          }}
        >
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1.25rem",
            maxWidth: "900px",
            margin: "2rem auto 0",
          }}
        >
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
              {...dragProps}
            />
          ))}
          {editing && <AddEventButton onClick={addEvent} />}
        </div>
      )}

      {/* ── Timeline mode ── */}
      {events.length > 0 && displayMode !== "cards" && (
        <ScheduleTimeline
          events={events}
          editing={editing}
          onAddEvent={addEvent}
          onDeleteEvent={deleteEvent}
          onUpdateEvent={updateEvent}
          {...dragProps}
        />
      )}

      {/* ── Popovers ── */}
      {popover && activeEvent && popover.type === "emoji" && (
        <EmojiPicker
          anchorRect={popover.rect}
          onSelect={(emoji) => {
            updateEvent(popover.eventId, { icon: emoji });
            handleClosePopover();
          }}
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
