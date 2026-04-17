"use client";

import { useRef, useEffect, type JSX } from "react";
import { animate } from "motion/mini";
import { cn } from "@/lib/utils";
import { duration, EASING } from "@/lib/motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FormatCommand =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "underline" }
  | { type: "fontName"; value: string }
  | { type: "fontSize"; value: string }
  | { type: "foreColor"; value: string }
  | { type: "justifyLeft" }
  | { type: "justifyCenter" }
  | { type: "justifyRight" };

export interface FloatingFormatToolbarProps {
  top: number;
  left: number;
  onFormat: (cmd: FormatCommand) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT_FAMILIES = [
  { label: "Sans-serif", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "ui-serif, Georgia, serif" },
  { label: "Mono", value: "ui-monospace, monospace" },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ToolbarButtonProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ToolbarButton({ label, active, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => {
        // Prevent the contentEditable losing focus on click
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-xs transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-border" />;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * FloatingFormatToolbar
 *
 * Rendered as position:fixed so `top`/`left` are viewport-relative.
 * All interactive elements use onMouseDown + e.preventDefault() to prevent the
 * contentEditable element from losing focus before the execCommand fires.
 *
 * Format commands are forwarded via `onFormat` so TextEditor can call
 * document.execCommand in response — keeping side-effects out of this component.
 */
export function FloatingFormatToolbar({
  top,
  left,
  onFormat,
}: FloatingFormatToolbarProps): JSX.Element {
  const colorRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const pickerOpenRef = useRef(false);

  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    el.style.opacity = "0";
    animate(
      el,
      { opacity: [0, 1], scale: [0.95, 1] },
      { duration: duration("toolbarPop") / 1000, ease: EASING.enter },
    ).finished.then(() => { if (toolbarRef.current) toolbarRef.current.style.opacity = "1"; });
  }, []);

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Text format toolbar"
      className={cn(
        "fixed z-50 flex items-center gap-0.5 rounded-lg border border-border",
        "bg-popover px-2 py-1.5 shadow-lg",
      )}
      style={{ top, left }}
      // Prevent any mouse interaction from stealing focus from the editable
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Font family */}
      <select
        title="Font family"
        aria-label="Font family"
        className={cn(
          "h-7 rounded border-0 bg-transparent px-1 text-xs",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "cursor-pointer hover:bg-accent",
        )}
        defaultValue=""
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          if (e.target.value) {
            onFormat({ type: "fontName", value: e.target.value });
          }
        }}
      >
        <option value="" disabled>
          Font
        </option>
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <Divider />

      {/* Font size */}
      <input
        type="number"
        min={8}
        max={96}
        placeholder="16"
        aria-label="Font size"
        title="Font size"
        className={cn(
          "h-7 w-12 rounded border-0 bg-transparent px-1 text-center text-xs",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "hover:bg-accent",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        )}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          const v = e.target.value.trim();
          if (v) onFormat({ type: "fontSize", value: v });
        }}
      />

      <Divider />

      {/* Bold */}
      <ToolbarButton label="Bold (Cmd+B)" onClick={() => onFormat({ type: "bold" })}>
        <strong>B</strong>
      </ToolbarButton>

      {/* Italic */}
      <ToolbarButton label="Italic (Cmd+I)" onClick={() => onFormat({ type: "italic" })}>
        <em>I</em>
      </ToolbarButton>

      {/* Underline */}
      <ToolbarButton label="Underline (Cmd+U)" onClick={() => onFormat({ type: "underline" })}>
        <span className="underline">U</span>
      </ToolbarButton>

      <Divider />

      {/* Text color */}
      <div className="relative">
        <ToolbarButton
          label="Text color"
          onClick={() => {
            if (pickerOpenRef.current) {
              pickerOpenRef.current = false;
              colorRef.current?.blur();
            } else {
              pickerOpenRef.current = true;
              colorRef.current?.click();
            }
          }}
        >
          {/* A-with-color-bar icon */}
          <span className="flex flex-col items-center leading-none">
            <span className="text-xs font-semibold">A</span>
            <span className="mt-0.5 h-1 w-4 rounded-sm bg-current" />
          </span>
        </ToolbarButton>
        {/* pointer-events-none so user clicks fall through to the button above;
            the picker is opened programmatically via colorRef.current?.click() */}
        <input
          ref={colorRef}
          type="color"
          aria-label="Pick text color"
          className="absolute inset-0 h-full w-full opacity-0 pointer-events-none"
          onChange={(e) => {
            pickerOpenRef.current = false;
            onFormat({ type: "foreColor", value: e.target.value });
          }}
        />
      </div>

      <Divider />

      {/* Alignment */}
      <ToolbarButton
        label="Align left"
        onClick={() => onFormat({ type: "justifyLeft" })}
      >
        <AlignLeftIcon />
      </ToolbarButton>

      <ToolbarButton
        label="Align center"
        onClick={() => onFormat({ type: "justifyCenter" })}
      >
        <AlignCenterIcon />
      </ToolbarButton>

      <ToolbarButton
        label="Align right"
        onClick={() => onFormat({ type: "justifyRight" })}
      >
        <AlignRightIcon />
      </ToolbarButton>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Micro icons (inline SVG — avoids a runtime lucide import for 3 tiny icons)
// ---------------------------------------------------------------------------

function AlignLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="5.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="9" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="12.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="3" y="5.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="9" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="3" y="12.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="5" y="5.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="9" width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="5" y="12.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  );
}
