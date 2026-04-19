"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/app/stores/editorStore";
import { getEffectsByCategory, getEffectById } from "@/lib/effects/registry";
import type { EffectCategory, EffectEntry } from "@/lib/effects/types";

interface Props {
  category: EffectCategory;
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
  excludeIds?: string[];
}

const INTENSITY_DOT: Record<string, string> = {
  subtle: "bg-emerald-400",
  medium: "bg-amber-400",
  dramatic: "bg-rose-400",
};

export function EffectPicker({ category, value, onChange, label, excludeIds }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const allEffects = useMemo(() => getEffectsByCategory(category), [category]);
  const effects: EffectEntry[] = excludeIds
    ? allEffects.filter((e) => !excludeIds.includes(e.id))
    : allEffects;
  const selectedEffect = value ? getEffectById(value) : null;

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
            {effects.map((effect) => (
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
