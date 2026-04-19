"use client";

import { useRef, useEffect, useState, type JSX } from "react";
import { createPortal } from "react-dom";
import { animate } from "motion/mini";
import { cn } from "@/lib/utils";
import { duration, EASING } from "@/lib/motion";
import { useEditorStore } from "@/app/stores/editorStore";
import { getEffectsByCategory, getEffectById } from "@/lib/effects/registry";

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
  { label: "System Sans",   value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "System Serif",  value: "ui-serif, Georgia, serif" },
  { label: "Monospace",     value: "ui-monospace, 'Courier New', monospace" },
  { label: "Inter",         value: "'Inter', sans-serif" },
  { label: "Playfair",      value: "'Playfair Display', Georgia, serif" },
  { label: "Cormorant",     value: "'Cormorant Garamond', Georgia, serif" },
  { label: "Lora",          value: "'Lora', Georgia, serif" },
  { label: "Montserrat",    value: "'Montserrat', sans-serif" },
  { label: "Raleway",       value: "'Raleway', sans-serif" },
  { label: "Nunito",        value: "'Nunito', sans-serif" },
  { label: "Great Vibes",   value: "'Great Vibes', cursive" },
  { label: "Dancing Script", value: "'Dancing Script', cursive" },
  { label: "Libre Baskerville", value: "'Libre Baskerville', serif" },
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
  const fontBtnRef = useRef<HTMLButtonElement>(null);
  const fontMenuRef = useRef<HTMLDivElement>(null);
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const [fontMenuPos, setFontMenuPos] = useState({ top: 0, left: 0 });
  const [activeFont, setActiveFont] = useState<string | null>(null);
  const [selectionColor, setSelectionColor] = useState<string | null>(null);

  useEffect(() => {
    function readColor() {
      try {
        const raw = document.queryCommandValue("foreColor");
        if (!raw) return;
        const m = raw.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (m) {
          const hex = `#${[m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`;
          setSelectionColor(hex);
          if (colorRef.current) colorRef.current.value = hex;
        } else if (raw.startsWith("#")) {
          setSelectionColor(raw);
          if (colorRef.current) colorRef.current.value = raw;
        }
      } catch { /* no selection */ }
    }
    readColor();
    document.addEventListener("selectionchange", readColor);
    return () => document.removeEventListener("selectionchange", readColor);
  }, []);

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

  // Close font menu on outside click
  useEffect(() => {
    if (!fontMenuOpen) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!fontMenuRef.current?.contains(t) && !fontBtnRef.current?.contains(t)) {
        setFontMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [fontMenuOpen]);

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Text format toolbar"
      data-format-toolbar
      className={cn(
        "fixed z-50 flex items-center gap-0.5 rounded-lg border border-border",
        "bg-popover px-2 py-1.5 shadow-lg",
      )}
      style={{ top, left }}
      // Prevent any mouse interaction from stealing focus from the editable
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Font family — custom dropdown portaled to body so z-index is independent */}
      <button
        ref={fontBtnRef}
        type="button"
        aria-label="Font family"
        aria-expanded={fontMenuOpen}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          const rect = fontBtnRef.current?.getBoundingClientRect();
          if (rect) setFontMenuPos({ top: rect.bottom + 4, left: rect.left });
          setFontMenuOpen((v) => !v);
        }}
        className={cn(
          "flex h-7 items-center gap-1 rounded px-1.5 text-xs",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          fontMenuOpen && "bg-accent text-accent-foreground",
        )}
      >
        <span className="max-w-[64px] truncate">
          {activeFont
            ? (FONT_FAMILIES.find((f) => f.value === activeFont)?.label ?? "Font")
            : "Font"}
        </span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden>
          <path d="M1 2.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {fontMenuOpen && typeof document !== "undefined" && createPortal(
        <div
          ref={fontMenuRef}
          data-format-toolbar
          className={cn(
            "fixed z-[200] min-w-[160px] rounded-lg border border-border",
            "bg-popover py-1 shadow-lg",
          )}
          style={{ top: fontMenuPos.top, left: fontMenuPos.left }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {FONT_FAMILIES.map((f) => (
            <button
              key={f.value}
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => {
                setActiveFont(f.value);
                setFontMenuOpen(false);
                onFormat({ type: "fontName", value: f.value });
              }}
              className={cn(
                "flex w-full items-center px-3 py-1.5 text-left text-xs",
                "hover:bg-accent hover:text-accent-foreground",
                activeFont === f.value && "text-primary font-medium",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>,
        document.body,
      )}


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
            <span
              className="mt-0.5 h-1 w-4 rounded-sm"
              style={{ backgroundColor: selectionColor || "currentColor" }}
            />
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

      <Divider />

      <TextEffectDropdown />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Text effect inline dropdown
// ---------------------------------------------------------------------------

const TEXT_EFFECTS = getEffectsByCategory("text");

function TextEffectDropdown() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const selected = settings.effectText ? getEffectById(settings.effectText) : null;

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Text effect"
        aria-expanded={open}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          const rect = btnRef.current?.getBoundingClientRect();
          if (rect) setMenuPos({ top: rect.bottom + 4, left: rect.left });
          setOpen((v) => !v);
        }}
        className={cn(
          "flex h-7 items-center gap-1 rounded px-1.5 text-xs",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          open && "bg-accent text-accent-foreground",
        )}
        title="Text Effect"
      >
        <span className="max-w-[48px] truncate">
          {selected ? selected.name : "Effect"}
        </span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden>
          <path d="M1 2.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          data-format-toolbar
          className={cn(
            "fixed z-[200] min-w-[140px] rounded-lg border border-border",
            "bg-popover py-1 shadow-lg",
          )}
          style={{ top: menuPos.top, left: menuPos.left }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => {
              updateSettings({ effectText: null, effectPreset: null });
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center px-3 py-1.5 text-left text-xs",
              "hover:bg-accent hover:text-accent-foreground",
              !settings.effectText && "text-primary font-medium",
            )}
          >
            None
          </button>
          <div className="mx-2 my-0.5 h-px bg-border" />
          {TEXT_EFFECTS.map((effect) => (
            <button
              key={effect.id}
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => {
                updateSettings({ effectText: effect.id, effectPreset: null });
                setOpen(false);
              }}
              title={effect.description}
              className={cn(
                "flex w-full items-center px-3 py-1.5 text-left text-xs",
                "hover:bg-accent hover:text-accent-foreground",
                settings.effectText === effect.id && "text-primary font-medium",
              )}
            >
              {effect.name}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
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
