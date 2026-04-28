"use client";

import { FormInput } from "../FormInput";
import type { Block } from "@/app/stores/editorStore";

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
  updateBlock,
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
  block?: Block;
  breakpoint?: "desktop" | "tablet" | "mobile";
  updateBlock?: (id: string, updates: Partial<Block>) => void;
}) {
  const reg = normalize(cfg);

  return (
    <div className="space-y-6 p-4">
      <FormInput
        mode="block"
        type="text"
        label="Heading"
        value={reg.heading}
        onChange={(v) => updateConfig({ heading: v })}
        placeholder="Registry"
        block={block}
        breakpoint={breakpoint}
        propertyName="heading"
        updateBlock={updateBlock}
        helpText="Section heading (supports cascading across breakpoints)"
      />

      <FormInput
        mode="block"
        type="textarea"
        label="Subheading"
        value={reg.subheading}
        onChange={(v) => updateConfig({ subheading: v })}
        placeholder="Your presence is the greatest gift..."
        block={block}
        breakpoint={breakpoint}
        propertyName="subheading"
        updateBlock={updateBlock}
        helpText="Optional subheading or message to guests"
      />

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Display Mode
        </label>
        <div className="flex gap-2">
          {(["grid", "list"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => updateConfig({ displayMode: mode })}
              className={`flex-1 rounded-lg border py-2 text-sm capitalize transition-colors ${
                reg.displayMode === mode
                  ? "border-primary bg-primary text-primary-foreground font-medium"
                  : "border-border text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Choose layout: grid (cards in columns) or list (vertical stack)
        </p>
      </div>

      <p className="text-xs text-muted-foreground italic leading-relaxed">
        Add individual registries and funds directly on the block in the editor canvas.
      </p>
    </div>
  );
}
