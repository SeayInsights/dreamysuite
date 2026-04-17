"use client";

import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { EFFECT_PRESETS, getPresetsForEventType } from "@/lib/effects/presets";
import type { EventType, EffectPreset, Mood } from "@/lib/effects/types";

interface Props {
  eventType?: EventType | null;
  activePresetId: string | null;
  onApply: (effects: EffectPreset["effects"], presetId: string) => void;
  onClear: () => void;
}

const MOOD_COLORS: Record<Mood, string> = {
  romantic: "bg-rose-100 text-rose-700",
  elegant: "bg-amber-100 text-amber-700",
  modern: "bg-slate-100 text-slate-700",
  playful: "bg-violet-100 text-violet-700",
  dramatic: "bg-red-100 text-red-700",
  whimsical: "bg-sky-100 text-sky-700",
};

function PresetCard({
  preset,
  active,
  onApply,
}: {
  preset: EffectPreset;
  active: boolean;
  onApply: () => void;
}) {
  const effectCount = Object.values(preset.effects).filter(Boolean).length;

  return (
    <button
      type="button"
      onClick={onApply}
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-all",
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border hover:border-primary/40 hover:bg-accent/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold leading-tight">
          {preset.name}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
            MOOD_COLORS[preset.mood],
          )}
        >
          {preset.mood}
        </span>
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground">
        {preset.description}
      </p>
      <span className="text-[9px] text-muted-foreground/70">
        {effectCount} effect{effectCount !== 1 ? "s" : ""}
      </span>
    </button>
  );
}

export function EffectPresetPicker({
  eventType,
  activePresetId,
  onApply,
  onClear,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const recommended = eventType
    ? getPresetsForEventType(eventType)
    : EFFECT_PRESETS.filter((p) => p.eventTypes === "*");

  const remaining = EFFECT_PRESETS.filter(
    (p) => !recommended.some((r) => r.id === p.id),
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-primary" />
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Presets
        </label>
      </div>

      {activePresetId && (
        <button
          type="button"
          onClick={onClear}
          className="self-start text-[10px] font-medium text-muted-foreground underline hover:text-foreground"
        >
          Clear preset
        </button>
      )}

      <div className="grid grid-cols-1 gap-2">
        {recommended.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            active={activePresetId === preset.id}
            onApply={() => onApply(preset.effects, preset.id)}
          />
        ))}
      </div>

      {remaining.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 self-start text-[10px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "size-3 transition-transform",
                expanded && "rotate-180",
              )}
            />
            Browse all ({EFFECT_PRESETS.length})
          </button>

          {expanded && (
            <div className="grid grid-cols-1 gap-2">
              {remaining.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  active={activePresetId === preset.id}
                  onApply={() => onApply(preset.effects, preset.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
