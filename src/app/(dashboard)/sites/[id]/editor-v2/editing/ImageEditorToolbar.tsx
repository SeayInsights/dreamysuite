"use client";

/**
 * ImageEditorToolbar
 *
 * Floating toolbar rendered above (or below) the active image in the editor.
 * Contains: Replace, Crop, Fit picker, Filter (stub), Animate (stub), Exit.
 *
 * Also exports the shared ToolbarButton + StubTooltip primitives used internally.
 */

import { useState } from "react";
import { motion } from "motion/react";
import {
  ImageIcon,
  Crop,
  Wand2,
  Sparkles,
  X,
  Maximize,
  Minimize2,
  Square,
  Move,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOOLBAR_HEIGHT = 40;
const TOOLBAR_FLIP_THRESHOLD = TOOLBAR_HEIGHT + 8;

const IMAGE_FIT_OPTIONS = [
  { id: "fill", label: "Fill", icon: Maximize },
  { id: "contain", label: "Fit", icon: Minimize2 },
  { id: "cover", label: "Crop", icon: Square },
  { id: "none", label: "None", icon: Move },
] as const;

// ─── StubTooltip ──────────────────────────────────────────────────────────────

function StubTooltip({ label }: { label: string }) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-[11px] text-white shadow-lg"
    >
      {label}
    </div>
  );
}

// ─── ToolbarButton ────────────────────────────────────────────────────────────

export function ToolbarButton({
  label,
  icon,
  active = false,
  stub = false,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  stub?: boolean;
  onClick?: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        onMouseEnter={() => stub && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => stub && setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={[
          "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active ? "bg-primary text-primary-foreground" : "text-white hover:bg-white/20",
          stub ? "cursor-default opacity-60" : "",
        ].join(" ")}
      >
        {icon}
      </button>
      {stub && showTooltip && <StubTooltip label="Coming soon" />}
    </div>
  );
}

// ─── FloatingToolbar ─────────────────────────────────────────────────────────

export function FloatingToolbar({
  imageRect,
  cropActive,
  replaceActive,
  currentFit,
  onReplace,
  onCropToggle,
  onFitChange,
  onDismiss,
}: {
  imageRect: DOMRect;
  cropActive: boolean;
  replaceActive: boolean;
  currentFit: string;
  onReplace(): void;
  onCropToggle(): void;
  onFitChange(fit: string): void;
  onDismiss(): void;
}) {
  const [showFitMenu, setShowFitMenu] = useState(false);
  const spaceAbove = imageRect.top;
  const showBelow = spaceAbove < TOOLBAR_FLIP_THRESHOLD;

  const toolbarStyle: React.CSSProperties = showBelow
    ? { top: imageRect.top + imageRect.height + 8, left: imageRect.left + imageRect.width / 2, transform: "translateX(-50%)" }
    : { top: imageRect.top - TOOLBAR_HEIGHT - 8, left: imageRect.left + imageRect.width / 2, transform: "translateX(-50%)" };

  return (
    <motion.div
      initial={{ opacity: 0, y: showBelow ? -4 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: showBelow ? -4 : 4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={toolbarStyle}
      className="absolute z-30 flex items-center gap-0.5 rounded-lg px-1.5 py-1 bg-neutral-900/95 shadow-xl ring-1 ring-white/10 backdrop-blur-sm"
    >
      <ToolbarButton
        label="Replace image"
        icon={<ImageIcon className="h-3.5 w-3.5" />}
        active={replaceActive}
        onClick={onReplace}
      />
      <div className="mx-1 h-4 w-px bg-white/20" />
      <ToolbarButton label="Crop image" icon={<Crop className="h-3.5 w-3.5" />} active={cropActive} onClick={onCropToggle} />
      <div className="relative">
        <ToolbarButton
          label="Image fit"
          icon={<Minimize2 className="h-3.5 w-3.5" />}
          active={showFitMenu}
          onClick={() => setShowFitMenu((v) => !v)}
        />
        {showFitMenu && (
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex gap-0.5 rounded-lg px-1 py-1 bg-neutral-900/95 shadow-xl ring-1 ring-white/10 backdrop-blur-sm"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {IMAGE_FIT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <ToolbarButton
                  key={opt.id}
                  label={opt.label}
                  icon={<Icon className="h-3.5 w-3.5" />}
                  active={currentFit === opt.id}
                  onClick={() => { onFitChange(opt.id); setShowFitMenu(false); }}
                />
              );
            })}
          </div>
        )}
      </div>
      <ToolbarButton label="Filter" icon={<Wand2 className="h-3.5 w-3.5" />} stub />
      <ToolbarButton label="Animate" icon={<Sparkles className="h-3.5 w-3.5" />} stub />
      <div className="mx-1 h-4 w-px bg-white/20" />
      <ToolbarButton label="Exit image editor" icon={<X className="h-3.5 w-3.5" />} onClick={onDismiss} />
    </motion.div>
  );
}
