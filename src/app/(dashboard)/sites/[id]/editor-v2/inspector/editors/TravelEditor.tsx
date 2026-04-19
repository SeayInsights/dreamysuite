"use client";

import { PanelTextInput, PanelTextArea } from "../PanelInputs";

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

const TRAVEL_TYPE_OPTIONS: Array<{ value: TravelItem["type"]; label: string }> = [
  { value: "airport", label: "Airport" },
  { value: "hotel", label: "Hotel" },
  { value: "shuttle", label: "Shuttle" },
  { value: "parking", label: "Parking" },
  { value: "note", label: "Note" },
  { value: "custom", label: "Custom" },
];

// ---------------------------------------------------------------------------
// Travel editor
// ---------------------------------------------------------------------------

export function TravelEditor({
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
            No items yet. Click &quot;Add Item&quot; to get started.
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
