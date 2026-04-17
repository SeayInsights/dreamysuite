"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRecommended, getEffectsByCategory, getEffectById } from "@/lib/effects/registry";
import type { EffectCategory, EventType, EffectEntry, Mood } from "@/lib/effects/types";

interface Props {
  category: EffectCategory;
  value: string | null;
  onChange: (id: string | null) => void;
  eventType?: EventType | null;
  label?: string;
}

const MOOD_LABELS: Record<Mood, string> = {
  romantic: "Romantic",
  elegant: "Elegant",
  modern: "Modern",
  playful: "Playful",
  dramatic: "Dramatic",
  whimsical: "Whimsical",
};

const INTENSITY_DOT: Record<string, string> = {
  subtle: "bg-emerald-400",
  medium: "bg-amber-400",
  dramatic: "bg-rose-400",
};

function EffectThumbnail({
  effect,
  selected,
  onClick,
}: {
  effect: EffectEntry;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={effect.description}
      className={cn(
        "group relative flex flex-col items-center gap-1 rounded-lg border p-2 transition-all",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border hover:border-primary/40 hover:bg-accent/50",
      )}
    >
      <div className="flex h-10 w-full items-center justify-center rounded bg-muted/50 text-[10px] font-medium text-muted-foreground">
        {effect.name}
      </div>
      <div className="flex w-full items-center gap-1">
        <span
          className={cn("size-1.5 shrink-0 rounded-full", INTENSITY_DOT[effect.intensity])}
          title={effect.intensity}
        />
        <span className="truncate text-[9px] text-muted-foreground">
          {effect.mood[0] && MOOD_LABELS[effect.mood[0]]}
        </span>
      </div>
    </button>
  );
}

export function EffectPicker({ category, value, onChange, eventType, label }: Props) {
  const [expanded, setExpanded] = useState(false);

  const recommended = eventType
    ? getRecommended(category, eventType).slice(0, 5)
    : getEffectsByCategory(category).slice(0, 5);

  const allEffects = getEffectsByCategory(category);
  const remaining = allEffects.filter(
    (e) => !recommended.some((r) => r.id === e.id),
  );

  const selectedEffect = value ? getEffectById(value) : null;

  const moodGroups = remaining.reduce<Record<string, EffectEntry[]>>(
    (acc, e) => {
      const mood = e.mood[0] ?? "modern";
      if (!acc[mood]) acc[mood] = [];
      acc[mood].push(e);
      return acc;
    },
    {},
  );

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
      )}

      {selectedEffect && (
        <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5">
          <div className="flex items-center gap-2">
            <span
              className={cn("size-1.5 rounded-full", INTENSITY_DOT[selectedEffect.intensity])}
            />
            <span className="text-xs font-medium">{selectedEffect.name}</span>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Remove effect"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5">
        {recommended.map((effect) => (
          <EffectThumbnail
            key={effect.id}
            effect={effect}
            selected={value === effect.id}
            onClick={() => onChange(value === effect.id ? null : effect.id)}
          />
        ))}
      </div>

      {remaining.length > 0 && (
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
          Browse all ({allEffects.length})
        </button>
      )}

      {expanded && (
        <div className="flex flex-col gap-3 pt-1">
          {Object.entries(moodGroups).map(([mood, effects]) => (
            <div key={mood} className="flex flex-col gap-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {MOOD_LABELS[mood as Mood] ?? mood}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {effects.map((effect) => (
                  <EffectThumbnail
                    key={effect.id}
                    effect={effect}
                    selected={value === effect.id}
                    onClick={() =>
                      onChange(value === effect.id ? null : effect.id)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
