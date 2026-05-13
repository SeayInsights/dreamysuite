"use client";

import React, { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// FloatingPopover — portal-based, position:fixed popover primitive
// ---------------------------------------------------------------------------

interface PopoverProps {
  open: boolean;
  top: number;
  left: number;
  onClose: () => void;
  toolbarRef?: React.RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

export function FloatingPopover({
  open,
  top,
  left,
  onClose,
  toolbarRef,
  children,
}: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        if (toolbarRef?.current?.contains(target)) return;
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, toolbarRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      className={cn(
        "fixed z-[var(--z-popover)] rounded-lg border border-border bg-popover p-3 shadow-lg",
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
// DividerLine — thin vertical separator between toolbar sections
// ---------------------------------------------------------------------------

export function DividerLine() {
  return <div className="h-5 w-px bg-border mx-0.5" aria-hidden />;
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

export function PaletteIcon() {
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

export function PaddingIcon() {
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
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
        rx="0.75"
        fill="currentColor"
        opacity="0.3"
      />
    </svg>
  );
}

export function AnimationIcon() {
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

export function FormatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect
        x="1"
        y="2"
        width="5"
        height="5"
        rx="1"
        fill="currentColor"
        opacity="0.8"
      />
      <rect
        x="8"
        y="2"
        width="5"
        height="5"
        rx="1"
        fill="currentColor"
        opacity="0.4"
      />
      <rect
        x="1"
        y="9"
        width="5"
        height="3"
        rx="0.75"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="8"
        y="9"
        width="5"
        height="3"
        rx="0.75"
        fill="currentColor"
        opacity="0.2"
      />
    </svg>
  );
}

export function ArrangeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect
        x="1"
        y="1"
        width="8"
        height="8"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <rect
        x="5"
        y="5"
        width="8"
        height="8"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="var(--popover)"
      />
    </svg>
  );
}
