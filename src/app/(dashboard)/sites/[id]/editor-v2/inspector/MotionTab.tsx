"use client";

import { useEditorStore } from "@/app/stores/editorStore";
import { AnimationPresetPicker } from "./AnimationPresetPicker";
import { EffectPicker } from "../EffectPicker";

const TRANSITION_EXCLUDE = ["animated-content", "fade-content", "gradual-blur"];

const EASING_OPTIONS_SIMPLE = [
  "power2.out", "power2.inOut", "power3.out", "expo.out",
  "elastic.out(1, 0.3)", "back.out(1.7)", "bounce.out", "sine.out", "linear",
];

const EASING_OPTIONS_PRO = [
  ...EASING_OPTIONS_SIMPLE,
  "power1.in", "power1.out", "power1.inOut", "power4.out", "power4.inOut",
  "circ.out", "circ.inOut", "expo.inOut", "sine.inOut", "back.inOut",
  "elastic.out(1, 0.5)", "elastic.out(2, 0.3)", "steps(5)", "steps(10)",
];

const TRIGGER_OPTIONS: { id: string; label: string }[] = [
  { id: "on-view", label: "On view" },
  { id: "on-hover", label: "On hover" },
  { id: "on-scroll-scrub", label: "Scroll scrub" },
];

export function MotionTab() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const mode = useEditorStore((s) => s.mode);

  const currentPreset = settings.defaultAnimation;
  const isPro = mode === "pro";
  const easingOptions = isPro ? EASING_OPTIONS_PRO : EASING_OPTIONS_SIMPLE;

  return (
    <div className="space-y-4 p-4">
      <div className="rounded border border-dashed border-border p-3 text-[10px] leading-relaxed text-muted-foreground">
        Sets the entrance animation for all blocks by default. Override per block using the Animation button in the floating toolbar.
      </div>

      <div>
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Default Entrance Animation
        </p>
        <AnimationPresetPicker
          value={currentPreset}
          onChange={(id) => updateSettings({ defaultAnimation: id })}
        />
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <EffectPicker
          category="transition"
          value={settings.effectTransition}
          onChange={(id) => updateSettings({ effectTransition: id, effectPreset: null })}
          label="Block Transition"
          excludeIds={TRANSITION_EXCLUDE}
        />
      </div>

      {currentPreset && isPro && (
        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Timing
          </p>

          <div className="flex items-center gap-2">
            <label className="w-14 shrink-0 text-[11px] text-muted-foreground">Duration</label>
            <input
              type="number" min={50} max={5000} step={50}
              value={Math.round((settings.defaultAnimDuration ?? 0.6) * 1000)}
              onChange={(e) => updateSettings({ defaultAnimDuration: Math.max(0.05, Number(e.target.value) / 1000) })}
              className="h-7 w-16 rounded border border-input bg-background px-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-[10px] text-muted-foreground">ms</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="w-14 shrink-0 text-[11px] text-muted-foreground">Delay</label>
            <input
              type="number" min={0} max={5000} step={50}
              value={Math.round((settings.defaultAnimDelay ?? 0) * 1000)}
              onChange={(e) => updateSettings({ defaultAnimDelay: Math.max(0, Number(e.target.value) / 1000) })}
              className="h-7 w-16 rounded border border-input bg-background px-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-[10px] text-muted-foreground">ms</span>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Easing</label>
            <select
              value={settings.animation ?? "power2.out"}
              onChange={(e) => updateSettings({ animation: e.target.value })}
              className="h-7 w-full rounded border border-input bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {easingOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 border-t border-border pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Trigger
            </p>
            <div className="flex flex-wrap gap-1">
              {TRIGGER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateSettings({ defaultAnimTrigger: opt.id })}
                  className={`h-7 rounded-sm px-2 text-[11px] font-medium transition-colors ${
                    (settings.defaultAnimTrigger ?? "on-view") === opt.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
