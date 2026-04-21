"use client";

import { PanelTextInput } from "../PanelInputs";

type DisplayMode = "facts" | "faq" | "travel" | "general" | "accordion" | "list";
type CardStyle = "card" | "bordered" | "flat" | "numbered";

interface ContentCardItem {
  id: string;
  question?: string;
  body?: string;
  icon?: string;
  links?: Array<{ label: string; url: string }>;
}

interface ContentCardConfig {
  heading: string;
  displayMode: DisplayMode;
  columns: "auto" | "2" | "3" | "4";
  cardStyle: CardStyle;
  items: ContentCardItem[];
}

export function normalizeContentCardConfig(cfg: Record<string, unknown>): ContentCardConfig {
  const dm = cfg.displayMode as string;
  const style = cfg.cardStyle as string;
  const cols = cfg.columns as string;
  return {
    heading: typeof cfg.heading === "string" ? cfg.heading : "",
    displayMode:
      dm === "faq" ? "faq"
      : dm === "travel" ? "travel"
      : dm === "general" ? "general"
      : dm === "accordion" ? "accordion"
      : dm === "list" ? "list"
      : "facts",
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
      ? (cfg.items as ContentCardItem[]).filter(
          (i) => i && typeof i === "object" && typeof i.id === "string",
        )
      : [],
  };
}

const DISPLAY_MODES: Array<{ value: DisplayMode; label: string }> = [
  { value: "facts", label: "Card" },
  { value: "general", label: "General" },
  { value: "accordion", label: "Accordion" },
  { value: "list", label: "List" },
  { value: "faq", label: "FAQ" },
  { value: "travel", label: "Travel" },
];

export function ContentCardEditor({
  cfg,
  updateConfig,
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
}) {
  const card = normalizeContentCardConfig(cfg);

  return (
    <div className="space-y-4 p-4">
      <PanelTextInput
        label="Heading"
        value={card.heading}
        onChange={(v) => updateConfig({ heading: v })}
        placeholder="Section Heading"
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
                card.columns === col
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {col === "auto" ? "Auto" : col}
            </button>
          ))}
        </div>
      </div>

      {/* Display Mode toggle */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Display Mode
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {DISPLAY_MODES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateConfig({ displayMode: value })}
              className={`rounded-md border py-1 text-xs transition-colors ${
                card.displayMode === value
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
