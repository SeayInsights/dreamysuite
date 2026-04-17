"use client";

import { useEditorStore } from "@/app/stores/editorStore";
import { AnimationPresetPicker } from "./AnimationPresetPicker";

const EASING_OPTIONS = [
  "power2.out", "power2.inOut", "power3.out", "expo.out",
  "elastic.out(1, 0.3)", "back.out(1.7)", "bounce.out", "sine.out", "linear",
];

export function MotionTab() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const mode = useEditorStore((s) => s.mode);

  const currentPreset = settings.defaultAnimation;

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

      {mode === "pro" && currentPreset && (
        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Default Easing
          </p>
          <select
            value={settings.animation ?? "power2.out"}
            onChange={(e) => updateSettings({ animation: e.target.value })}
            className="h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {EASING_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
