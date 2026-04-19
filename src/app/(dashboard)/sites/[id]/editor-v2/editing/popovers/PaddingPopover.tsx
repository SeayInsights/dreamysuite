"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaddingValue {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface PaddingPopoverProps {
  current: PaddingValue;
  onChange: (v: PaddingValue) => void;
}

type PaddingInputState = { top: string; right: string; bottom: string; left: string };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PaddingPopover({ current, onChange }: PaddingPopoverProps) {
  const toStr = (v: number | undefined) => (v !== undefined ? String(v) : "");
  const [vals, setVals] = useState<PaddingInputState>({
    top: toStr(current.top),
    right: toStr(current.right),
    bottom: toStr(current.bottom),
    left: toStr(current.left),
  });

  function update(key: keyof PaddingInputState, raw: string) {
    const next = { ...vals, [key]: raw };
    setVals(next);
    const parsed: PaddingValue = {};
    for (const k of ["top", "right", "bottom", "left"] as const) {
      const trimmed = next[k].trim();
      if (trimmed === "") continue;
      const n = parseInt(trimmed, 10);
      if (!isNaN(n)) parsed[k] = Math.max(0, n);
    }
    onChange(parsed);
  }

  const fields: { key: keyof PaddingInputState; label: string }[] = [
    { key: "top", label: "Top" },
    { key: "right", label: "Right" },
    { key: "bottom", label: "Bottom" },
    { key: "left", label: "Left" },
  ];

  return (
    <div className="w-44 space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Padding (px)
      </p>
      <div className="grid grid-cols-2 gap-2">
        {fields.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-0.5">
            <label htmlFor={`pad-${key}`} className="text-[10px] text-muted-foreground">
              {label}
            </label>
            <input
              id={`pad-${key}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="auto"
              value={vals[key]}
              className={cn(
                "h-7 w-full rounded border border-input bg-background px-2 text-xs",
                "focus:outline-none focus:ring-1 focus:ring-ring",
              )}
              onChange={(e) => update(key, e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">Blank = 0. Set all sides you want.</p>
    </div>
  );
}
