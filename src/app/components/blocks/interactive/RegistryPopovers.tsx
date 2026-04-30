"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

// ── Popover helpers ──────────────────────────────────────────────────────────

export function usePopoverPosition(anchorRect: DOMRect | null): React.CSSProperties {
  if (!anchorRect) return { top: 0, left: 0, transform: "translateX(-50%)" };
  let top = anchorRect.bottom + 8;
  const left = anchorRect.left + anchorRect.width / 2;
  if (top + 200 > window.innerHeight) top = anchorRect.top - 8;
  return { top, left, transform: "translateX(-50%)" };
}

export function usePopoverDismiss(panelRef: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
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
  }, [onClose, panelRef]);
}

// ── URL popover ──────────────────────────────────────────────────────────────

interface UrlPopoverProps {
  anchorRect: DOMRect;
  url: string;
  onSave: (url: string) => void;
  onClose: () => void;
  label?: string;
}

export function UrlPopover({ anchorRect, url, onSave, onClose, label }: UrlPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  usePopoverDismiss(panelRef, onClose);
  const pos = usePopoverPosition(anchorRect);
  const [local, setLocal] = useState(url);

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[9999] w-64 rounded-lg border border-border bg-popover shadow-lg"
      style={pos}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs font-semibold text-foreground">{label ?? "Registry URL"}</p>
      </div>
      <div className="p-3">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">URL</label>
        <input
          type="url"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") { onSave(local); onClose(); } }}
          placeholder="https://..."
          className="mt-0.5 h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
        />
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <button
          type="button"
          onClick={() => { onSave(local); onClose(); }}
          className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Save
        </button>
        {url && (
          <button
            type="button"
            onClick={() => { onSave(""); onClose(); }}
            className="rounded-md border border-border px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            Remove
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── Fund popover (URL + handle) ──────────────────────────────────────────────

interface FundPopoverProps {
  anchorRect: DOMRect;
  platformUrl: string;
  platformHandle: string;
  onSave: (url: string, handle: string) => void;
  onClose: () => void;
}

export function FundPopover({ anchorRect, platformUrl, platformHandle, onSave, onClose }: FundPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  usePopoverDismiss(panelRef, onClose);
  const pos = usePopoverPosition(anchorRect);
  const [localUrl, setLocalUrl] = useState(platformUrl);
  const [localHandle, setLocalHandle] = useState(platformHandle);

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[9999] w-64 rounded-lg border border-border bg-popover shadow-lg"
      style={pos}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs font-semibold text-foreground">Payment Details</p>
      </div>
      <div className="space-y-2 p-3">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">URL</label>
          <input
            type="url"
            value={localUrl}
            onChange={(e) => setLocalUrl(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="https://..."
            className="mt-0.5 h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Handle</label>
          <input
            type="text"
            value={localHandle}
            onChange={(e) => setLocalHandle(e.target.value)}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") { onSave(localUrl, localHandle); onClose(); } }}
            placeholder="@username"
            className="mt-0.5 h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <button
          type="button"
          onClick={() => { onSave(localUrl, localHandle); onClose(); }}
          className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Save
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ── Goal popover ─────────────────────────────────────────────────────────────

interface GoalPopoverProps {
  anchorRect: DOMRect;
  value: number | undefined;
  onSave: (val: number | undefined) => void;
  onClose: () => void;
}

export function GoalPopover({ anchorRect, value, onSave, onClose }: GoalPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  usePopoverDismiss(panelRef, onClose);
  const pos = usePopoverPosition(anchorRect);
  const [local, setLocal] = useState(value?.toString() ?? "");

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[9999] w-56 rounded-lg border border-border bg-popover shadow-lg"
      style={pos}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs font-semibold text-foreground">Fund Goal</p>
      </div>
      <div className="p-3">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Amount ($)</label>
        <input
          type="number"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") { onSave(local ? Number(local) : undefined); onClose(); } }}
          placeholder="500"
          min={0}
          className="mt-0.5 h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
        />
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <button
          type="button"
          onClick={() => { onSave(local ? Number(local) : undefined); onClose(); }}
          className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Save
        </button>
        {value != null && (
          <button
            type="button"
            onClick={() => { onSave(undefined); onClose(); }}
            className="rounded-md border border-border px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            Remove
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
