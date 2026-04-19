"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { hexToRgb, rgbToHex } from "@/lib/color";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BgTab = "solid" | "gradient" | "transparent";

export interface BgPopoverProps {
  currentValue: string;
  onSelect: (value: string) => void;
  swatches: string[];
  gradients: { label: string; value: string; dark?: boolean }[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

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

function parseRgbaOpacity(val: string): { hex: string; opacity: number } {
  const m = val.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/);
  if (m) {
    const r = parseInt(m[1], 10);
    const g = parseInt(m[2], 10);
    const b = parseInt(m[3], 10);
    const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
    return { hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`, opacity: Math.round(a * 100) };
  }
  return { hex: val, opacity: 100 };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BackgroundPopover({ currentValue, onSelect, swatches, gradients }: BgPopoverProps) {
  const isGradient = currentValue.startsWith("linear-gradient") || currentValue.startsWith("radial-gradient");
  const isTransparent = currentValue === "transparent" || currentValue === "";
  const parsed = !isGradient && !isTransparent ? parseRgbaOpacity(currentValue) : null;
  const [tab, setTab] = useState<BgTab>(isGradient ? "gradient" : isTransparent ? "transparent" : "solid");
  const [hex, setHex] = useState(parsed ? parsed.hex : isGradient || isTransparent ? "#ffffff" : currentValue);
  const [opacity, setOpacity] = useState(parsed ? parsed.opacity : 100);

  useEffect(() => {
    const isGrad = currentValue.startsWith("linear-gradient") || currentValue.startsWith("radial-gradient");
    const isTrans = currentValue === "transparent" || currentValue === "";
    setTab(isGrad ? "gradient" : isTrans ? "transparent" : "solid");
    if (!isGrad && !isTrans) {
      const p = parseRgbaOpacity(currentValue);
      setHex(p.hex);
      setOpacity(p.opacity);
    } else {
      setHex("#ffffff");
      setOpacity(100);
    }
  }, [currentValue]);
  const [gradDir, setGradDir] = useState("135deg");
  const [colorMode, setColorMode] = useState<ColorMode>("hex");

  function applyHexOpacity(h: string, op: number) {
    if (op >= 100) { onSelect(h); return; }
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
            {swatches.map((color, i) => (
              <button
                key={i}
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
                  const parts = hexToRgb(hex);
                  return (
                    <input
                      key={ch}
                      type="number"
                      min={0}
                      max={255}
                      value={parts[i]}
                      onChange={(e) => {
                        const p = hexToRgb(hex);
                        p[i] = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                        const next = rgbToHex(p[0], p[1], p[2]);
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
