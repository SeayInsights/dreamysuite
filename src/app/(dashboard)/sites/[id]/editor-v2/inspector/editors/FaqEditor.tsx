"use client";

import { useState } from "react";
import { PanelTextInput } from "../PanelInputs";

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

export const FAQ_BANK = [
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
// FAQ editor
// ---------------------------------------------------------------------------

export function FaqEditor({
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
            No questions yet. Click &quot;Add Question&quot; to get started.
          </p>
        )}

        {faq.items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-md border border-border bg-background/60 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-[11px] text-foreground/70">
                {item.question
                  ? item.question.slice(0, 50)
                  : <span className="italic text-muted-foreground">Question #{index + 1}</span>}
              </span>
              <div className="flex shrink-0 items-center gap-1">
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
                  disabled={index === faq.items.length - 1}
                  onClick={() => moveItem(index, "down")}
                  title="Move down"
                  className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-accent/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ▼
                </button>
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
