"use client";

import { PanelTextInput, PanelTextArea } from "../PanelInputs";

type DisplayMode = "grid" | "list";

interface RegistryCfg {
  heading: string;
  subheading: string;
  displayMode: DisplayMode;
}

function normalize(cfg: Record<string, unknown>): RegistryCfg {
  return {
    heading: typeof cfg.heading === "string" ? cfg.heading : "Registry",
    subheading: typeof cfg.subheading === "string" ? cfg.subheading : "",
    displayMode: cfg.displayMode === "list" ? "list" : "grid",
  };
}

export function RegistryEditor({
  cfg,
  updateConfig,
  block,
  breakpoint,
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
  block?: unknown;
  breakpoint?: unknown;
}) {
  const reg = normalize(cfg);

  return (
    <div className="space-y-4 p-4">
      <PanelTextInput
        label="Heading"
        value={reg.heading}
        onChange={(v) => updateConfig({ heading: v })}
        placeholder="Registry"
      />

      <PanelTextArea
        label="Subheading"
        value={reg.subheading}
        onChange={(v) => updateConfig({ subheading: v })}
        placeholder="Your presence is the greatest gift..."
      />

      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Display Mode
        </label>
        <div className="flex gap-1.5">
          {(["grid", "list"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => updateConfig({ displayMode: mode })}
              className={`flex-1 rounded-md border py-1 text-xs capitalize transition-colors ${
                reg.displayMode === mode
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground italic">
        Add registries and funds directly on the block.
      </p>
    </div>
  );
}
