"use client";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// TextBlockEditor — inspector controls for multi-text blocks (E010)
//
// Writes the same config keys that TextEditor/applyStyleKeyToCfg produces:
//   {field}FontFamily, {field}Size, {field}Color, {field}Align, {field}Bold,
//   {field}Italic, {field}Underline
// ---------------------------------------------------------------------------

const FONT_OPTIONS = [
  { label: "Default", value: "" },
  { label: "System Sans", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "System Serif", value: "ui-serif, Georgia, serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Playfair", value: "'Playfair Display', Georgia, serif" },
  { label: "Cormorant", value: "'Cormorant Garamond', Georgia, serif" },
  { label: "Lora", value: "'Lora', Georgia, serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Great Vibes", value: "'Great Vibes', cursive" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
];

const ALIGN_OPTIONS = [
  { label: "L", value: "left", title: "Align left" },
  { label: "C", value: "center", title: "Align center" },
  { label: "R", value: "right", title: "Align right" },
];

interface FieldControlsProps {
  label: string;
  field: string;
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
}

function FieldControls({ label, field, cfg, updateConfig }: FieldControlsProps) {
  const fontFamily = String(cfg[field + "FontFamily"] ?? "");
  const fontSize = String(cfg[field + "Size"] ?? "");
  const color = String(cfg[field + "Color"] ?? "");
  const align = String(cfg[field + "Align"] ?? "left");
  const bold = Boolean(cfg[field + "Bold"]);
  const italic = Boolean(cfg[field + "Italic"]);
  const underline = Boolean(cfg[field + "Underline"]);

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>

      {/* Font family */}
      <select
        aria-label={`${label} font family`}
        value={fontFamily}
        onChange={(e) => updateConfig({ [field + "FontFamily"]: e.target.value || undefined })}
        className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>

      {/* Size + color row */}
      <div className="flex gap-2">
        <input
          type="number"
          aria-label={`${label} font size`}
          min={8}
          max={200}
          placeholder="Size"
          value={fontSize ? parseInt(fontSize) : ""}
          onChange={(e) => {
            const v = e.target.value;
            updateConfig({ [field + "Size"]: v ? v + "px" : undefined });
          }}
          className="w-16 rounded border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield]"
        />
        <div className="flex items-center gap-1">
          <label className="text-xs text-muted-foreground">Color</label>
          <input
            type="color"
            aria-label={`${label} text color`}
            value={color || "#000000"}
            onChange={(e) => updateConfig({ [field + "Color"]: e.target.value })}
            className="h-7 w-9 cursor-pointer rounded border border-border bg-background p-0.5"
          />
        </div>
      </div>

      {/* Alignment + B/I/U row */}
      <div className="flex gap-1">
        {ALIGN_OPTIONS.map((a) => (
          <button
            key={a.value}
            type="button"
            title={a.title}
            onClick={() => updateConfig({ [field + "Align"]: a.value })}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded text-xs transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              align === a.value && "bg-accent text-accent-foreground",
            )}
          >
            {a.label}
          </button>
        ))}
        <div className="mx-0.5 h-5 w-px self-center bg-border" />
        <button
          type="button"
          title="Bold"
          onClick={() => updateConfig({ [field + "Bold"]: !bold })}
          className={cn("flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition-colors hover:bg-accent", bold && "bg-accent text-accent-foreground")}
        >B</button>
        <button
          type="button"
          title="Italic"
          onClick={() => updateConfig({ [field + "Italic"]: !italic })}
          className={cn("flex h-7 w-7 items-center justify-center rounded text-xs italic transition-colors hover:bg-accent", italic && "bg-accent text-accent-foreground")}
        >I</button>
        <button
          type="button"
          title="Underline"
          onClick={() => updateConfig({ [field + "Underline"]: !underline })}
          className={cn("flex h-7 w-7 items-center justify-center rounded text-xs underline transition-colors hover:bg-accent", underline && "bg-accent text-accent-foreground")}
        >U</button>
      </div>
    </div>
  );
}

interface TextBlockEditorProps {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
}

export function TextBlockEditor({ cfg, updateConfig }: TextBlockEditorProps) {
  return (
    <div className="space-y-5 p-4">
      <FieldControls label="Heading" field="heading" cfg={cfg} updateConfig={updateConfig} />
      <div className="h-px bg-border" />
      <FieldControls label="Body" field="body" cfg={cfg} updateConfig={updateConfig} />
    </div>
  );
}
