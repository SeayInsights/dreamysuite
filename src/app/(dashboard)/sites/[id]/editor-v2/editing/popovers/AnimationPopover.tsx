"use client";

import { cn } from "@/lib/utils";
import { AnimationPresetPicker } from "../../inspector/AnimationPresetPicker";
import { runPreviewAnimation } from "@/app/animations/preview";
import { useEditorStore } from "@/app/stores/editorStore";
import "@/app/animations/presets/index";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnimationConfig {
  presetId: string | null;
  duration: number;
  delay: number;
  easing: string;
  trigger: "on-view" | "on-hover" | "on-scroll-scrub";
}

export const DEFAULT_ANIM: AnimationConfig = {
  presetId: null,
  duration: 0.6,
  delay: 0,
  easing: "power2.out",
  trigger: "on-view",
};

export interface AnimationPopoverProps {
  blockId: string;
  anim: AnimationConfig;
  isPro: boolean;
  onUpdate: (patch: Partial<AnimationConfig>) => void;
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const EASING_OPTIONS_SIMPLE = [
  "power2.out",
  "power2.inOut",
  "power3.out",
  "expo.out",
  "elastic.out(1, 0.3)",
  "back.out(1.7)",
  "bounce.out",
  "sine.out",
  "linear",
];

const EASING_OPTIONS_PRO = [
  ...EASING_OPTIONS_SIMPLE,
  "power1.in",
  "power1.out",
  "power1.inOut",
  "power4.out",
  "power4.inOut",
  "circ.out",
  "circ.inOut",
  "expo.inOut",
  "sine.inOut",
  "back.inOut",
  "elastic.out(1, 0.5)",
  "elastic.out(2, 0.3)",
  "steps(5)",
  "steps(10)",
];

const TRIGGER_OPTIONS: { id: AnimationConfig["trigger"]; label: string }[] = [
  { id: "on-view", label: "On view" },
  { id: "on-hover", label: "On hover" },
  { id: "on-scroll-scrub", label: "Scroll scrub" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnimationPopoverContent({
  blockId,
  anim,
  isPro,
  onUpdate,
}: AnimationPopoverProps) {
  const easingOptions = isPro ? EASING_OPTIONS_PRO : EASING_OPTIONS_SIMPLE;
  const hasPreset = !!anim.presetId;
  const blockType = useEditorStore(
    (s) => s.blocks.find((b) => b.id === blockId)?.type,
  );
  const contentDocument = useEditorStore((s) => s.contentDocument);

  function updateWithPreview(patch: Partial<AnimationConfig>) {
    onUpdate(patch);
    const merged = { ...anim, ...patch };
    if (merged.presetId)
      runPreviewAnimation(blockId, merged.presetId, merged, contentDocument);
  }

  return (
    <div className="flex">
      {/* Left panel — preset picker */}
      <div className="w-64 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Entrance Preset
        </p>
        <AnimationPresetPicker
          value={anim.presetId}
          blockType={blockType}
          onChange={(id) => {
            if (id) updateWithPreview({ presetId: id });
            else onUpdate({ presetId: null });
          }}
        />
      </div>

      {/* Right panel — timing options, pro mode only */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-out",
          hasPreset && isPro
            ? "ml-3 w-56 border-l border-border pl-3 opacity-100"
            : "w-0 opacity-0",
        )}
      >
        {hasPreset && isPro && (
          <div className="w-56 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Timing
            </p>

            <div className="flex items-center gap-2">
              <label className="w-12 shrink-0 text-[11px] text-muted-foreground">
                Duration
              </label>
              <input
                type="number"
                min={50}
                max={5000}
                step={50}
                value={Math.round(anim.duration * 1000)}
                onChange={(e) =>
                  onUpdate({
                    duration: Math.max(0.05, Number(e.target.value) / 1000),
                  })
                }
                className="h-7 w-16 rounded border border-input bg-background px-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                onKeyDown={(e) => e.stopPropagation()}
              />
              <span className="text-[10px] text-muted-foreground">ms</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-12 shrink-0 text-[11px] text-muted-foreground">
                Delay
              </label>
              <input
                type="number"
                min={0}
                max={5000}
                step={50}
                value={Math.round(anim.delay * 1000)}
                onChange={(e) =>
                  onUpdate({
                    delay: Math.max(0, Number(e.target.value) / 1000),
                  })
                }
                className="h-7 w-16 rounded border border-input bg-background px-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                onKeyDown={(e) => e.stopPropagation()}
              />
              <span className="text-[10px] text-muted-foreground">ms</span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">
                Easing
              </label>
              <select
                value={anim.easing}
                onChange={(e) => onUpdate({ easing: e.target.value })}
                className="h-7 w-full rounded border border-input bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {easingOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {isPro && (
              <div className="space-y-1.5 border-t border-border pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Trigger
                </p>
                <div className="flex flex-wrap gap-1">
                  {TRIGGER_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdate({ trigger: opt.id })}
                      className={`h-7 rounded-sm px-2 text-[11px] font-medium transition-colors ${
                        anim.trigger === opt.id
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
