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
  trigger: "on-view" | "on-hover" | "on-scroll-scrub";
}

const DEFAULT_ANIM: AnimationConfig = {
  presetId: null,
  duration: 0.6,
  delay: 0,
  easing: "power2.out",
  trigger: "on-view",
};

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

    const presetId = patch.presetId ?? anim.presetId;
    if (presetId) {
      const el = document.querySelector<Element>(`[data-block-id="${selectedBlockId}"]`);
      if (el) {
        getPreset(presetId)?.().then((fn) => fn(el));
      }
    }
  }

  const isSimple = mode === "simple";
  const easingOptions = isSimple ? EASING_OPTIONS_SIMPLE : EASING_OPTIONS_PRO;

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

      {!isSimple && anim.presetId && (
        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Timing
          </p>

          <div className="flex items-center gap-3">
            <label className="w-14 shrink-0 text-xs text-muted-foreground">Duration</label>
            <input
              type="number"
              min={50}
              max={5000}
              step={50}
              value={Math.round(anim.duration * 1000)}
              onChange={(e) => update({ duration: Math.max(0.05, Number(e.target.value) / 1000) })}
              className="h-7 w-20 rounded border border-input bg-background px-2 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-[10px] text-muted-foreground">ms</span>
            <input
              type="range"
              min={50}
              max={5000}
              step={50}
              value={Math.round(anim.duration * 1000)}
              onChange={(e) => update({ duration: Number(e.target.value) / 1000 })}
              className="flex-1 accent-primary"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-14 shrink-0 text-xs text-muted-foreground">Delay</label>
            <input
              type="number"
              min={0}
              max={5000}
              step={50}
              value={Math.round(anim.delay * 1000)}
              onChange={(e) => update({ delay: Math.max(0, Number(e.target.value) / 1000) })}
              className="h-7 w-20 rounded border border-input bg-background px-2 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="text-[10px] text-muted-foreground">ms</span>
            <input
              type="range"
              min={0}
              max={5000}
              step={50}
              value={Math.round(anim.delay * 1000)}
              onChange={(e) => update({ delay: Number(e.target.value) / 1000 })}
              className="flex-1 accent-primary"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-14 shrink-0 text-xs text-muted-foreground">Easing</label>
            <select
              value={anim.easing}
              onChange={(e) => update({ easing: e.target.value })}
              className="h-7 flex-1 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {easingOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Trigger
            </p>
            <div className="flex gap-1">
              {TRIGGER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => update({ trigger: opt.id })}
                  className={`h-7 rounded-sm px-2.5 text-[11px] font-medium transition-colors ${
                    anim.trigger === opt.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {anim.trigger === "on-scroll-scrub" && (
              <p className="text-[10px] text-muted-foreground">
                Animation progress maps to scroll position through the viewport.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Simple mode: keep the original slider controls */}
      {isSimple && anim.presetId && (
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
              {EASING_OPTIONS_SIMPLE.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
