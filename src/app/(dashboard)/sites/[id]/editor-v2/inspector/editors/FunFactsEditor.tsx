"use client";

import { PanelTextInput } from "../PanelInputs";

type DisplayMode = "card" | "bordered" | "flat" | "numbered";

interface FunFactItem {
  id: string;
  question?: string;
  icon?: string;
  title?: string;
  body?: string;
}

interface FunFactsConfig {
  heading: string;
  columns: "auto" | "2" | "3" | "4";
  cardStyle: DisplayMode;
  items: FunFactItem[];
}

export function normalizeFunFactsConfig(cfg: Record<string, unknown>): FunFactsConfig {
  const style = cfg.cardStyle as string;
  const cols = cfg.columns as string;
  return {
    heading: typeof cfg.heading === "string" ? cfg.heading : "Fun Facts",
    columns:
      cols === "2" ? "2"
      : cols === "3" ? "3"
      : cols === "4" ? "4"
      : "auto",
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
          {(["auto", "2", "3", "4"] as const).map((col) => (
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
    </div>
  );
}
