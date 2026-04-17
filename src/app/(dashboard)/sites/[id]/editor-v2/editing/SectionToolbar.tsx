"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";

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
// Constants — 8-swatch background palette
// ---------------------------------------------------------------------------

const BG_SOLID_SWATCHES = [
  "#ffffff", "#faf8f6", "#f1f5f9", "#f0fdf4",
  "#fdf4ff", "#fff7ed", "#fef2f2", "#fffbeb",
  "#6b7280", "#1e3a5f", "#312e81", "#000000",
] as const;

const BG_GRADIENTS: { label: string; value: string; dark?: boolean }[] = [
  { label: "Warm Ivory",  value: "linear-gradient(135deg,#fff8f0 0%,#e8c98a 100%)" },
  { label: "Blush Rose",  value: "linear-gradient(135deg,#fff0f6 0%,#f9a8d4 100%)" },
  { label: "Ocean Sky",   value: "linear-gradient(135deg,#e0f2fe 0%,#3b82f6 100%)" },
  { label: "Sage Garden", value: "linear-gradient(135deg,#f0fdf4 0%,#4ade80 100%)" },
  { label: "Champagne",   value: "linear-gradient(135deg,#fffbeb 0%,#b45309 100%)" },
  { label: "Lavender",    value: "linear-gradient(135deg,#f5f3ff 0%,#8b5cf6 100%)" },
  { label: "Twilight",    value: "linear-gradient(135deg,#312e81 0%,#7c3aed 100%)", dark: true },
  { label: "Midnight",    value: "linear-gradient(135deg,#0f172a 0%,#1e40af 100%)", dark: true },
];

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

function BackgroundPopover({ currentValue, onSelect }: BgPopoverProps) {
  const isGradient = currentValue.startsWith("linear-gradient") || currentValue.startsWith("radial-gradient");
  const isTransparent = currentValue === "transparent" || currentValue === "";
  const [tab, setTab] = useState<BgTab>(isGradient ? "gradient" : isTransparent ? "transparent" : "solid");
  const [hex, setHex] = useState(isGradient || isTransparent ? "#ffffff" : currentValue);
  const [opacity, setOpacity] = useState(100);
  const [gradDir, setGradDir] = useState("135deg");

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
            {BG_SOLID_SWATCHES.map((color) => (
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
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground shrink-0">Hex</label>
            <input
              type="text"
              value={hex}
              maxLength={7}
              className="h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              onChange={(e) => setHex(e.target.value)}
              onBlur={() => { if (/^#[0-9a-fA-F]{6}$/.test(hex.trim())) applyHexOpacity(hex.trim(), opacity); }}
              onKeyDown={(e) => { if (e.key === "Enter" && /^#[0-9a-fA-F]{6}$/.test(hex.trim())) applyHexOpacity(hex.trim(), opacity); e.stopPropagation(); }}
            />
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
            {BG_GRADIENTS.map((g) => {
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
// Animation stub tooltip
// ---------------------------------------------------------------------------

function AnimationStub() {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((v) => !v)}
        aria-label="Animation settings (coming soon)"
      >
        <AnimationIcon />
        Animation
      </Button>
      {show && (
        <div
          className={cn(
            "absolute bottom-full left-1/2 mb-2 -translate-x-1/2",
            "whitespace-nowrap rounded-md border border-border bg-popover px-3 py-1.5",
            "text-xs text-muted-foreground shadow-md",
            "pointer-events-none z-[70]",
          )}
          role="tooltip"
        >
          Coming in Phase 6
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

  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [activePopover, setActivePopover] = useState<"bg" | "padding" | "height" | null>(null);
  const [popoverPos, setPopoverPos] = useState<Position>({ top: 0, left: 0 });

  const TOOLBAR_HEIGHT = 44;
  const TOOLBAR_MARGIN = 8;
  const ANIM_MS = 150;

  // Animation phase state machine — keeps toolbar mounted during exit animation
  type ToolbarPhase = "hidden" | "entering" | "shown" | "exiting";
  const phaseRef = useRef<ToolbarPhase>("hidden");
  const [toolbarPhase, setToolbarPhaseState] = useState<ToolbarPhase>("hidden");
  const [renderPos, setRenderPos] = useState<Position | null>(null);
  const [renderBlockId, setRenderBlockId] = useState<string | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setToolbarPhase(p: ToolbarPhase) {
    phaseRef.current = p;
    setToolbarPhaseState(p);
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

  // Single effect handles enter/exit animation AND live position updates.
  // Position is included as a dependency because measurePosition fires as a
  // separate state update — reading position via closure would be stale.
  // phaseRef guards against re-triggering the enter animation on scroll
  // repositioning (position-only changes while already shown).
  useEffect(() => {
    const shouldShow = !!(selectedBlockId && position && !isTextEditing);
    if (animTimerRef.current) { clearTimeout(animTimerRef.current); animTimerRef.current = null; }

    if (shouldShow) {
      setRenderPos(position);
      setRenderBlockId(selectedBlockId);
      if (phaseRef.current !== "shown" && phaseRef.current !== "entering") {
        // Fresh mount — slide+fade in.
        phaseRef.current = "entering";
        setToolbarPhaseState("entering");
        // One rAF guarantees the entering (opacity:0 / translateY(8px)) frame is
        // painted before we flip to shown — giving CSS transition a start value.
        const rafId = requestAnimationFrame(() => {
          phaseRef.current = "shown";
          setToolbarPhaseState("shown");
        });
        return () => cancelAnimationFrame(rafId);
      }
    } else if (phaseRef.current !== "hidden" && phaseRef.current !== "exiting") {
      // Selection cleared — slide up and fade out, then unmount.
      phaseRef.current = "exiting";
      setToolbarPhaseState("exiting");
      animTimerRef.current = setTimeout(() => {
        phaseRef.current = "hidden";
        setToolbarPhaseState("hidden");
        setRenderPos(null);
        setRenderBlockId(null);
      }, ANIM_MS);
    }
  }, [selectedBlockId, isTextEditing, position]);

  // Cleanup timer on unmount.
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

  function openPopover(which: "bg" | "padding" | "height", btnEl: HTMLElement) {
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
      style={{
          top: renderPos.top,
          left: renderPos.left,
          opacity: toolbarPhase === "shown" ? 1 : 0,
          transform:
            toolbarPhase === "entering"
              ? "translateY(8px)"
              : toolbarPhase === "exiting"
                ? "translateY(-8px)"
                : "translateY(0)",
          transition:
            toolbarPhase === "entering"
              ? "none"
              : `opacity ${ANIM_MS}ms ease-out, transform ${ANIM_MS}ms ease-out`,
        }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Background button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        aria-label="Set section background"
        onClick={(e) => openPopover("bg", e.currentTarget)}
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
        onClick={(e) => openPopover("padding", e.currentTarget)}
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
        onClick={(e) => openPopover("height", e.currentTarget)}
      >
        <SizeIcon />
        Size
      </Button>

      <DividerLine />

      {/* Animation stub */}
      <AnimationStub />

      {/* Background popover */}
      <FloatingPopover
        open={activePopover === "bg"}
        top={popoverPos.top}
        left={popoverPos.left}
        onClose={() => setActivePopover(null)}
      >
        <BackgroundPopover
          currentValue={currentBg}
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
    </div>
  );
}
