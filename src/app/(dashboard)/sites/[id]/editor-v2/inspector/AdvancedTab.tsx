"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CollapsibleSection } from "./CollapsibleSection";
import { parseCfg } from "@/lib/editableField";
import { getInspectorConfig } from "@/lib/editor/inspectorRegistry";
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

const TRIGGER_OPTIONS = [
  { id: "on-view" as const, label: "On View" },
  { id: "on-hover" as const, label: "On Hover" },
  { id: "on-scroll-scrub" as const, label: "Scroll Scrub" },
];

function NumericInput({
  label,
  value,
  onChange,
  onReset,
  unit = "px",
  overridden = false,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  onReset?: () => void;
  unit?: string;
  overridden?: boolean;
}) {
  const [draft, setDraft] = useState(value !== undefined ? String(value) : "");

  useEffect(() => {
    const next = value !== undefined ? String(value) : "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft((prev) => (prev !== next ? next : prev));
  }, [value]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed === "") {
      onChange(undefined);
    } else {
      const n = parseFloat(trimmed);
      if (!isNaN(n)) onChange(n);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className={cn("w-14 shrink-0 text-[10px] uppercase text-muted-foreground", overridden && "text-orange-500")}>
        {label}
        {overridden && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-orange-500 align-middle" />}
      </label>
      <input
        type="text"
        inputMode="numeric"
        value={draft}
        placeholder="auto"
        onChange={(e) => {
          setDraft(e.target.value);
          const trimmed = e.target.value.trim();
          if (trimmed === "") {
            onChange(undefined);
          } else {
            const n = parseFloat(trimmed);
            if (!isNaN(n)) onChange(n);
          }
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          e.stopPropagation();
        }}
        className={cn(
          "h-7 w-full rounded border border-input bg-background px-2 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring",
          overridden && "border-orange-300"
        )}
      />
      <span className="shrink-0 text-[10px] text-muted-foreground">{unit}</span>
      {overridden && onReset && (
        <button
          type="button"
          onClick={onReset}
          title="Reset to desktop value"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] text-orange-500 hover:bg-orange-50"
        >
          ↺
        </button>
      )}
    </div>
  );
}

function getEffectiveValue(
  block: Block,
  breakpoint: "desktop" | "tablet" | "mobile",
  field: string
): number | undefined {
  if (breakpoint !== "desktop") {
    const override = block.overrides?.[breakpoint]?.[field];
    if (override !== undefined) return override as number;
  }
  const val = parseCfg(block.config)[field];
  return val !== undefined ? (val as number) : undefined;
}

function isOverridden(block: Block, breakpoint: "desktop" | "tablet" | "mobile", field: string): boolean {
  if (breakpoint === "desktop") return false;
  return block.overrides?.[breakpoint]?.[field] !== undefined;
}

function resetOverride(
  block: Block,
  breakpoint: "desktop" | "tablet" | "mobile",
  field: string,
  updateBlock: (id: string, updates: Partial<Block>) => void,
) {
  if (breakpoint === "desktop") return;
  const existing = block.overrides?.[breakpoint] ?? {};
  const { [field]: _omit, ...rest } = existing;
  const newOverrides = {
    ...block.overrides,
    [breakpoint]: Object.keys(rest).length > 0 ? rest : undefined,
  };
  updateBlock(block.id, { overrides: newOverrides });
}

interface AdvancedTabProps {
  block: Block;
  breakpoint: "desktop" | "tablet" | "mobile";
  updateBlock: (id: string, updates: Partial<Block>) => void;
}

export function AdvancedTab({ block, breakpoint, updateBlock }: AdvancedTabProps) {
  const cfg = getInspectorConfig(block.type);
  const parsed = parseCfg(block.config);
  const currentAnim = { ...DEFAULT_ANIM, ...(parsed.animation as Partial<AnimationConfig> | undefined) };

  return (
    <div>
      {breakpoint !== "desktop" && (
        <div className="border-b border-border px-4 py-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
              breakpoint === "tablet" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
            )}
          >
            {breakpoint === "tablet" ? "Tablet" : "Mobile"}
            {" — overrides active"}
          </span>
        </div>
      )}

      <CollapsibleSection title="Position">
        <div className="space-y-2">
          <NumericInput
            label="X"
            value={getEffectiveValue(block, breakpoint, "blockOffsetX")}
            overridden={isOverridden(block, breakpoint, "blockOffsetX")}
            onChange={(v) => updateBlock(block.id, { config: { ...parsed, blockOffsetX: v } })}
            onReset={() => resetOverride(block, breakpoint, "blockOffsetX", updateBlock)}
          />
          <NumericInput
            label="Y"
            value={getEffectiveValue(block, breakpoint, "blockOffsetY")}
            overridden={isOverridden(block, breakpoint, "blockOffsetY")}
            onChange={(v) => updateBlock(block.id, { config: { ...parsed, blockOffsetY: v } })}
            onReset={() => resetOverride(block, breakpoint, "blockOffsetY", updateBlock)}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Size">
        <div className="space-y-2">
          <NumericInput
            label="Width"
            unit="%"
            value={getEffectiveValue(block, breakpoint, "blockWidth")}
            overridden={isOverridden(block, breakpoint, "blockWidth")}
            onChange={(v) => updateBlock(block.id, { config: { ...parsed, blockWidth: v } })}
            onReset={() => resetOverride(block, breakpoint, "blockWidth", updateBlock)}
          />
          <NumericInput
            label="Height"
            unit="px"
            value={getEffectiveValue(block, breakpoint, "blockHeight")}
            overridden={isOverridden(block, breakpoint, "blockHeight")}
            onChange={(v) => updateBlock(block.id, { config: { ...parsed, blockHeight: v } })}
            onReset={() => resetOverride(block, breakpoint, "blockHeight", updateBlock)}
          />
          <NumericInput
            label="Left"
            unit="%"
            value={getEffectiveValue(block, breakpoint, "blockMarginLeft")}
            overridden={isOverridden(block, breakpoint, "blockMarginLeft")}
            onChange={(v) => updateBlock(block.id, { config: { ...parsed, blockMarginLeft: v } })}
            onReset={() => resetOverride(block, breakpoint, "blockMarginLeft", updateBlock)}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Layer">
        <div className="space-y-2">
          <NumericInput
            label="Z-Index"
            unit=""
            value={getEffectiveValue(block, breakpoint, "blockZIndex")}
            overridden={isOverridden(block, breakpoint, "blockZIndex")}
            onChange={(v) => updateBlock(block.id, { config: { ...parsed, blockZIndex: v } })}
            onReset={() => resetOverride(block, breakpoint, "blockZIndex", updateBlock)}
          />
          <NumericInput
            label="Rotation"
            unit="°"
            value={getEffectiveValue(block, breakpoint, "blockRotation")}
            overridden={isOverridden(block, breakpoint, "blockRotation")}
            onChange={(v) => updateBlock(block.id, { config: { ...parsed, blockRotation: v } })}
            onReset={() => resetOverride(block, breakpoint, "blockRotation", updateBlock)}
          />
        </div>
      </CollapsibleSection>

      {breakpoint !== "desktop" && (
        <CollapsibleSection title="Order">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="w-14 shrink-0 text-[10px] uppercase text-muted-foreground">Position</label>
              <input
                type="number"
                min={0}
                step={1}
                placeholder="default"
                value={
                  typeof (block.overrides?.[breakpoint] as Record<string, unknown> | undefined)?.sortOrder === "number"
                    ? String((block.overrides![breakpoint] as Record<string, unknown>).sortOrder)
                    : ""
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  const bp = breakpoint as "tablet" | "mobile";
                  if (raw === "") {
                    const existing = block.overrides?.[bp] ?? {};
                    const { sortOrder: _omit, ...rest } = existing as Record<string, unknown>;
                    updateBlock(block.id, {
                      overrides: {
                        ...block.overrides,
                        [bp]: Object.keys(rest).length > 0 ? rest : undefined,
                      },
                    });
                  } else {
                    const n = parseInt(raw, 10);
                    if (!isNaN(n)) {
                      updateBlock(block.id, {
                        overrides: {
                          ...block.overrides,
                          [bp]: { ...(block.overrides?.[bp] ?? {}), sortOrder: n },
                        },
                      });
                    }
                  }
                }}
                onKeyDown={(e) => e.stopPropagation()}
                className="h-7 w-20 rounded border border-input bg-background px-2 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {typeof (block.overrides?.[breakpoint as "tablet" | "mobile"] as Record<string, unknown> | undefined)?.sortOrder === "number" && (
                <button
                  type="button"
                  title="Reset to default order"
                  onClick={() => resetOverride(block, breakpoint, "sortOrder", updateBlock)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] text-orange-500 hover:bg-orange-50"
                >
                  ↺
                </button>
              )}
            </div>
            {typeof (block.overrides?.[breakpoint as "tablet" | "mobile"] as Record<string, unknown> | undefined)?.sortOrder === "number" && (
              <p className="text-[10px] text-orange-500">Custom order on {breakpoint}</p>
            )}
          </div>
        </CollapsibleSection>
      )}

      {cfg.showTiming && (
        <CollapsibleSection title="Timing">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-14 shrink-0 text-[10px] uppercase text-muted-foreground">Duration</label>
              <input
                type="number"
                min={50}
                max={5000}
                step={50}
                value={Math.round(currentAnim.duration * 1000)}
                onChange={(e) =>
                  updateBlock(block.id, {
                    config: { ...parsed, animation: { ...currentAnim, duration: Math.max(0.05, Number(e.target.value) / 1000) } },
                  })
                }
                onKeyDown={(e) => e.stopPropagation()}
                className="h-7 w-20 rounded border border-input bg-background px-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <span className="text-[10px] text-muted-foreground">ms</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-14 shrink-0 text-[10px] uppercase text-muted-foreground">Delay</label>
              <input
                type="number"
                min={0}
                max={5000}
                step={50}
                value={Math.round(currentAnim.delay * 1000)}
                onChange={(e) =>
                  updateBlock(block.id, {
                    config: { ...parsed, animation: { ...currentAnim, delay: Math.max(0, Number(e.target.value) / 1000) } },
                  })
                }
                onKeyDown={(e) => e.stopPropagation()}
                className="h-7 w-20 rounded border border-input bg-background px-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <span className="text-[10px] text-muted-foreground">ms</span>
            </div>
            <div>
              <p className="mb-1.5 text-[10px] uppercase text-muted-foreground">Trigger</p>
              <div className="flex flex-wrap gap-1">
                {TRIGGER_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      updateBlock(block.id, {
                        config: { ...parsed, animation: { ...currentAnim, trigger: opt.id } },
                      })
                    }
                    className={cn(
                      "h-7 rounded-sm px-2 text-[11px] font-medium transition-colors",
                      currentAnim.trigger === opt.id
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
