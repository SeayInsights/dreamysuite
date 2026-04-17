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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Position {
  top: number;
  left: number;
}

interface PaddingValue {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// ---------------------------------------------------------------------------
// Constants — 8-swatch background palette
// ---------------------------------------------------------------------------

const BG_SOLID_SWATCHES = [
  "#ffffff", "#faf8f6", "#f1f5f9", "#f0fdf4",
  "#fdf4ff", "#fff7ed", "#fef2f2", "#fffbeb",
  "#1c1917", "#0f172a", "#1e293b", "#000000",
] as const;

const BG_GRADIENTS = [
  { label: "Warm Ivory",   value: "linear-gradient(160deg,#fdf8f0,#f5e8d0)" },
  { label: "Blush",        value: "linear-gradient(160deg,#fdf2f8,#fce7f3)" },
  { label: "Sky",          value: "linear-gradient(160deg,#eff6ff,#dbeafe)" },
  { label: "Sage",         value: "linear-gradient(160deg,#f0fdf4,#dcfce7)" },
  { label: "Dusk",         value: "linear-gradient(160deg,#1e1b4b,#312e81)" },
  { label: "Midnight",     value: "linear-gradient(160deg,#0f172a,#1e293b)" },
] as const;

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

function BackgroundPopover({ currentValue, onSelect }: BgPopoverProps) {
  const isGradient = currentValue.startsWith("linear-gradient") || currentValue.startsWith("radial-gradient");
  const isTransparent = currentValue === "transparent" || currentValue === "";
  const [tab, setTab] = useState<BgTab>(isGradient ? "gradient" : isTransparent ? "transparent" : "solid");
  const [hex, setHex] = useState(isGradient || isTransparent ? "#ffffff" : currentValue);
  const [opacity, setOpacity] = useState(100);

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
        <div className="grid grid-cols-2 gap-1.5">
          {BG_GRADIENTS.map((g) => (
            <button
              key={g.value}
              type="button"
              aria-label={g.label}
              onClick={() => onSelect(g.value)}
              className={cn(
                "h-12 w-full rounded border text-xs font-medium transition-transform hover:scale-105",
                currentValue === g.value ? "border-primary ring-1 ring-primary" : "border-border",
              )}
              style={{ background: g.value }}
            >
              <span className="sr-only">{g.label}</span>
            </button>
          ))}
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

function PaddingPopover({ current, onChange }: PaddingPopoverProps) {
  const [vals, setVals] = useState<PaddingValue>(current);

  function update(key: keyof PaddingValue, raw: string) {
    const n = parseInt(raw, 10);
    const next = { ...vals, [key]: isNaN(n) ? 0 : Math.max(0, n) };
    setVals(next);
    onChange(next);
  }

  const fields: { key: keyof PaddingValue; label: string }[] = [
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
            <label
              htmlFor={`pad-${key}`}
              className="text-[10px] text-muted-foreground"
            >
              {label}
            </label>
            <input
              id={`pad-${key}`}
              type="number"
              min={0}
              value={vals[key]}
              className={cn(
                "h-7 w-full rounded border border-input bg-background px-2 text-xs",
                "focus:outline-none focus:ring-1 focus:ring-ring",
                "[appearance:textfield]",
                "[&::-webkit-inner-spin-button]:appearance-none",
                "[&::-webkit-outer-spin-button]:appearance-none",
              )}
              onChange={(e) => update(key, e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        ))}
      </div>
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
  const [activePopover, setActivePopover] = useState<"bg" | "padding" | null>(null);
  const [popoverPos, setPopoverPos] = useState<Position>({ top: 0, left: 0 });

  const TOOLBAR_HEIGHT = 44;
  const TOOLBAR_MARGIN = 8;

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

  // Animate in when toolbar becomes visible (scale-up from 0.95 + fade)
  useEffect(() => {
    const el = toolbarRef.current;
    if (!el || !position) return;
    // Motion 12's element animate() accepts CSS properties (not transform
    // shorthands). Drive opacity with animate(); drive scale via style + rAF
    // so the 100ms ease-out reads as a combined scale+fade.
    el.style.transformOrigin = "top left";
    el.style.transform = "scale(0.95)";
    el.style.opacity = "0";
    requestAnimationFrame(() => {
      if (!el) return;
      el.style.transition = "transform 100ms ease-out, opacity 100ms ease-out";
      el.style.transform = "scale(1)";
      el.style.opacity = "1";
    });
  }, [position, selectedBlockId]);

  if (!selectedBlockId || !position || isTextEditing) return null;

  const block = blocks.find((b) => b.id === selectedBlockId);
  const config = (
    block?.config && typeof block.config === "object" ? block.config : {}
  ) as Record<string, unknown>;

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
            : 0,
          right: typeof (rawPadding as Record<string, unknown>).right === "number"
            ? ((rawPadding as Record<string, unknown>).right as number)
            : 0,
          bottom: typeof (rawPadding as Record<string, unknown>).bottom === "number"
            ? ((rawPadding as Record<string, unknown>).bottom as number)
            : 0,
          left: typeof (rawPadding as Record<string, unknown>).left === "number"
            ? ((rawPadding as Record<string, unknown>).left as number)
            : 0,
        }
      : { top: 0, right: 0, bottom: 0, left: 0 };

  function openPopover(which: "bg" | "padding", btnEl: HTMLElement) {
    const btnBox = btnEl.getBoundingClientRect();
    // Use viewport coords — popover is position:fixed
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
      style={{ top: position.top, left: position.left }}
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
            updateBlock(selectedBlockId, {
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
            updateBlock(selectedBlockId, {
              config: { ...config, padding },
            });
          }}
        />
      </FloatingPopover>
    </div>
  );
}
