"use client";

import { useRef, useEffect, useState, useCallback, type JSX } from "react";
import { createPortal } from "react-dom";
import { animate } from "motion/mini";
import { ImageIcon, Crop, Wand2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, EASING } from "@/lib/motion";
import { TRANSITIONS } from "@/lib/transitions";
import { type FormatCommand } from "./FloatingFormatToolbar";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SWIPE_DISMISS_THRESHOLD = 60; // px downward drag to dismiss
const SHEET_HEIGHT_APPROX = 190;    // estimated sheet height for auto-pan

const FONT_FAMILIES = [
  { label: "Sans", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "ui-serif, Georgia, serif" },
  { label: "Mono", value: "ui-monospace, monospace" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BottomSheetToolbarProps {
  mode: "text" | "image";
  // Text mode
  onFormat?: (cmd: FormatCommand) => void;
  // Image mode
  onReplace?: () => void;
  onCropToggle?: () => void;
  cropActive?: boolean;
  // Common
  onDismiss?: () => void;
  /** Viewport-relative rect of the selected element — used for auto-pan */
  blockRect?: DOMRect;
  /** Scrollable canvas container — used for auto-pan */
  containerRef?: React.RefObject<HTMLElement | null>;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SheetButton({
  label,
  active,
  stub,
  children,
  onAction,
}: {
  label: string;
  active?: boolean;
  stub?: boolean;
  children: React.ReactNode;
  onAction?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={stub ? "Coming soon" : label}
      // onPointerDown fires for both mouse and touch; preventDefault keeps
      // focus on contentEditable; the action fires immediately (no click delay)
      onPointerDown={(e) => {
        e.preventDefault();
        if (!stub) onAction?.();
      }}
      className={cn(
        "flex h-11 min-w-[44px] flex-shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground active:scale-95",
        active && "bg-accent text-accent-foreground",
        stub && "cursor-default opacity-50",
      )}
    >
      {children}
    </button>
  );
}

function SheetDivider() {
  return <div className="mx-1 h-6 w-px flex-shrink-0 bg-border" />;
}

// ---------------------------------------------------------------------------
// Text controls
// ---------------------------------------------------------------------------

function TextControls({
  onFormat,
  onDismiss,
}: {
  onFormat: (cmd: FormatCommand) => void;
  onDismiss?: () => void;
}) {
  const colorRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Font family — tapping native select will cause blur+commit, which is acceptable */}
      <select
        title="Font family"
        aria-label="Font family"
        className="h-11 min-w-[72px] flex-shrink-0 rounded-lg border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onFormat({ type: "fontName", value: e.target.value });
        }}
      >
        <option value="" disabled>Font</option>
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>

      {/* Font size */}
      <input
        type="number"
        min={8}
        max={96}
        placeholder="16"
        aria-label="Font size"
        className={cn(
          "h-11 w-16 flex-shrink-0 rounded-lg border border-border bg-background px-2 text-center text-sm",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        )}
        onChange={(e) => {
          const v = e.target.value.trim();
          if (v) onFormat({ type: "fontSize", value: v });
        }}
      />

      <SheetDivider />

      <SheetButton label="Bold" onAction={() => onFormat({ type: "bold" })}>
        <strong>B</strong>
      </SheetButton>
      <SheetButton label="Italic" onAction={() => onFormat({ type: "italic" })}>
        <em>I</em>
      </SheetButton>
      <SheetButton label="Underline" onAction={() => onFormat({ type: "underline" })}>
        <span className="underline">U</span>
      </SheetButton>

      <SheetDivider />

      {/* Color */}
      <div className="relative flex-shrink-0">
        <SheetButton label="Text color" onAction={() => colorRef.current?.click()}>
          <span className="flex flex-col items-center leading-none">
            <span className="text-sm font-semibold">A</span>
            <span className="mt-0.5 h-1 w-5 rounded-sm bg-current" />
          </span>
        </SheetButton>
        <input
          ref={colorRef}
          type="color"
          aria-label="Pick text color"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={(e) => onFormat({ type: "foreColor", value: e.target.value })}
        />
      </div>

      <SheetDivider />

      <SheetButton label="Align left" onAction={() => onFormat({ type: "justifyLeft" })}>
        <AlignLeftIcon />
      </SheetButton>
      <SheetButton label="Align center" onAction={() => onFormat({ type: "justifyCenter" })}>
        <AlignCenterIcon />
      </SheetButton>
      <SheetButton label="Align right" onAction={() => onFormat({ type: "justifyRight" })}>
        <AlignRightIcon />
      </SheetButton>

      {onDismiss && (
        <>
          <SheetDivider />
          <SheetButton label="Close toolbar" onAction={onDismiss}>
            <X className="h-4 w-4" />
          </SheetButton>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Image controls
// ---------------------------------------------------------------------------

function ImageControls({
  cropActive,
  onReplace,
  onCropToggle,
  onDismiss,
}: {
  cropActive: boolean;
  onReplace?: () => void;
  onCropToggle?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <>
      <SheetButton label="Replace image" onAction={onReplace}>
        <ImageIcon className="h-4 w-4" />
        <span>Replace</span>
      </SheetButton>
      <SheetDivider />
      <SheetButton label="Crop image" active={cropActive} onAction={onCropToggle}>
        <Crop className="h-4 w-4" />
        <span>Crop</span>
      </SheetButton>
      <SheetButton label="Filter" stub>
        <Wand2 className="h-4 w-4" />
        <span>Filter</span>
      </SheetButton>
      <SheetButton label="Animate" stub>
        <Sparkles className="h-4 w-4" />
        <span>Animate</span>
      </SheetButton>
      {onDismiss && (
        <>
          <SheetDivider />
          <SheetButton label="Exit image editor" onAction={onDismiss}>
            <X className="h-4 w-4" />
          </SheetButton>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * BottomSheetToolbar
 *
 * Mobile-first toolbar that slides up from the bottom of the viewport.
 * Portals to document.body so it escapes any overflow clipping.
 *
 * Swipe-down (≥60px) on the drag pill dismisses the sheet.
 * Auto-pans the canvas container if the selected element is obscured by the sheet.
 */
export function BottomSheetToolbar({
  mode,
  onFormat,
  onReplace,
  onCropToggle,
  cropActive = false,
  onDismiss,
  blockRect,
  containerRef,
}: BottomSheetToolbarProps): JSX.Element | null {
  const [translateY, setTranslateY] = useState(0);
  const [entered, setEntered] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const swipeStartY = useRef<number | null>(null);
  const isAnimating = translateY === 0;

  // Auto-pan: scroll canvas up if the selected block will be hidden behind sheet
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || !blockRect) return;
    const sheetClearance = SHEET_HEIGHT_APPROX + 16;
    const safeBottom = window.innerHeight - sheetClearance;
    if (blockRect.bottom > safeBottom) {
      container.scrollBy({ top: blockRect.bottom - safeBottom + 8, behavior: "smooth" });
    }
  }, [blockRect, containerRef]);

  // Entry slide-up animation on mount.
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    animate(
      el,
      { y: ["100%", "0%"] },
      { duration: duration("inspectorSlide") / 1000, ease: EASING.enter },
    ).finished.then(() => {
      if (sheetRef.current) sheetRef.current.style.transform = "translateY(0px)";
      setEntered(true);
    });
  }, []);

  // Swipe-down dismiss via pointer events on the drag pill
  const handlePillPointerDown = useCallback((e: React.PointerEvent) => {
    swipeStartY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePillPointerMove = useCallback((e: React.PointerEvent) => {
    if (swipeStartY.current === null) return;
    const dy = e.clientY - swipeStartY.current;
    if (dy > 0) setTranslateY(dy);
  }, []);

  const handlePillPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (swipeStartY.current === null) return;
      const dy = e.clientY - swipeStartY.current;
      swipeStartY.current = null;
      if (dy >= SWIPE_DISMISS_THRESHOLD) {
        onDismiss?.();
      } else {
        setTranslateY(0);
      }
    },
    [onDismiss],
  );

  const sheet = (
    <div
      ref={sheetRef}
      role="toolbar"
      aria-label={mode === "text" ? "Text format toolbar" : "Image toolbar"}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[65]",
        "rounded-t-2xl border-t border-border bg-popover shadow-2xl",
      )}
      style={entered ? {
        transform: `translateY(${translateY}px)`,
        transition: isAnimating ? TRANSITIONS.bottomSheet : "none",
      } : undefined}
      // Prevent any interaction here from stealing focus (desktop mouse events)
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Drag pill — pointer events for swipe-down */}
      <div
        className="flex touch-none select-none justify-center pb-1 pt-2.5"
        style={{ cursor: "grab", touchAction: "none" }}
        onPointerDown={handlePillPointerDown}
        onPointerMove={handlePillPointerMove}
        onPointerUp={handlePillPointerUp}
      >
        <div className="h-1 w-10 rounded-full bg-muted-foreground/40" />
      </div>

      {/* Controls row — horizontally scrollable */}
      <div
        className="flex items-center gap-1 overflow-x-auto px-3 pb-5 pt-1"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {mode === "text" && onFormat && (
          <TextControls onFormat={onFormat} onDismiss={onDismiss} />
        )}
        {mode === "image" && (
          <ImageControls
            cropActive={cropActive}
            onReplace={onReplace}
            onCropToggle={onCropToggle}
            onDismiss={onDismiss}
          />
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(sheet, document.body);
}

// ---------------------------------------------------------------------------
// Micro icons
// ---------------------------------------------------------------------------

function AlignLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="5.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="9" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="12.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="3" y="5.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="9" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="3" y="12.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="5" y="5.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="9" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="5" y="12.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  );
}
