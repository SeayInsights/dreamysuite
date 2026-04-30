"use client";

import React from "react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// ArrangePopoverContent
// Renders the layer-order + rotation panel inside the Arrange floating popover.
// All state reads/writes are delegated to the parent via props.
// ---------------------------------------------------------------------------

interface ArrangePopoverContentProps {
  currentRotation: number;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onRotationChange: (degrees: number) => void;
  onRotationReset: () => void;
}

export function ArrangePopoverContent({
  currentRotation,
  onBringToFront,
  onSendToBack,
  onRotationChange,
  onRotationReset,
}: ArrangePopoverContentProps) {
  return (
    <div className="w-48 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Layer Order
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-xs"
        onClick={(e) => { e.stopPropagation(); onBringToFront(); }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M7 2v10M4 4.5L7 2l3 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Bring to Front
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-xs"
        onClick={(e) => { e.stopPropagation(); onSendToBack(); }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M7 12V2M4 9.5L7 12l3-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Send to Back
      </Button>

      <div className="border-t border-border pt-2 mt-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Rotation
        </p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={currentRotation}
            className="flex-1 h-1 accent-primary"
            onChange={(e) => {
              e.stopPropagation();
              onRotationChange(Number(e.target.value));
            }}
          />
          <div className="flex items-center gap-0.5">
            <input
              type="number"
              min={-180}
              max={180}
              value={currentRotation}
              className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-center tabular-nums"
              onChange={(e) => {
                e.stopPropagation();
                const v = Number(e.target.value);
                if (!Number.isNaN(v)) {
                  onRotationChange(Math.max(-180, Math.min(180, v)));
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
            />
            <span className="text-[10px] text-muted-foreground">°</span>
          </div>
        </div>
        {currentRotation !== 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs mt-1"
            onClick={(e) => { e.stopPropagation(); onRotationReset(); }}
          >
            Reset rotation
          </Button>
        )}
      </div>
    </div>
  );
}
