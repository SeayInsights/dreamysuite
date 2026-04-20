"use client";

import { PanelTextInput, PanelDateInput, PanelTimeInput } from "../PanelInputs";

interface ScheduleEvent {
  id: string;
  name: string;
  date?: string;
  time?: string;
  endTime?: string;
  location?: string;
  description?: string;
  dressCode?: string;
  icon?: string;
  mapsUrl?: string;
}

type DisplayMode = "timeline" | "cards";

interface ScheduleConfig {
  heading: string;
  displayMode: DisplayMode;
  events: ScheduleEvent[];
}

function normalizeScheduleConfig(cfg: Record<string, unknown>): ScheduleConfig {
  return {
    heading: typeof cfg.heading === "string" ? cfg.heading : "The Day",
    displayMode: cfg.displayMode === "cards" ? "cards" : "timeline",
    events: Array.isArray(cfg.events)
      ? (cfg.events as ScheduleEvent[]).filter(
          (e) => e && typeof e === "object" && typeof e.id === "string",
        )
      : [],
  };
}

export function ScheduleEditor({
  cfg,
  updateConfig,
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
}) {
  const schedule = normalizeScheduleConfig(cfg);

  function addEvent() {
    const newEvent: ScheduleEvent = { id: crypto.randomUUID(), name: "" };
    updateConfig({ events: [...schedule.events, newEvent] });
  }

  function deleteEvent(id: string) {
    updateConfig({ events: schedule.events.filter((e) => e.id !== id) });
  }

  function moveEvent(index: number, direction: "up" | "down") {
    const events = [...schedule.events];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= events.length) return;
    [events[index], events[targetIndex]] = [events[targetIndex], events[index]];
    updateConfig({ events });
  }

  function updateEvent(id: string, patch: Partial<ScheduleEvent>) {
    updateConfig({
      events: schedule.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  }

  return (
    <div className="space-y-4 p-4">
      <PanelTextInput
        label="Heading"
        value={schedule.heading}
        onChange={(v) => updateConfig({ heading: v })}
        placeholder="The Day"
      />

      {/* Display mode toggle */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Display Mode
        </label>
        <div className="flex gap-1.5">
          {(["timeline", "cards"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => updateConfig({ displayMode: mode })}
              className={`flex-1 rounded-md border py-1 text-xs capitalize transition-colors ${
                schedule.displayMode === mode
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Events ({schedule.events.length})
        </p>

        {schedule.events.length === 0 && (
          <p className="rounded border border-dashed border-border px-3 py-4 text-center text-[10px] text-muted-foreground italic">
            No events yet. Click &quot;Add Event&quot; to get started.
          </p>
        )}

        {schedule.events.map((event, index) => (
          <div
            key={event.id}
            className="rounded-md border border-border bg-background/60 p-3 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-[11px] text-foreground/70">
                {event.name
                  ? event.name.slice(0, 40)
                  : <span className="italic text-muted-foreground">Event #{index + 1}</span>}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveEvent(index, "up")}
                  title="Move up"
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={index === schedule.events.length - 1}
                  onClick={() => moveEvent(index, "down")}
                  title="Move down"
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => deleteEvent(event.id)}
                  title="Delete event"
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <PanelDateInput
                label="Date"
                value={event.date ?? ""}
                onChange={(v) => updateEvent(event.id, { date: v })}
              />
              <PanelTimeInput
                label="Time"
                value={event.time ?? ""}
                onChange={(v) => updateEvent(event.id, { time: v })}
              />
            </div>

            <PanelTimeInput
              label="End Time"
              value={event.endTime ?? ""}
              onChange={(v) => updateEvent(event.id, { endTime: v })}
            />

            <PanelTextInput
              label="Icon"
              value={event.icon ?? ""}
              onChange={(v) => updateEvent(event.id, { icon: v })}
              placeholder="emoji"
            />

            <PanelTextInput
              label="Dress Code"
              value={event.dressCode ?? ""}
              onChange={(v) => updateEvent(event.id, { dressCode: v })}
              placeholder="e.g. Black Tie Optional"
            />

            <PanelTextInput
              label="Maps URL"
              value={event.mapsUrl ?? ""}
              onChange={(v) => updateEvent(event.id, { mapsUrl: v })}
              placeholder="https://maps.google.com/..."
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEvent}
        className="w-full rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        + Add Event
      </button>
    </div>
  );
}
