"use client";

import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";
import { getPreset } from "@/app/animations/registry";
import "@/app/animations/presets/index";
import { AnimationPresetPicker } from "./AnimationPresetPicker";

interface AnimationConfig {
  presetId: string | null;
  duration: number;
  delay: number;
  easing: string;
}

const DEFAULT_ANIM: AnimationConfig = {
  presetId: null,
  duration: 0.6,
  delay: 0,
  easing: "power2.out",
};

const EASING_OPTIONS = [
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

export function MotionTab() {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const mode = useEditorStore((s) => s.mode);

  if (!selectedBlockId) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Select a block to configure animation.
      </div>
    );
  }

  const block = blocks.find((b) => b.id === selectedBlockId);
  const cfg = parseCfg(block?.config);
  const raw = cfg.animation;
  const anim: AnimationConfig = {
    ...DEFAULT_ANIM,
    ...(raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Partial<AnimationConfig>)
      : {}),
  };

  function update(patch: Partial<AnimationConfig>) {
    const next = { ...anim, ...patch };
    updateBlock(selectedBlockId!, { config: { ...cfg, animation: next } });

    // Live preview — run the preset on the block element immediately
    const presetId = patch.presetId ?? anim.presetId;
    if (presetId) {
      const el = document.querySelector<Element>(`[data-block-id="${selectedBlockId}"]`);
      if (el) {
        getPreset(presetId)?.().then((fn) => fn(el));
      }
    }
  }

  const isSimple = mode === "simple";

  return (
    <div className="space-y-4 p-4">
      <div>
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Entrance Preset
        </p>
        <AnimationPresetPicker
          value={anim.presetId}
          onChange={(id) => update({ presetId: id })}
        />
      </div>

      {anim.presetId && (
        <button
          type="button"
          onClick={() => update({ presetId: null })}
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          Remove animation
        </button>
      )}

      {/* Pro mode: timing controls, only shown when a preset is active */}
      {!isSimple && anim.presetId && (
        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Timing
          </p>

          <div className="flex items-center gap-3">
            <label className="w-14 shrink-0 text-xs text-muted-foreground">Duration</label>
            <input
              type="range"
              min={0.1}
              max={3}
              step={0.05}
              value={anim.duration}
              onChange={(e) => update({ duration: parseFloat(e.target.value) })}
              className="flex-1 accent-primary"
            />
            <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
              {anim.duration.toFixed(2)}s
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="w-14 shrink-0 text-xs text-muted-foreground">Delay</label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={anim.delay}
              onChange={(e) => update({ delay: parseFloat(e.target.value) })}
              className="flex-1 accent-primary"
            />
            <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
              {anim.delay.toFixed(2)}s
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="w-14 shrink-0 text-xs text-muted-foreground">Easing</label>
            <select
              value={anim.easing}
              onChange={(e) => update({ easing: e.target.value })}
              className="h-7 flex-1 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {EASING_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
