"use client";

import { useState, useEffect } from "react";
import { parseCfg } from "@/lib/editableField";
import type { Block } from "@/app/stores/editorStore";

// ---------------------------------------------------------------------------
// Shared primitive inputs (scoped to this panel, no external deps needed)
// ---------------------------------------------------------------------------

function PanelTextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit() {
    onChange(draft);
  }

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        type="text"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          e.stopPropagation();
        }}
        className="h-8 w-full rounded border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

function PanelTextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit() {
    onChange(draft);
  }

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <textarea
        value={draft}
        placeholder={placeholder}
        rows={3}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.stopPropagation()}
        className="w-full resize-none rounded border border-input bg-background px-2.5 py-2 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared inline date/time input
// ---------------------------------------------------------------------------

function PanelDateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        className="h-8 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

function PanelTimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        className="h-8 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// FAQ data types
// ---------------------------------------------------------------------------

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface FaqConfig {
  heading: string;
  displayMode: "accordion" | "list";
  items: FaqItem[];
}

function normalizeFaqConfig(cfg: Record<string, unknown>): FaqConfig {
  return {
    heading: typeof cfg.heading === "string" ? cfg.heading : "Questions & Answers",
    displayMode: cfg.displayMode === "list" ? "list" : "accordion",
    items: Array.isArray(cfg.items)
      ? (cfg.items as FaqItem[]).filter(
          (item) => item && typeof item === "object" && typeof item.id === "string",
        )
      : [],
  };
}

// ---------------------------------------------------------------------------
// FAQ suggestion bank
// ---------------------------------------------------------------------------

const FAQ_BANK = [
  {
    category: "Attire & Venue",
    items: [
      { question: "What should I wear? Is there a dress code?", answer: "" },
      { question: "Will the ceremony and reception be indoors or outdoors?", answer: "" },
      { question: "What will the weather be like this time of year?", answer: "" },
    ],
  },
  {
    category: "Logistics",
    items: [
      { question: "What time should I arrive?", answer: "" },
      { question: "Where should guests park? Is parking free?", answer: "" },
      { question: "How do I get to the wedding venue?", answer: "" },
      { question: "Will transportation be provided between the hotel and venue?", answer: "" },
    ],
  },
  {
    category: "Guest Policy",
    items: [
      { question: "Are children welcome?", answer: "" },
      { question: "Can I bring a plus one?", answer: "" },
      { question: "When is the RSVP deadline?", answer: "" },
    ],
  },
  {
    category: "Food & Drink",
    items: [
      { question: "Will dinner be served at the reception?", answer: "" },
      { question: "Will there be vegan, vegetarian, or gluten-free options?", answer: "" },
      { question: "Will there be food and drinks during cocktail hour?", answer: "" },
    ],
  },
  {
    category: "Gifts",
    items: [
      { question: "Where are you registered?", answer: "" },
      { question: "Should I bring a gift to the wedding?", answer: "" },
    ],
  },
  {
    category: "Accommodations",
    items: [
      { question: "Do you have a hotel block for guests?", answer: "" },
      { question: "Are the venue locations wheelchair accessible?", answer: "" },
      { question: "Do you have recommendations for things to do in the area?", answer: "" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Schedule data types
// ---------------------------------------------------------------------------

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
}

interface ScheduleConfig {
  heading: string;
  events: ScheduleEvent[];
}

function normalizeScheduleConfig(cfg: Record<string, unknown>): ScheduleConfig {
  return {
    heading: typeof cfg.heading === "string" ? cfg.heading : "The Day",
    events: Array.isArray(cfg.events)
      ? (cfg.events as ScheduleEvent[]).filter(
          (e) => e && typeof e === "object" && typeof e.id === "string",
        )
      : [],
  };
}

// ---------------------------------------------------------------------------
// Fun Facts data types
// ---------------------------------------------------------------------------

interface FunFactItem {
  id: string;
  icon?: string;
  title?: string;
  body?: string;
}

interface FunFactsConfig {
  heading: string;
  columns: "auto" | "2" | "3";
  cardStyle: "card" | "flat" | "bordered";
  items: FunFactItem[];
}

function normalizeFunFactsConfig(cfg: Record<string, unknown>): FunFactsConfig {
  return {
    heading: typeof cfg.heading === "string" ? cfg.heading : "Fun Facts",
    columns:
      cfg.columns === "2" ? "2" : cfg.columns === "3" ? "3" : "auto",
    cardStyle:
      cfg.cardStyle === "flat"
        ? "flat"
        : cfg.cardStyle === "bordered"
          ? "bordered"
          : "card",
    items: Array.isArray(cfg.items)
      ? (cfg.items as FunFactItem[]).filter(
          (i) => i && typeof i === "object" && typeof i.id === "string",
        )
      : [],
  };
}

// ---------------------------------------------------------------------------
// Travel data types
// ---------------------------------------------------------------------------

interface TravelItem {
  id: string;
  type?: "airport" | "hotel" | "shuttle" | "parking" | "note" | "custom";
  heading?: string;
  body?: string;
  linkLabel?: string;
  linkUrl?: string;
}

interface TravelConfig {
  heading: string;
  items: TravelItem[];
}

function normalizeTravelConfig(cfg: Record<string, unknown>): TravelConfig {
  return {
    heading: typeof cfg.heading === "string" ? cfg.heading : "Getting There",
    items: Array.isArray(cfg.items)
      ? (cfg.items as TravelItem[]).filter(
          (i) => i && typeof i === "object" && typeof i.id === "string",
        )
      : [],
  };
}

// ---------------------------------------------------------------------------
// FAQ editor
// ---------------------------------------------------------------------------

function FaqEditor({
  cfg,
  updateConfig,
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
}) {
  const faq = normalizeFaqConfig(cfg);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  function setHeading(v: string) {
    updateConfig({ heading: v });
  }

  function setDisplayMode(mode: "accordion" | "list") {
    updateConfig({ displayMode: mode });
  }

  function addItem() {
    const newItem: FaqItem = {
      id: crypto.randomUUID(),
      question: "",
      answer: "",
    };
    updateConfig({ items: [...faq.items, newItem] });
  }

  function deleteItem(id: string) {
    updateConfig({ items: faq.items.filter((item) => item.id !== id) });
  }

  function moveItem(index: number, direction: "up" | "down") {
    const items = [...faq.items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
    updateConfig({ items });
  }

  function updateItem(id: string, patch: Partial<FaqItem>) {
    updateConfig({
      items: faq.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  }

  function addFromBank(question: string) {
    const newItem: FaqItem = { id: crypto.randomUUID(), question, answer: "" };
    updateConfig({ items: [...faq.items, newItem] });
  }

  function toggleCategory(category: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  const existingQuestions = new Set(faq.items.map((i) => i.question.toLowerCase()));

  return (
    <div className="space-y-4 p-4">
      {/* Heading */}
      <PanelTextInput
        label="Heading"
        value={faq.heading}
        onChange={setHeading}
        placeholder="Questions & Answers"
      />

      {/* Display mode toggle */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Display Mode
        </label>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setDisplayMode("accordion")}
            className={`flex-1 rounded-md border py-1 text-xs transition-colors ${
              faq.displayMode === "accordion"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-accent/50"
            }`}
          >
            Accordion
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode("list")}
            className={`flex-1 rounded-md border py-1 text-xs transition-colors ${
              faq.displayMode === "list"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-accent/50"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Questions ({faq.items.length})
        </p>

        {faq.items.length === 0 && (
          <p className="rounded border border-dashed border-border px-3 py-4 text-center text-[10px] text-muted-foreground italic">
            No questions yet. Click "Add Question" to get started.
          </p>
        )}

        {faq.items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-md border border-border bg-background/60 p-3 space-y-2"
          >
            {/* Item header row */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground">
                #{index + 1}
              </span>
              <div className="flex items-center gap-1">
                {/* Up button */}
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveItem(index, "up")}
                  title="Move up"
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ▲
                </button>
                {/* Down button */}
                <button
                  type="button"
                  disabled={index === faq.items.length - 1}
                  onClick={() => moveItem(index, "down")}
                  title="Move down"
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ▼
                </button>
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  title="Delete question"
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Question input */}
            <PanelTextInput
              label="Question"
              value={item.question}
              onChange={(v) => updateItem(item.id, { question: v })}
              placeholder="e.g. What is the dress code?"
            />

            {/* Answer textarea */}
            <PanelTextArea
              label="Answer"
              value={item.answer}
              onChange={(v) => updateItem(item.id, { answer: v })}
              placeholder="Type your answer here…"
            />
          </div>
        ))}
      </div>

      {/* Suggestions */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Suggestions
        </p>
        <div className="rounded-md border border-border overflow-hidden">
          {FAQ_BANK.map((group) => {
            const isOpen = expandedCategories.has(group.category);
            return (
              <div key={group.category} className="border-b border-border last:border-b-0">
                {/* Category header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(group.category)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] font-medium text-foreground hover:bg-accent/40 transition-colors"
                >
                  <span>{group.category}</span>
                  <span className="text-[10px] text-muted-foreground">{isOpen ? "▲" : "▼"}</span>
                </button>

                {/* Suggestion rows */}
                {isOpen && (
                  <div className="bg-background/40">
                    {group.items.map((suggestion) => {
                      const isAdded = existingQuestions.has(suggestion.question.toLowerCase());
                      return (
                        <div
                          key={suggestion.question}
                          className={`flex items-center gap-2 border-t border-border/60 px-3 py-2 ${isAdded ? "opacity-40" : ""}`}
                        >
                          <span className="flex-1 text-[11px] leading-snug text-foreground">
                            {suggestion.question}
                          </span>
                          {isAdded ? (
                            <span
                              title="Already added"
                              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[11px] text-green-600"
                            >
                              ✓
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addFromBank(suggestion.question)}
                              title="Add to questions"
                              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-border text-[11px] text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                            >
                              +
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Question button */}
      <button
        type="button"
        onClick={addItem}
        className="w-full rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        + Add Question
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schedule editor
// ---------------------------------------------------------------------------

function ScheduleEditor({
  cfg,
  updateConfig,
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
}) {
  const schedule = normalizeScheduleConfig(cfg);

  function setHeading(v: string) {
    updateConfig({ heading: v });
  }

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
        onChange={setHeading}
        placeholder="The Day"
      />

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Events ({schedule.events.length})
        </p>

        {schedule.events.length === 0 && (
          <p className="rounded border border-dashed border-border px-3 py-4 text-center text-[10px] text-muted-foreground italic">
            No events yet. Click "Add Event" to get started.
          </p>
        )}

        {schedule.events.map((event, index) => (
          <div
            key={event.id}
            className="rounded-md border border-border bg-background/60 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground">
                #{index + 1}
              </span>
              <div className="flex items-center gap-1">
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

            <PanelTextInput
              label="Name"
              value={event.name}
              onChange={(v) => updateEvent(event.id, { name: v })}
              placeholder="e.g. Ceremony"
            />

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
              label="Location"
              value={event.location ?? ""}
              onChange={(v) => updateEvent(event.id, { location: v })}
              placeholder="e.g. Grand Ballroom"
            />

            <PanelTextArea
              label="Description"
              value={event.description ?? ""}
              onChange={(v) => updateEvent(event.id, { description: v })}
              placeholder="Optional details…"
            />

            <PanelTextInput
              label="Dress Code"
              value={event.dressCode ?? ""}
              onChange={(v) => updateEvent(event.id, { dressCode: v })}
              placeholder="e.g. Black Tie Optional"
            />

            <PanelTextInput
              label="Icon"
              value={event.icon ?? ""}
              onChange={(v) => updateEvent(event.id, { icon: v })}
              placeholder="emoji"
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

// ---------------------------------------------------------------------------
// Fun Facts editor
// ---------------------------------------------------------------------------

function FunFactsEditor({
  cfg,
  updateConfig,
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
}) {
  const facts = normalizeFunFactsConfig(cfg);

  function setHeading(v: string) {
    updateConfig({ heading: v });
  }

  function setColumns(v: FunFactsConfig["columns"]) {
    updateConfig({ columns: v });
  }

  function setCardStyle(v: FunFactsConfig["cardStyle"]) {
    updateConfig({ cardStyle: v });
  }

  function addItem() {
    const newItem: FunFactItem = { id: crypto.randomUUID() };
    updateConfig({ items: [...facts.items, newItem] });
  }

  function deleteItem(id: string) {
    updateConfig({ items: facts.items.filter((i) => i.id !== id) });
  }

  function moveItem(index: number, direction: "up" | "down") {
    const items = [...facts.items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
    updateConfig({ items });
  }

  function updateItem(id: string, patch: Partial<FunFactItem>) {
    updateConfig({
      items: facts.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
  }

  return (
    <div className="space-y-4 p-4">
      <PanelTextInput
        label="Heading"
        value={facts.heading}
        onChange={setHeading}
        placeholder="Fun Facts"
      />

      {/* Columns toggle */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Columns
        </label>
        <div className="flex gap-1.5">
          {(["auto", "2", "3"] as const).map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => setColumns(col)}
              className={`flex-1 rounded-md border py-1 text-xs transition-colors ${
                facts.columns === col
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {col === "auto" ? "Auto" : col}
            </button>
          ))}
        </div>
      </div>

      {/* Card style toggle */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Card Style
        </label>
        <div className="flex gap-1.5">
          {(["card", "flat", "bordered"] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => setCardStyle(style)}
              className={`flex-1 rounded-md border py-1 text-xs capitalize transition-colors ${
                facts.cardStyle === style
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Facts ({facts.items.length})
        </p>

        {facts.items.length === 0 && (
          <p className="rounded border border-dashed border-border px-3 py-4 text-center text-[10px] text-muted-foreground italic">
            No facts yet. Click "Add Fact" to get started.
          </p>
        )}

        {facts.items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-md border border-border bg-background/60 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground">
                #{index + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveItem(index, "up")}
                  title="Move up"
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={index === facts.items.length - 1}
                  onClick={() => moveItem(index, "down")}
                  title="Move down"
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  title="Delete fact"
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  ✕
                </button>
              </div>
            </div>

            <PanelTextInput
              label="Icon"
              value={item.icon ?? ""}
              onChange={(v) => updateItem(item.id, { icon: v })}
              placeholder="emoji"
            />

            <PanelTextInput
              label="Title"
              value={item.title ?? ""}
              onChange={(v) => updateItem(item.id, { title: v })}
              placeholder="e.g. First met in 2018"
            />

            <PanelTextArea
              label="Body"
              value={item.body ?? ""}
              onChange={(v) => updateItem(item.id, { body: v })}
              placeholder="Tell the story…"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="w-full rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        + Add Fact
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Travel editor
// ---------------------------------------------------------------------------

const TRAVEL_TYPE_OPTIONS: Array<{ value: TravelItem["type"]; label: string }> = [
  { value: "airport", label: "Airport" },
  { value: "hotel", label: "Hotel" },
  { value: "shuttle", label: "Shuttle" },
  { value: "parking", label: "Parking" },
  { value: "note", label: "Note" },
  { value: "custom", label: "Custom" },
];

function TravelEditor({
  cfg,
  updateConfig,
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
}) {
  const travel = normalizeTravelConfig(cfg);

  function setHeading(v: string) {
    updateConfig({ heading: v });
  }

  function addItem() {
    const newItem: TravelItem = { id: crypto.randomUUID(), type: "custom" };
    updateConfig({ items: [...travel.items, newItem] });
  }

  function deleteItem(id: string) {
    updateConfig({ items: travel.items.filter((i) => i.id !== id) });
  }

  function moveItem(index: number, direction: "up" | "down") {
    const items = [...travel.items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
    updateConfig({ items });
  }

  function updateItem(id: string, patch: Partial<TravelItem>) {
    updateConfig({
      items: travel.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
  }

  return (
    <div className="space-y-4 p-4">
      <PanelTextInput
        label="Heading"
        value={travel.heading}
        onChange={setHeading}
        placeholder="Getting There"
      />

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Items ({travel.items.length})
        </p>

        {travel.items.length === 0 && (
          <p className="rounded border border-dashed border-border px-3 py-4 text-center text-[10px] text-muted-foreground italic">
            No items yet. Click "Add Item" to get started.
          </p>
        )}

        {travel.items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-md border border-border bg-background/60 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground">
                #{index + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveItem(index, "up")}
                  title="Move up"
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={index === travel.items.length - 1}
                  onClick={() => moveItem(index, "down")}
                  title="Move down"
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  title="Delete item"
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Type select */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Type
              </label>
              <select
                value={item.type ?? "custom"}
                onChange={(e) =>
                  updateItem(item.id, {
                    type: e.target.value as TravelItem["type"],
                  })
                }
                onKeyDown={(e) => e.stopPropagation()}
                className="h-8 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {TRAVEL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <PanelTextInput
              label="Heading"
              value={item.heading ?? ""}
              onChange={(v) => updateItem(item.id, { heading: v })}
              placeholder="e.g. Nearest Airport"
            />

            <PanelTextArea
              label="Body"
              value={item.body ?? ""}
              onChange={(v) => updateItem(item.id, { body: v })}
              placeholder="Details, directions, tips…"
            />

            <PanelTextInput
              label="Link Label"
              value={item.linkLabel ?? ""}
              onChange={(v) => updateItem(item.id, { linkLabel: v })}
              placeholder="e.g. Get Directions"
            />

            <PanelTextInput
              label="Link URL"
              value={item.linkUrl ?? ""}
              onChange={(v) => updateItem(item.id, { linkUrl: v })}
              placeholder="https://…"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="w-full rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        + Add Item
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BlockContentPanel — public export, switch-dispatches to per-type editors
// ---------------------------------------------------------------------------

interface Props {
  block: Block;
  updateBlock: (id: string, updates: Partial<Block>) => void;
}

export function BlockContentPanel({ block, updateBlock }: Props) {
  const cfg = parseCfg(block.config);

  function updateConfig(patch: Record<string, unknown>) {
    updateBlock(block.id, { config: { ...cfg, ...patch } });
  }

  switch (block.type) {
    case "faq":
      return <FaqEditor cfg={cfg} updateConfig={updateConfig} />;
    case "schedule":
      return <ScheduleEditor cfg={cfg} updateConfig={updateConfig} />;
    case "fun-facts":
      return <FunFactsEditor cfg={cfg} updateConfig={updateConfig} />;
    case "travel":
      return <TravelEditor cfg={cfg} updateConfig={updateConfig} />;
    default:
      return (
        <p className="p-4 text-xs text-muted-foreground italic">
          No content editor for this block type.
        </p>
      );
  }
}
