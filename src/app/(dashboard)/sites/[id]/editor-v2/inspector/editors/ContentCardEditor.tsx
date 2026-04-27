"use client";

type DisplayMode = "facts" | "faq" | "travel" | "general";
type CardStyle = "card" | "bordered" | "flat" | "numbered" | "accordion" | "list";

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
      : style === "accordion" ? "accordion"
      : style === "list" ? "list"
      : "card",
    items: Array.isArray(cfg.items)
      ? (cfg.items as ContentCardItem[]).filter(
          (i) => i && typeof i === "object" && typeof i.id === "string",
        )
      : [],
  };
}

const CARD_STYLES: Array<{ value: CardStyle; label: string }> = [
  { value: "card", label: "Card" },
  { value: "bordered", label: "Bordered" },
  { value: "flat", label: "Flat" },
  { value: "numbered", label: "Numbered" },
  { value: "accordion", label: "Accordion" },
  { value: "list", label: "List" },
];

export function ContentCardEditor({
  cfg,
  updateConfig,
  block,
  breakpoint,
  updateBlock,
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
  block?: unknown;
  breakpoint?: unknown;
  updateBlock?: (id: string, updates: Partial<unknown>) => void;
}) {
  const card = normalizeContentCardConfig(cfg);

  return (
    <div className="space-y-4 p-4">
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

      {/* Card Style toggle */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Card Style
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {CARD_STYLES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateConfig({ cardStyle: value })}
              className={`rounded-md border py-1 text-xs transition-colors ${
                card.cardStyle === value
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
