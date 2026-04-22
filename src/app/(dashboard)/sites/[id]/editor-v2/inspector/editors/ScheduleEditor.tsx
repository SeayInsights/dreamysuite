"use client";

import { PanelTextInput } from "../PanelInputs";

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
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
}) {
  const schedule = normalizeScheduleConfig(cfg);

  return (
    <div className="space-y-4 p-4">
      <PanelTextInput
        label="Heading"
        value={schedule.heading}
        onChange={(v) => updateConfig({ heading: v })}
        placeholder="The Day"
      />

      {/* Display mode toggle */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Display Mode
        </label>
        <div className="flex gap-1.5">
          {(["timeline", "cards"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => updateConfig({ displayMode: mode })}
              className={`flex-1 rounded-md border py-1 text-xs capitalize transition-colors ${
                schedule.displayMode === mode
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
        Add and edit events directly on the block.
      </p>
    </div>
  );
}
