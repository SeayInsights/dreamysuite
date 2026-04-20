"use client";

import { PanelTextInput } from "../PanelInputs";

interface FunFactItem {
  id: string;
  icon?: string;
  title?: string;
  body?: string;
}

type DisplayMode = "card" | "bordered" | "flat" | "numbered";

interface FunFactsConfig {
  heading: string;
  columns: "auto" | "2" | "3";
  cardStyle: DisplayMode;
  items: FunFactItem[];
}

function normalizeFunFactsConfig(cfg: Record<string, unknown>): FunFactsConfig {
  const style = cfg.cardStyle as string;
  return {
    heading: typeof cfg.heading === "string" ? cfg.heading : "Fun Facts",
    columns: cfg.columns === "2" ? "2" : cfg.columns === "3" ? "3" : "auto",
    cardStyle:
      style === "bordered" ? "bordered"
      : style === "flat" ? "flat"
      : style === "numbered" ? "numbered"
      : "card",
    items: Array.isArray(cfg.items)
      ? (cfg.items as FunFactItem[]).filter(
          (i) => i && typeof i === "object" && typeof i.id === "string",
        )
      : [],
  };
}

const DISPLAY_MODES: Array<{ value: DisplayMode; label: string }> = [
  { value: "card", label: "Card" },
  { value: "bordered", label: "Bordered" },
  { value: "flat", label: "Flat" },
  { value: "numbered", label: "Numbered" },
];

export function FunFactsEditor({
  cfg,
  updateConfig,
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
}) {
  const facts = normalizeFunFactsConfig(cfg);

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
        onChange={(v) => updateConfig({ heading: v })}
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
              onClick={() => updateConfig({ columns: col })}
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

      {/* Display mode toggle */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Display Mode
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {DISPLAY_MODES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateConfig({ cardStyle: value })}
              className={`rounded-md border py-1 text-xs transition-colors ${
                facts.cardStyle === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {label}
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
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-[11px] text-foreground/70">
                {item.title || item.body
                  ? (item.title ?? item.body ?? "").slice(0, 40)
                  : <span className="italic text-muted-foreground">Fact #{index + 1}</span>}
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
