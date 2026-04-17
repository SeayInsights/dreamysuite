"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { animate } from "motion/mini";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";
import { AnimationPresetPicker } from "../inspector/AnimationPresetPicker";
import { getPreset } from "@/app/animations/registry";
import { themeSwatches, themeGradients } from "../lib/themeSwatches";
import "@/app/animations/presets/index";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Position {
  top: number;
  left: number;
}

interface PaddingValue {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

// ---------------------------------------------------------------------------
// (Swatches are now theme-derived — see themeSwatches utility)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Popover primitive (shared, portal-less, position:fixed)
// ---------------------------------------------------------------------------

interface PopoverProps {
  open: boolean;
  top: number;
  left: number;
  onClose: () => void;
  children: ReactNode;
}

function FloatingPopover({ open, top, left, onClose, children }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      className={cn(
        "fixed z-[9999] rounded-lg border border-border bg-popover p-3 shadow-lg",
        "text-popover-foreground",
      )}
      style={{ top, left }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Background popover content
// ---------------------------------------------------------------------------

type BgTab = "solid" | "gradient" | "transparent";

interface BgPopoverProps {
  currentValue: string;
  onSelect: (value: string) => void;
  swatches: string[];
  gradients: { label: string; value: string; dark?: boolean }[];
}

const GRAD_DIRECTIONS: { label: string; angle: string; icon: string }[] = [
  { label: "Left → Right", angle: "90deg",  icon: "→" },
  { label: "Top → Bottom", angle: "180deg", icon: "↓" },
  { label: "Bottom → Top", angle: "0deg",   icon: "↑" },
  { label: "Right → Left", angle: "270deg", icon: "←" },
];

function applyAngle(gradValue: string, angle: string): string {
  return gradValue.replace(/^linear-gradient\([^,]+,/, `linear-gradient(${angle},`);
}

type ColorMode = "hex" | "rgb";

function hexToRgbParts(h: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(h);
  if (!m) return [255, 255, 255];
  return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
}

function rgbPartsToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function BackgroundPopover({ currentValue, onSelect, swatches, gradients }: BgPopoverProps) {
  const isGradient = currentValue.startsWith("linear-gradient") || currentValue.startsWith("radial-gradient");
  const isTransparent = currentValue === "transparent" || currentValue === "";
  const [tab, setTab] = useState<BgTab>(isGradient ? "gradient" : isTransparent ? "transparent" : "solid");
  const [hex, setHex] = useState(isGradient || isTransparent ? "#ffffff" : currentValue);
  const [opacity, setOpacity] = useState(100);
  const [gradDir, setGradDir] = useState("135deg");
  const [colorMode, setColorMode] = useState<ColorMode>("hex");

  function applyHexOpacity(h: string, op: number) {
    if (op >= 100) { onSelect(h); return; }
    // Convert to rgba
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    onSelect(`rgba(${r},${g},${b},${(op / 100).toFixed(2)})`);
  }

  const tabs: BgTab[] = ["solid", "gradient", "transparent"];

  return (
    <div className="w-56 space-y-3">
      {/* Tab row */}
      <div className="flex rounded-md border border-border overflow-hidden text-xs">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              if (t === "transparent") onSelect("transparent");
            }}
            className={cn(
              "flex-1 py-1 capitalize transition-colors",
              tab === t ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "solid" && (
        <>
          <div className="grid grid-cols-4 gap-1.5">
            {swatches.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Set background to ${color}`}
                onClick={() => { setHex(color); applyHexOpacity(color, opacity); }}
                className={cn(
                  "h-7 w-full rounded border transition-transform hover:scale-110",
                  currentValue === color ? "border-primary ring-1 ring-primary" : "border-border",
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex h-7 shrink-0 overflow-hidden rounded border border-input text-[10px] font-medium">
              <button type="button" onClick={() => setColorMode("hex")} className={`px-1.5 transition-colors ${colorMode === "hex" ? "bg-accent text-accent-foreground" : "bg-background text-muted-foreground hover:bg-accent/50"}`}>HEX</button>
              <button type="button" onClick={() => setColorMode("rgb")} className={`px-1.5 transition-colors ${colorMode === "rgb" ? "bg-accent text-accent-foreground" : "bg-background text-muted-foreground hover:bg-accent/50"}`}>RGB</button>
            </div>
            {colorMode === "hex" ? (
              <input
                type="text"
                value={hex}
                maxLength={7}
                className="h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                onChange={(e) => setHex(e.target.value)}
                onBlur={() => { if (/^#[0-9a-fA-F]{6}$/.test(hex.trim())) applyHexOpacity(hex.trim(), opacity); }}
                onKeyDown={(e) => { if (e.key === "Enter" && /^#[0-9a-fA-F]{6}$/.test(hex.trim())) applyHexOpacity(hex.trim(), opacity); e.stopPropagation(); }}
              />
            ) : (
              <div className="flex gap-1">
                {(["r", "g", "b"] as const).map((ch, i) => {
                  const parts = hexToRgbParts(hex);
                  return (
                    <input
                      key={ch}
                      type="number"
                      min={0}
                      max={255}
                      value={parts[i]}
                      onChange={(e) => {
                        const p = hexToRgbParts(hex);
                        p[i] = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                        const next = rgbPartsToHex(p[0], p[1], p[2]);
                        setHex(next);
                        applyHexOpacity(next, opacity);
                      }}
                      className="h-7 w-12 rounded border border-input bg-background px-1 text-center text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Opacity</span>
              <span>{opacity}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={opacity}
              className="w-full accent-primary"
              onChange={(e) => { const v = Number(e.target.value); setOpacity(v); if (/^#[0-9a-fA-F]{6}$/.test(hex)) applyHexOpacity(hex, v); }}
            />
          </div>
        </>
      )}

      {tab === "gradient" && (
        <div className="space-y-2.5">
          {/* Direction picker */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Direction</p>
            <div className="grid grid-cols-4 gap-1">
              {GRAD_DIRECTIONS.map((d) => (
                <button
                  key={d.angle}
                  type="button"
                  title={d.label}
                  onClick={() => {
                    setGradDir(d.angle);
                    if (currentValue.startsWith("linear-gradient")) {
                      onSelect(applyAngle(currentValue, d.angle));
                    }
                  }}
                  className={cn(
                    "flex h-7 items-center justify-center rounded border text-sm transition-colors",
                    gradDir === d.angle
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  {d.icon}
                </button>
              ))}
            </div>
          </div>
          {/* Gradient presets */}
          <div className="space-y-1.5">
            {gradients.map((g) => {
              const value = applyAngle(g.value, gradDir);
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => onSelect(value)}
                  className={cn(
                    "h-10 w-full rounded-md border px-3 text-left transition-transform hover:scale-[1.02]",
                    currentValue === value ? "border-primary ring-1 ring-primary" : "border-border",
                  )}
                  style={{ background: value }}
                >
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: g.dark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.55)", textShadow: g.dark ? "0 1px 2px rgba(0,0,0,0.4)" : "none" }}
                  >
                    {g.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === "transparent" && (
        <div
          className="h-14 w-full rounded border border-border flex items-center justify-center text-xs text-muted-foreground"
          style={{ backgroundImage: "repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%)", backgroundSize: "12px 12px" }}
        >
          No background
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Padding popover content
// ---------------------------------------------------------------------------

interface PaddingPopoverProps {
  current: PaddingValue;
  onChange: (v: PaddingValue) => void;
}

type PaddingInputState = { top: string; right: string; bottom: string; left: string };

function PaddingPopover({ current, onChange }: PaddingPopoverProps) {
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

// ---------------------------------------------------------------------------
// Height (size) popover content
// ---------------------------------------------------------------------------

interface HeightPopoverProps {
  current: number | undefined;
  onChange: (v: number | undefined) => void;
}

function HeightPopover({ current, onChange }: HeightPopoverProps) {
  const [val, setVal] = useState(current !== undefined ? String(current) : "");

  // Re-sync when the measured DOM height arrives (current changes on first open)
  const prevCurrent = useRef(current);
  useEffect(() => {
    if (prevCurrent.current !== current && current !== undefined) {
      setVal(String(current));
    }
    prevCurrent.current = current;
  }, [current]);

  function commit(raw: string) {
    const trimmed = raw.trim();
    if (trimmed === "") { onChange(undefined); return; }
    const n = parseInt(trimmed, 10);
    if (!isNaN(n) && n >= 0) onChange(n);
  }

  return (
    <div className="w-44 space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Block Height (px)
      </p>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="auto"
        value={val}
        className={cn(
          "h-7 w-full rounded border border-input bg-background px-2 text-xs",
          "focus:outline-none focus:ring-1 focus:ring-ring",
        )}
        onChange={(e) => setVal(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
          e.stopPropagation();
        }}
      />
      <p className="text-[10px] text-muted-foreground">
        Shows current block height. Edit to lock it. Clear to restore auto.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animation popover content
// ---------------------------------------------------------------------------

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
  "power2.out", "power2.inOut", "power3.out", "expo.out",
  "elastic.out(1, 0.3)", "back.out(1.7)", "bounce.out", "sine.out", "linear",
];

const EASING_OPTIONS_PRO = [
  ...EASING_OPTIONS_SIMPLE,
  "power1.in", "power1.out", "power1.inOut", "power4.out", "power4.inOut",
  "circ.out", "circ.inOut", "expo.inOut", "sine.inOut", "back.inOut",
  "elastic.out(1, 0.5)", "elastic.out(2, 0.3)", "steps(5)", "steps(10)",
];

const TRIGGER_OPTIONS: { id: AnimationConfig["trigger"]; label: string }[] = [
  { id: "on-view", label: "On view" },
  { id: "on-hover", label: "On hover" },
  { id: "on-scroll-scrub", label: "Scroll scrub" },
];

interface AnimationPopoverProps {
  blockId: string;
  anim: AnimationConfig;
  isPro: boolean;
  onUpdate: (patch: Partial<AnimationConfig>) => void;
}

function AnimationPopoverContent({ blockId, anim, isPro, onUpdate }: AnimationPopoverProps) {
  const easingOptions = isPro ? EASING_OPTIONS_PRO : EASING_OPTIONS_SIMPLE;

  function updateWithPreview(patch: Partial<AnimationConfig>) {
    onUpdate(patch);
    const presetId = patch.presetId ?? anim.presetId;
    if (presetId) {
      const el = document.querySelector<Element>(`[data-block-id="${blockId}"]`);
      if (el) getPreset(presetId)?.().then((fn) => fn(el));
    }
  }

  return (
    <div className="w-64 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Entrance Preset
      </p>
      <AnimationPresetPicker
        value={anim.presetId}
        onChange={(id) => updateWithPreview({ presetId: id })}
      />

      {anim.presetId && (
        <button
          type="button"
          onClick={() => onUpdate({ presetId: null })}
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          Remove animation
        </button>
      )}

      {anim.presetId && (
        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Timing
          </p>

          {isPro ? (
            <>
              <div className="flex items-center gap-2">
                <label className="w-12 shrink-0 text-[11px] text-muted-foreground">Duration</label>
                <input
                  type="number" min={50} max={5000} step={50}
                  value={Math.round(anim.duration * 1000)}
                  onChange={(e) => onUpdate({ duration: Math.max(0.05, Number(e.target.value) / 1000) })}
                  className="h-7 w-16 rounded border border-input bg-background px-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <span className="text-[10px] text-muted-foreground">ms</span>
                <input type="range" min={50} max={5000} step={50}
                  value={Math.round(anim.duration * 1000)}
                  onChange={(e) => onUpdate({ duration: Number(e.target.value) / 1000 })}
                  className="flex-1 accent-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-12 shrink-0 text-[11px] text-muted-foreground">Delay</label>
                <input
                  type="number" min={0} max={5000} step={50}
                  value={Math.round(anim.delay * 1000)}
                  onChange={(e) => onUpdate({ delay: Math.max(0, Number(e.target.value) / 1000) })}
                  className="h-7 w-16 rounded border border-input bg-background px-1.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <span className="text-[10px] text-muted-foreground">ms</span>
                <input type="range" min={0} max={5000} step={50}
                  value={Math.round(anim.delay * 1000)}
                  onChange={(e) => onUpdate({ delay: Number(e.target.value) / 1000 })}
                  className="flex-1 accent-primary"
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <label className="w-12 shrink-0 text-[11px] text-muted-foreground">Duration</label>
                <input type="range" min={0.1} max={3} step={0.05} value={anim.duration}
                  onChange={(e) => onUpdate({ duration: parseFloat(e.target.value) })}
                  className="flex-1 accent-primary"
                />
                <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{anim.duration.toFixed(2)}s</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-12 shrink-0 text-[11px] text-muted-foreground">Delay</label>
                <input type="range" min={0} max={2} step={0.05} value={anim.delay}
                  onChange={(e) => onUpdate({ delay: parseFloat(e.target.value) })}
                  className="flex-1 accent-primary"
                />
                <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{anim.delay.toFixed(2)}s</span>
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <label className="w-12 shrink-0 text-[11px] text-muted-foreground">Easing</label>
            <select
              value={anim.easing}
              onChange={(e) => onUpdate({ easing: e.target.value })}
              className="h-7 flex-1 rounded border border-input bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {easingOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {isPro && (
            <div className="space-y-1.5 border-t border-border pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Trigger
              </p>
              <div className="flex gap-1">
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
  );
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function PaletteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4.5" cy="6" r="1" fill="currentColor" />
      <circle cx="7" cy="4" r="1" fill="currentColor" />
      <circle cx="9.5" cy="6" r="1" fill="currentColor" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="5.5" cy="8.5" r="1" fill="currentColor" />
    </svg>
  );
}

function PaddingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect
        x="2"
        y="2"
        width="10"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="2 1"
      />
      <rect x="4" y="4" width="6" height="6" rx="0.75" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function SizeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 2v10M4 4.5l3-3 3 3M4 9.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AnimationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2 7c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M7 4.5V7l1.5 1.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DividerLine() {
  return <div className="h-5 w-px bg-border mx-0.5" aria-hidden />;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SectionToolbar({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}): React.JSX.Element | null {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const isTextEditing = useEditorStore((s) => s.isTextEditing);
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const mode = useEditorStore((s) => s.mode);
  const themeColors = useEditorStore((s) => s.themeTokens.colors);
  const bgSwatches = useMemo(() => themeSwatches(themeColors), [themeColors]);
  const bgGradients = useMemo(() => themeGradients(themeColors), [themeColors]);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [activePopover, setActivePopover] = useState<"bg" | "padding" | "height" | "animation" | null>(null);
  const [popoverPos, setPopoverPos] = useState<Position>({ top: 0, left: 0 });

  const TOOLBAR_HEIGHT = 44;
  const TOOLBAR_MARGIN = 8;
  const ANIM_MS = 150;

  // Animation phase state machine — keeps toolbar mounted during exit animation
  type ToolbarPhase = "hidden" | "shown" | "exiting";
  const phaseRef = useRef<ToolbarPhase>("hidden");
  const [toolbarPhase, setToolbarPhaseState] = useState<ToolbarPhase>("hidden");
  const [renderPos, setRenderPos] = useState<Position | null>(null);
  const [renderBlockId, setRenderBlockId] = useState<string | null>(null);
  // Ref mirror of renderBlockId — avoids stale closure in effects
  const renderBlockIdRef = useRef<string | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Holds a pending enter when a block-switch exit is in flight
  const pendingShowRef = useRef<{ pos: Position; blockId: string } | null>(null);

  function setToolbarPhase(p: ToolbarPhase) {
    phaseRef.current = p;
    setToolbarPhaseState(p);
  }

  function showBlock(pos: Position, blockId: string) {
    renderBlockIdRef.current = blockId;
    setRenderPos(pos);
    setRenderBlockId(blockId);
    setToolbarPhase("shown");
  }

  // Measure and position the toolbar relative to the selected block
  const measurePosition = useCallback(() => {
    const container = containerRef.current;
    if (!container || !selectedBlockId) {
      setPosition(null);
      return;
    }
    const node = container.querySelector<HTMLElement>(
      `[data-block-id="${selectedBlockId}"]`,
    );
    if (!node) {
      setPosition(null);
      return;
    }
    const frameBox = container.getBoundingClientRect();
    const box = node.getBoundingClientRect();
    const relTop = box.top - frameBox.top + (container.scrollTop ?? 0);

    const TOOLBAR_WIDTH = 320;
    const rawLeft = box.left - frameBox.left;
    const maxLeft = frameBox.width - TOOLBAR_WIDTH;
    const clampedLeft = Math.max(0, Math.min(rawLeft, maxLeft));

    const spaceAbove = box.top - frameBox.top;
    const fitsAbove = spaceAbove >= TOOLBAR_HEIGHT + TOOLBAR_MARGIN;
    const top = fitsAbove
      ? relTop - TOOLBAR_HEIGHT - TOOLBAR_MARGIN
      : relTop + box.height + TOOLBAR_MARGIN;

    setPosition({ top, left: clampedLeft });
  }, [containerRef, selectedBlockId]);

  // Re-measure on selection change or resize/scroll
  useEffect(() => {
    measurePosition();
  }, [measurePosition]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const raf = { id: 0 };
    const onUpdate = () => {
      cancelAnimationFrame(raf.id);
      raf.id = requestAnimationFrame(measurePosition);
    };
    window.addEventListener("resize", onUpdate);
    container.addEventListener("scroll", onUpdate);
    return () => {
      window.removeEventListener("resize", onUpdate);
      container.removeEventListener("scroll", onUpdate);
      cancelAnimationFrame(raf.id);
    };
  }, [containerRef, measurePosition]);

  // Enter animation — motion/mini animate() runs off React's render cycle,
  // so it doesn't suffer from React 18 batching issues. Fires whenever
  // renderBlockId changes (initial show or block switch after exit).
  useEffect(() => {
    if (toolbarPhase !== "shown") return;
    const el = toolbarRef.current;
    if (!el) return;
    el.style.opacity = "0";
    animate(
      el,
      { opacity: [0, 1], transform: ["translateY(8px)", "translateY(0px)"] },
      { duration: ANIM_MS / 1000, ease: [0.16, 1, 0.3, 1] },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderBlockId]);

  // Exit animation
  useEffect(() => {
    if (toolbarPhase !== "exiting") return;
    const el = toolbarRef.current;
    if (!el) return;
    animate(
      el,
      { opacity: [1, 0], transform: ["translateY(0px)", "translateY(-8px)"] },
      { duration: ANIM_MS / 1000, ease: "easeIn" },
    );
  }, [toolbarPhase]);

  // Main show/hide logic — position updates, block switching, exit to hidden.
  useEffect(() => {
    const shouldShow = !!(selectedBlockId && position && !isTextEditing);

    if (shouldShow) {
      const switchingBlock =
        phaseRef.current === "shown" &&
        selectedBlockId !== renderBlockIdRef.current;

      if (animTimerRef.current) { clearTimeout(animTimerRef.current); animTimerRef.current = null; }

      if (switchingBlock) {
        // Exit current block, then enter new block after the exit plays.
        pendingShowRef.current = { pos: position, blockId: selectedBlockId };
        setToolbarPhase("exiting");
        animTimerRef.current = setTimeout(() => {
          const pending = pendingShowRef.current;
          pendingShowRef.current = null;
          if (pending) showBlock(pending.pos, pending.blockId);
        }, ANIM_MS);
      } else if (phaseRef.current !== "shown") {
        // Fresh show (was hidden or mid-exit).
        showBlock(position, selectedBlockId);
      } else {
        // Same block — just reposition.
        setRenderPos(position);
      }
    } else if (phaseRef.current !== "hidden" && phaseRef.current !== "exiting") {
      if (animTimerRef.current) { clearTimeout(animTimerRef.current); animTimerRef.current = null; }
      pendingShowRef.current = null;
      setToolbarPhase("exiting");
      animTimerRef.current = setTimeout(() => {
        phaseRef.current = "hidden";
        setToolbarPhaseState("hidden");
        renderBlockIdRef.current = null;
        setRenderPos(null);
        setRenderBlockId(null);
      }, ANIM_MS);
    }
  }, [selectedBlockId, isTextEditing, position]);

  // Cleanup timers on unmount.
  useEffect(() => () => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
  }, []);

  if (toolbarPhase === "hidden" || !renderPos || !renderBlockId) return null;

  const block = blocks.find((b) => b.id === renderBlockId);
  const config = parseCfg(block?.config);

  const currentBg =
    typeof config.backgroundColor === "string" ? config.backgroundColor : "#ffffff";

  const rawPadding = config.padding;
  const currentPadding: PaddingValue =
    rawPadding !== null &&
    typeof rawPadding === "object" &&
    !Array.isArray(rawPadding)
      ? {
          top: typeof (rawPadding as Record<string, unknown>).top === "number"
            ? ((rawPadding as Record<string, unknown>).top as number)
            : undefined,
          right: typeof (rawPadding as Record<string, unknown>).right === "number"
            ? ((rawPadding as Record<string, unknown>).right as number)
            : undefined,
          bottom: typeof (rawPadding as Record<string, unknown>).bottom === "number"
            ? ((rawPadding as Record<string, unknown>).bottom as number)
            : undefined,
          left: typeof (rawPadding as Record<string, unknown>).left === "number"
            ? ((rawPadding as Record<string, unknown>).left as number)
            : undefined,
        }
      : {};

  // Prefer the config value; fall back to measuring the DOM block height.
  function getBlockHeight(): number | undefined {
    if (typeof config.blockHeight === "number") return config.blockHeight;
    const container = containerRef.current;
    if (!container || !renderBlockId) return undefined;
    const node = container.querySelector<HTMLElement>(`[data-block-id="${renderBlockId}"]`);
    return node ? Math.round(node.getBoundingClientRect().height) : undefined;
  }

  const currentHeight = typeof config.blockHeight === "number" ? config.blockHeight : undefined;

  const rawAnim = config.animation;
  const currentAnim: AnimationConfig = {
    ...DEFAULT_ANIM,
    ...(rawAnim !== null && typeof rawAnim === "object" && !Array.isArray(rawAnim)
      ? (rawAnim as Partial<AnimationConfig>)
      : {}),
  };

  function openPopover(which: "bg" | "padding" | "height" | "animation", btnEl: HTMLElement) {
    const btnBox = btnEl.getBoundingClientRect();
    setPopoverPos({ top: btnBox.bottom + 6, left: btnBox.left });
    setActivePopover((prev) => (prev === which ? null : which));
  }

  return (
    // The container is position:relative so toolbar sits inside the scroll container
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Section toolbar"
      className={cn(
        "absolute z-50 flex items-center gap-0.5 rounded-lg border border-border",
        "bg-popover px-2 py-1 shadow-lg",
      )}
      style={{ top: renderPos.top, left: renderPos.left }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        // Clicking the toolbar background (not a button/input) dismisses selection
        if (!(e.target as HTMLElement).closest("button, input, select")) {
          selectBlock(null);
        }
      }}
    >
      {/* Background button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        aria-label="Set section background"
        onClick={(e) => { e.stopPropagation(); openPopover("bg", e.currentTarget); }}
      >
        <PaletteIcon />
        Background
      </Button>

      <DividerLine />

      {/* Padding button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        aria-label="Set section padding"
        onClick={(e) => { e.stopPropagation(); openPopover("padding", e.currentTarget); }}
      >
        <PaddingIcon />
        Padding
      </Button>

      <DividerLine />

      {/* Size (height) button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        aria-label="Set block height"
        onClick={(e) => { e.stopPropagation(); openPopover("height", e.currentTarget); }}
      >
        <SizeIcon />
        Size
      </Button>

      <DividerLine />

      {/* Animation button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        aria-label="Set block animation"
        onClick={(e) => { e.stopPropagation(); openPopover("animation", e.currentTarget); }}
      >
        <AnimationIcon />
        Animation
      </Button>

      {/* Background popover */}
      <FloatingPopover
        open={activePopover === "bg"}
        top={popoverPos.top}
        left={popoverPos.left}
        onClose={() => setActivePopover(null)}
      >
        <BackgroundPopover
          currentValue={currentBg}
          swatches={bgSwatches}
          gradients={bgGradients}
          onSelect={(value) => {
            updateBlock(renderBlockId!, {
              config: { ...config, backgroundColor: value },
            });
          }}
        />
      </FloatingPopover>

      {/* Padding popover */}
      <FloatingPopover
        open={activePopover === "padding"}
        top={popoverPos.top}
        left={popoverPos.left}
        onClose={() => setActivePopover(null)}
      >
        <PaddingPopover
          current={currentPadding}
          onChange={(padding) => {
            updateBlock(renderBlockId!, {
              config: { ...config, padding },
            });
          }}
        />
      </FloatingPopover>

      {/* Height popover */}
      <FloatingPopover
        open={activePopover === "height"}
        top={popoverPos.top}
        left={popoverPos.left}
        onClose={() => setActivePopover(null)}
      >
        <HeightPopover
          current={activePopover === "height" ? (getBlockHeight() ?? currentHeight) : currentHeight}
          onChange={(blockHeight) => {
            updateBlock(renderBlockId!, {
              config: { ...config, blockHeight },
            });
          }}
        />
      </FloatingPopover>

      {/* Animation popover */}
      <FloatingPopover
        open={activePopover === "animation"}
        top={popoverPos.top}
        left={popoverPos.left}
        onClose={() => setActivePopover(null)}
      >
        <AnimationPopoverContent
          blockId={renderBlockId!}
          anim={currentAnim}
          isPro={mode === "pro"}
          onUpdate={(patch) => {
            const next = { ...currentAnim, ...patch };
            updateBlock(renderBlockId!, {
              config: { ...config, animation: next },
            });
          }}
        />
      </FloatingPopover>
    </div>
  );
}
