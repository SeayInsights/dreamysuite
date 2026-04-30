"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { LinkItem } from "./ContentCardTypes";

export interface LinkPopoverProps {
  anchorRect: DOMRect;
  existingLink?: LinkItem;
  onSave: (link: LinkItem) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function LinkPopover({ anchorRect, existingLink, onSave, onDelete, onClose }: LinkPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState(existingLink?.label ?? "");
  const [url, setUrl] = useState(existingLink?.url ?? "");

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", handleKey);
    const timer = setTimeout(() => document.addEventListener("mousedown", handleClick), 0);
    return () => {
      document.removeEventListener("keydown", handleKey);
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const top = anchorRect.bottom + 8;
  const left = anchorRect.left + anchorRect.width / 2;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[9999] w-64 rounded-lg border border-border bg-popover shadow-lg"
      style={{ top, left, transform: "translateX(-50%)" }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs font-semibold text-foreground">{existingLink ? "Edit Button" : "Add Button"}</p>
      </div>
      <div className="space-y-2 p-3">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Get Directions"
            className="mt-0.5 h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="https://…"
            className="mt-0.5 h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <button
          type="button"
          onClick={() => { if (label && url) onSave({ label, url }); }}
          className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Save
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-border px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            Delete
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
