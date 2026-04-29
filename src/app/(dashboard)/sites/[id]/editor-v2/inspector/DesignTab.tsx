"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CollapsibleSection } from "./CollapsibleSection";
import { getInspectorConfig } from "@/lib/inspectorRegistry";
import { parseCfg } from "@/lib/editableField";
import { AnimationPresetPicker } from "./AnimationPresetPicker";
import { runPreviewAnimation } from "@/app/animations/preview";
import "@/app/animations/presets/index";
import type { Block } from "@/app/stores/editorStore";

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

interface DesignTabProps {
  block: Block;
  breakpoint: "desktop" | "tablet" | "mobile";
  updateBlock: (id: string, updates: Partial<Block>) => void;
}

function NumericInput({
  label,
  value,
  onChange,
  unit = "px",
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  unit?: string;
}) {
  const [draft, setDraft] = useState(String(value ?? ""));

  useEffect(() => {
    setDraft(String(value ?? ""));
  }, [value]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed === "") {
      onChange(undefined);
    } else {
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed)) {
        onChange(parsed);
      } else {
        setDraft(String(value ?? ""));
      }
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-0.5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") commit();
          }}
          className="h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <span className="shrink-0 text-[10px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

export function DesignTab({ block, breakpoint: _breakpoint, updateBlock }: DesignTabProps) {
  const cfg = getInspectorConfig(block.type);
  const parsed = parseCfg(block.config);

  const [linked, setLinked] = useState(false);

  const bgColor = parsed.backgroundColor as string | undefined;

  const padding = (parsed.padding as Record<string, number> | undefined) ?? {};

  const isVisible = (block.isVisible ?? 1) === 1;

  const currentAnim: AnimationConfig = {
    ...DEFAULT_ANIM,
    ...(parsed.animation as Partial<AnimationConfig> | undefined),
  };

  return (
    <div className="space-y-0">
      {cfg.showBackground && (
        <CollapsibleSection title="Background" defaultOpen={false}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bgColor || "#ffffff"}
              onChange={(e) =>
                updateBlock(block.id, { config: { ...parsed, backgroundColor: e.target.value } })
              }
              onKeyDown={(e) => e.stopPropagation()}
              className="h-7 w-7 cursor-pointer rounded border border-input p-0.5"
            />
            <input
              type="text"
              value={bgColor || ""}
              placeholder="None"
              onChange={(e) => {
                const v = e.target.value.trim();
                updateBlock(block.id, { config: { ...parsed, backgroundColor: v || undefined } });
              }}
              onKeyDown={(e) => e.stopPropagation()}
              className="h-7 flex-1 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </CollapsibleSection>
      )}

      {cfg.showPadding && (
        <CollapsibleSection title="Padding" defaultOpen={false}>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <NumericInput
                label="Top"
                value={padding.top}
                onChange={(v) => {
                  if (linked) {
                    updateBlock(block.id, {
                      config: { ...parsed, padding: { top: v, right: v, bottom: v, left: v } },
                    });
                  } else {
                    updateBlock(block.id, {
                      config: { ...parsed, padding: { ...padding, top: v as number } },
                    });
                  }
                }}
              />
              <NumericInput
                label="Right"
                value={padding.right}
                onChange={(v) => {
                  if (linked) {
                    updateBlock(block.id, {
                      config: { ...parsed, padding: { top: v, right: v, bottom: v, left: v } },
                    });
                  } else {
                    updateBlock(block.id, {
                      config: { ...parsed, padding: { ...padding, right: v as number } },
                    });
                  }
                }}
              />
              <NumericInput
                label="Bottom"
                value={padding.bottom}
                onChange={(v) => {
                  if (linked) {
                    updateBlock(block.id, {
                      config: { ...parsed, padding: { top: v, right: v, bottom: v, left: v } },
                    });
                  } else {
                    updateBlock(block.id, {
                      config: { ...parsed, padding: { ...padding, bottom: v as number } },
                    });
                  }
                }}
              />
              <NumericInput
                label="Left"
                value={padding.left}
                onChange={(v) => {
                  if (linked) {
                    updateBlock(block.id, {
                      config: { ...parsed, padding: { top: v, right: v, bottom: v, left: v } },
                    });
                  } else {
                    updateBlock(block.id, {
                      config: { ...parsed, padding: { ...padding, left: v as number } },
                    });
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setLinked((prev) => !prev)}
              className={cn(
                "flex h-6 w-full items-center justify-center gap-1 rounded border text-[10px] transition-colors",
                linked
                  ? "border-foreground bg-foreground text-background"
                  : "border-input bg-background text-muted-foreground hover:border-foreground"
              )}
            >
              {linked ? "Linked" : "Link all sides"}
            </button>
          </div>
        </CollapsibleSection>
      )}

      {cfg.showVisibility && (
        <CollapsibleSection title="Visibility" defaultOpen={false}>
          <label className="flex cursor-pointer items-center gap-2">
            <div
              className={cn(
                "relative h-4 w-7 rounded-full transition-colors",
                isVisible ? "bg-foreground" : "bg-muted"
              )}
              onClick={() => updateBlock(block.id, { isVisible: isVisible ? 0 : 1 })}
            >
              <div
                className={cn(
                  "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform",
                  isVisible ? "translate-x-3.5" : "translate-x-0.5"
                )}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {isVisible ? "Visible" : "Hidden"}
            </span>
          </label>
        </CollapsibleSection>
      )}

      {cfg.showMotion && (
        <CollapsibleSection title="Motion" defaultOpen={false}>
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-[10px] text-muted-foreground">Entrance</p>
              <AnimationPresetPicker
                value={currentAnim.presetId}
                onChange={(id) => {
                  updateBlock(block.id, {
                    config: { ...parsed, animation: { ...currentAnim, presetId: id } },
                  });
                  if (id) runPreviewAnimation(block.id, id);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-14 shrink-0 text-[11px] text-muted-foreground">Easing</label>
              <select
                value={currentAnim.easing}
                onChange={(e) =>
                  updateBlock(block.id, {
                    config: { ...parsed, animation: { ...currentAnim, easing: e.target.value } },
                  })
                }
                onKeyDown={(e) => e.stopPropagation()}
                className="h-7 flex-1 rounded border border-input bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {EASING_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
