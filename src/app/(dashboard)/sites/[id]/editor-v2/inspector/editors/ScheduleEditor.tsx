"use client";

import { FormInput } from "../FormInput";
import type { Block } from "@/app/stores/editorStore";

type DisplayMode = "timeline" | "cards";

interface ScheduleConfig {
  heading: string;
  displayMode: DisplayMode;
}

function normalizeScheduleConfig(cfg: Record<string, unknown>): ScheduleConfig {
  return {
    heading: typeof cfg.heading === "string" ? cfg.heading : "The Day",
    displayMode: cfg.displayMode === "cards" ? "cards" : "timeline",
  };
}

export function ScheduleEditor({
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
  const schedule = normalizeScheduleConfig(cfg);

  return (
    <div className="space-y-6 p-4">
      <FormInput
        mode="block"
        type="text"
        label="Heading"
        value={schedule.heading}
        onChange={(v) => updateConfig({ heading: v })}
        placeholder="The Day"
        block={block}
        breakpoint={breakpoint}
        propertyName="heading"
        updateBlock={updateBlock}
        helpText="Section heading (supports cascading across breakpoints)"
      />

      {/* Display mode toggle */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Display Mode
        </label>
        <div className="flex gap-2">
          {(["timeline", "cards"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => updateConfig({ displayMode: mode })}
              className={`flex-1 rounded-lg border py-2 text-sm capitalize transition-colors ${
                schedule.displayMode === mode
                  ? "border-primary bg-primary text-primary-foreground font-medium"
                  : "border-border text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Choose how events are displayed: timeline (vertical flow) or cards (grid layout)
        </p>
      </div>

      <p className="text-xs text-muted-foreground italic leading-relaxed">
        Add and edit individual events directly on the block in the editor canvas.
      </p>
    </div>
  );
}
