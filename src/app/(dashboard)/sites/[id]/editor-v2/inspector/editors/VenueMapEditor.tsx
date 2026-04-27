"use client";

import { PanelTextInput, PanelDateInput } from "../PanelInputs";
import type { Block } from "@/app/stores/editorStore";

export function VenueMapEditor({
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
        block={block}
        breakpoint={breakpoint}
        propertyName="heading"
        updateBlock={updateBlock}
      />

      <div className="grid grid-cols-2 gap-2">
        <PanelDateInput
          label="Start Date"
          value={dateStart}
          onChange={(v) => updateConfig({ dateStart: v })}
          block={block}
          breakpoint={breakpoint}
          propertyName="dateStart"
          updateBlock={updateBlock}
        />
        <PanelDateInput
          label="End Date"
          value={dateEnd}
          onChange={(v) => updateConfig({ dateEnd: v })}
          block={block}
          breakpoint={breakpoint}
          propertyName="dateEnd"
          updateBlock={updateBlock}
        />
      </div>

      <p className="text-[10px] text-muted-foreground italic">
        Venue location and hotels are configured in Page Settings &rarr; Info.
      </p>
    </div>
  );
}
