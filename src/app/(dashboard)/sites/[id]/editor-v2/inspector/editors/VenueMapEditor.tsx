"use client";

import { PanelTextInput, PanelDateInput } from "../PanelInputs";

export function VenueMapEditor({
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
  const heading = typeof cfg.heading === "string" ? cfg.heading : "";
  const dateStart = typeof cfg.dateStart === "string" ? cfg.dateStart : "";
  const dateEnd = typeof cfg.dateEnd === "string" ? cfg.dateEnd : "";

  return (
    <div className="space-y-4 p-4">
      <PanelTextInput
        label="Heading"
        value={heading}
        onChange={(v) => updateConfig({ heading: v })}
        placeholder="Venue"
      />

      <div className="grid grid-cols-2 gap-2">
        <PanelDateInput
          label="Start Date"
          value={dateStart}
          onChange={(v) => updateConfig({ dateStart: v })}
        />
        <PanelDateInput
          label="End Date"
          value={dateEnd}
          onChange={(v) => updateConfig({ dateEnd: v })}
        />
      </div>

      <p className="text-[10px] text-muted-foreground italic">
        Venue location and hotels are configured in Page Settings &rarr; Info.
      </p>
    </div>
  );
}
