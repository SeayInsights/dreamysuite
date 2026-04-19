"use client";

import { PanelTextInput, PanelTextArea } from "../PanelInputs";

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
// Fun Facts editor
// ---------------------------------------------------------------------------

export function FunFactsEditor({
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
            No facts yet. Click &quot;Add Fact&quot; to get started.
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
