"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/app/stores/editorStore";
import { getEffectsByCategory, getEffectById, getRecommended } from "@/lib/effects/registry";
import type { EffectCategory, EventType, Mood, EffectEntry } from "@/lib/effects/types";

interface Props {
  category: EffectCategory;
  value: string | null;
  onChange: (id: string | null) => void;
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

const MOOD_ORDER: Mood[] = ["romantic", "elegant", "modern", "playful", "dramatic", "whimsical"];

const INTENSITY_DOT: Record<string, string> = {
  subtle: "bg-emerald-400",
  medium: "bg-amber-400",
  dramatic: "bg-rose-400",
};

export function EffectPicker({ category, value, onChange, label }: Props) {
  const [open, setOpen] = useState(false);
  const [expandedMood, setExpandedMood] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mode = useEditorStore((s) => s.mode);
  const eventType = useEditorStore((s) => s.eventType) as EventType | null;

  const allEffects = getEffectsByCategory(category);
  const selectedEffect = value ? getEffectById(value) : null;
  const isPro = mode === "pro";

  const recommended = eventType
    ? getRecommended(category, eventType)
    : allEffects.slice(0, 8);

  const moodGroups = MOOD_ORDER.reduce<[Mood, EffectEntry[]][]>((acc, mood) => {
    const effects = allEffects.filter((e) => e.mood.includes(mood));
    if (effects.length > 0) acc.push([mood, effects]);
    return acc;
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleSelect(id: string | null) {
    onChange(id);
    setOpen(false);
    setExpandedMood(null);
  }

  return (
    <div className="flex flex-col gap-1" ref={panelRef}>
      {label && (
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs transition-colors",
          open
            ? "border-ring bg-accent"
            : "border-border hover:border-ring/50",
        )}
      >
        <span className={selectedEffect ? "font-medium text-foreground" : "text-muted-foreground"}>
          {selectedEffect ? selectedEffect.name : "None"}
        </span>
        <div className="flex items-center gap-1">
          {selectedEffect && (
            <span
              className={cn("size-1.5 rounded-full", INTENSITY_DOT[selectedEffect.intensity])}
              title={selectedEffect.intensity}
            />
          )}
          <ChevronDown
            className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </div>
      </button>

      {open && (
        <div className="flex flex-col rounded-md border border-border bg-background shadow-sm">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={cn(
              "w-full px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-accent",
              !value && "bg-accent/50 font-medium",
            )}
          >
            None
          </button>

          <div className="h-px bg-border" />

          <div className="max-h-56 overflow-y-auto">
            {isPro ? (
              moodGroups.map(([mood, effects]) => (
                <div key={mood}>
                  <button
                    type="button"
                    onClick={() => setExpandedMood(expandedMood === mood ? null : mood)}
                    className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent/50"
                  >
                    {expandedMood === mood ? (
                      <ChevronDown className="size-3" />
                    ) : (
                      <ChevronRight className="size-3" />
                    )}
                    {MOOD_LABELS[mood]}
                    <span className="text-[9px] font-normal">({effects.length})</span>
                  </button>

                  {expandedMood === mood && (
                    <div className="flex flex-col">
                      {effects.map((effect) => (
                        <button
                          key={effect.id}
                          type="button"
                          onClick={() => handleSelect(effect.id)}
                          title={effect.description}
                          className={cn(
                            "flex w-full items-center gap-2 px-4 py-1.5 text-left text-xs transition-colors hover:bg-accent",
                            value === effect.id && "bg-primary/10 font-medium text-primary",
                          )}
                        >
                          <span
                            className={cn("size-1.5 shrink-0 rounded-full", INTENSITY_DOT[effect.intensity])}
                          />
                          <span className="truncate">{effect.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              recommended.map((effect) => (
                <button
                  key={effect.id}
                  type="button"
                  onClick={() => handleSelect(effect.id)}
                  title={effect.description}
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-accent",
                    value === effect.id && "bg-primary/10 font-medium text-primary",
                  )}
                >
                  <span
                    className={cn("size-1.5 shrink-0 rounded-full", INTENSITY_DOT[effect.intensity])}
                  />
                  <span className="truncate">{effect.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
