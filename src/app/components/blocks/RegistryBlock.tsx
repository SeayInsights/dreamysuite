"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { blockSectionStyle, editableProps, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";
import { useEditorStore } from "@/app/stores/editorStore";

interface RegistryItem {
  id: string;
  type: "store" | "fund";
  store?: string;
  customName?: string;
  logoUrl?: string;
  url?: string;
  message?: string;
  fundTitle?: string;
  fundDescription?: string;
  fundGoal?: number;
  platform?: "paypal" | "venmo" | "zelle" | "cashapp" | "other";
  platformUrl?: string;
  platformHandle?: string;
}

interface Block { id: string; type: string; [key: string]: unknown }

// ── Preset store logos (inline SVG data URIs for reliability) ─────────────────

const STORE_LOGOS: Record<string, string> = {
  "Amazon": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 30'%3E%3Ctext x='50' y='22' text-anchor='middle' font-family='Arial,sans-serif' font-size='18' font-weight='bold' fill='%23232F3E'%3Eamazon%3C/text%3E%3Cpath d='M28 24c12-8 28-12 44-8' fill='none' stroke='%23FF9900' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E",
  "Target": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='18' fill='%23CC0000'/%3E%3Ccircle cx='20' cy='20' r='12' fill='white'/%3E%3Ccircle cx='20' cy='20' r='6' fill='%23CC0000'/%3E%3C/svg%3E",
  "Crate & Barrel": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 30'%3E%3Ctext x='60' y='20' text-anchor='middle' font-family='Georgia,serif' font-size='14' fill='%23333'%3ECrate %26 Barrel%3C/text%3E%3C/svg%3E",
  "Williams Sonoma": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 30'%3E%3Ctext x='70' y='20' text-anchor='middle' font-family='Georgia,serif' font-size='13' fill='%23333'%3EWilliams Sonoma%3C/text%3E%3C/svg%3E",
  "Bed Bath & Beyond": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 30'%3E%3Ctext x='75' y='20' text-anchor='middle' font-family='Arial,sans-serif' font-size='12' font-weight='bold' fill='%230055A6'%3EBed Bath %26 Beyond%3C/text%3E%3C/svg%3E",
  "Pottery Barn": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 30'%3E%3Ctext x='60' y='20' text-anchor='middle' font-family='Georgia,serif' font-size='14' fill='%23333'%3EPottery Barn%3C/text%3E%3C/svg%3E",
  "Sur La Table": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 30'%3E%3Ctext x='60' y='20' text-anchor='middle' font-family='Georgia,serif' font-size='14' fill='%23333'%3ESur La Table%3C/text%3E%3C/svg%3E",
  "Zola": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'%3E%3Ctext x='30' y='22' text-anchor='middle' font-family='Arial,sans-serif' font-size='20' font-weight='bold' fill='%230B4F6C'%3EZola%3C/text%3E%3C/svg%3E",
  "MyRegistry": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 30'%3E%3Ctext x='50' y='20' text-anchor='middle' font-family='Arial,sans-serif' font-size='14' font-weight='bold' fill='%23E8533F'%3EMyRegistry%3C/text%3E%3C/svg%3E",
  "Blueprint Registry": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 30'%3E%3Ctext x='70' y='20' text-anchor='middle' font-family='Arial,sans-serif' font-size='13' font-weight='bold' fill='%232B6CB0'%3EBlueprint Registry%3C/text%3E%3C/svg%3E",
  "Babylist": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 30'%3E%3Ctext x='40' y='20' text-anchor='middle' font-family='Arial,sans-serif' font-size='15' font-weight='bold' fill='%23F06595'%3EBabylist%3C/text%3E%3C/svg%3E",
  "REI": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 30'%3E%3Ctext x='25' y='22' text-anchor='middle' font-family='Arial,sans-serif' font-size='20' font-weight='bold' fill='%23333'%3EREI%3C/text%3E%3C/svg%3E",
};

const PRESET_STORES = [
  "Amazon", "Target", "Crate & Barrel", "Williams Sonoma",
  "Bed Bath & Beyond", "Pottery Barn", "Sur La Table", "Zola",
  "MyRegistry", "Blueprint Registry", "Babylist", "REI",
] as const;

const PLATFORM_LABELS: Record<string, string> = {
  paypal: "PayPal",
  venmo: "Venmo",
  zelle: "Zelle",
  cashapp: "Cash App",
  other: "Other",
};

const PLATFORM_ICONS: Record<string, string> = {
  paypal: "$",
  venmo: "V",
  zelle: "Z",
  cashapp: "$",
  other: "...",
};

// ── Popover helpers ──────────────────────────────────────────────────────────

function usePopoverPosition(anchorRect: DOMRect | null): React.CSSProperties {
  if (!anchorRect) return { top: 0, left: 0, transform: "translateX(-50%)" };
  let top = anchorRect.bottom + 8;
  const left = anchorRect.left + anchorRect.width / 2;
  if (top + 200 > window.innerHeight) top = anchorRect.top - 8;
  return { top, left, transform: "translateX(-50%)" };
}

function usePopoverDismiss(panelRef: React.RefObject<HTMLElement | null>, onClose: () => void) {
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

function UrlPopover({ anchorRect, url, onSave, onClose, label }: UrlPopoverProps) {
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

function FundPopover({ anchorRect, platformUrl, platformHandle, onSave, onClose }: FundPopoverProps) {
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

function GoalPopover({ anchorRect, value, onSave, onClose }: GoalPopoverProps) {
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

// ── Picker modal ─────────────────────────────────────────────────────────────

interface PickerModalProps {
  onAddStore: (store: string) => void;
  onAddCustomStore: () => void;
  onAddFund: (platform: RegistryItem["platform"]) => void;
  onClose: () => void;
}

function PickerModal({ onAddStore, onAddCustomStore, onAddFund, onClose }: PickerModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  usePopoverDismiss(panelRef, onClose);
  const [tab, setTab] = useState<"registry" | "fund">("registry");

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30">
      <div
        ref={panelRef}
        className="w-[420px] max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-popover shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-border">
          {(["registry", "fund"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                tab === t
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "registry" ? "Add Registry" : "Add Fund"}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === "registry" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
              {PRESET_STORES.map((store) => (
                <button
                  key={store}
                  type="button"
                  onClick={() => { onAddStore(store); onClose(); }}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-xs transition-colors hover:border-primary hover:bg-accent/30"
                >
                  <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img
                      src={STORE_LOGOS[store]}
                      alt={store}
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  <span className="text-center leading-tight">{store}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => { onAddCustomStore(); onClose(); }}
                className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-border p-3 text-xs transition-colors hover:border-primary hover:bg-accent/30"
              >
                <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", color: "var(--muted)" }}>
                  +
                </div>
                <span className="text-center leading-tight text-muted-foreground">Custom</span>
              </button>
            </div>
          )}

          {tab === "fund" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
              {(["paypal", "venmo", "zelle", "cashapp", "other"] as const).map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => { onAddFund(platform); onClose(); }}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-xs transition-colors hover:border-primary hover:bg-accent/30"
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "var(--accent, #B8921A)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.1rem", fontWeight: 700,
                  }}>
                    {PLATFORM_ICONS[platform]}
                  </div>
                  <span className="text-center leading-tight">{PLATFORM_LABELS[platform]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Add button (dotted border) ───────────────────────────────────────────────

function AddItemButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      style={{ minHeight: "160px", width: "100%", background: "transparent", cursor: "pointer" }}
    >
      <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>+</span>
    </button>
  );
}

// ── Generic gift icon for unknown stores ─────────────────────────────────────

function GiftIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)" }}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <rect x="5" y="12" width="14" height="8" rx="1" />
      <line x1="12" y1="8" x2="12" y2="20" />
      <path d="M12 8C12 8 12 4 9 4C7 4 6 5.5 7 7C8 8.5 12 8 12 8Z" />
      <path d="M12 8C12 8 12 4 15 4C17 4 18 5.5 17 7C16 8.5 12 8 12 8Z" />
    </svg>
  );
}

// ── Store card ───────────────────────────────────────────────────────────────

interface StoreCardProps {
  item: RegistryItem;
  index: number;
  editing: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onUpdate: (id: string, patch: Partial<RegistryItem>) => void;
  onDelete: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
  onOpenPopover: (type: "url", itemId: string, rect: DOMRect) => void;
}

function StoreCard({
  item, index, editing, isDragging, isDropTarget,
  onUpdate, onDelete, onDragStart, onDragOver, onDrop, onDragEnd, onOpenPopover,
}: StoreCardProps) {
  const storeName = item.store || item.customName || "Registry";
  const logoSrc = item.logoUrl || (item.store ? STORE_LOGOS[item.store] : undefined);
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div
      className="group/card"
      style={{
        background: "var(--bg, #fff)",
        border: isDropTarget ? "2px dashed var(--accent, #B8921A)" : "1px solid var(--border)",
        borderRadius: "12px",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
        position: "relative",
        opacity: isDragging ? 0.4 : 1,
        transition: "opacity 0.15s, border-color 0.15s",
        textAlign: "center",
      }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e, index); }}
      onDrop={(e) => { e.preventDefault(); onDrop(index); }}
    >
      {editing && (
        <>
          <div
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnd={onDragEnd}
            className="absolute left-2 top-3 hidden cursor-grab items-center justify-center text-muted-foreground group-hover/card:flex"
            style={{ fontSize: "1rem", userSelect: "none", lineHeight: 1 }}
            title="Drag to reorder"
          >
            ⠿
          </div>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/card:flex"
            title="Delete"
          >
            ✕
          </button>
        </>
      )}

      <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {logoSrc && !logoFailed ? (
          <img
            src={logoSrc}
            alt={storeName}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <GiftIcon />
        )}
      </div>

      <p style={{ fontWeight: 600, fontSize: "0.95rem", margin: 0 }}>{storeName}</p>

      {(item.message || editing) && (
        <div
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={(e) => onUpdate(item.id, { message: e.currentTarget.textContent ?? "" })}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); } e.stopPropagation(); }}
          style={{
            fontSize: "0.82rem",
            color: "var(--body-color)",
            lineHeight: 1.5,
            outline: "none",
            minHeight: "1.3em",
            borderBottom: editing ? "1px dashed var(--border)" : "none",
            cursor: editing ? "text" : "default",
            width: "100%",
          }}
        >
          {item.message || (editing ? <span style={{ color: "var(--muted)", opacity: 0.5, fontStyle: "italic" }}>+ Add a message</span> : null)}
        </div>
      )}

      {editing ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            onOpenPopover("url", item.id, rect);
          }}
          style={{
            marginTop: "auto",
            padding: "0.5rem 1.25rem",
            borderRadius: "6px",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            background: item.url ? "var(--accent, #B8921A)" : "transparent",
            color: item.url ? "#fff" : "var(--accent, #B8921A)",
            border: item.url ? "none" : "1px solid var(--accent, #B8921A)",
          }}
          className="hover:opacity-80"
        >
          {item.url ? "View Registry" : "Set URL"}
        </button>
      ) : (
        item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: "auto",
              display: "inline-block",
              padding: "0.5rem 1.25rem",
              borderRadius: "6px",
              fontSize: "0.82rem",
              fontWeight: 600,
              background: "var(--accent, #B8921A)",
              color: "#fff",
              textDecoration: "none",
            }}
            className="hover:opacity-80"
          >
            View Registry
          </a>
        )
      )}
    </div>
  );
}

// ── Fund card ────────────────────────────────────────────────────────────────

interface FundCardProps {
  item: RegistryItem;
  index: number;
  editing: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onUpdate: (id: string, patch: Partial<RegistryItem>) => void;
  onDelete: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
  onOpenPopover: (type: "fund" | "goal", itemId: string, rect: DOMRect) => void;
}

function FundCard({
  item, index, editing, isDragging, isDropTarget,
  onUpdate, onDelete, onDragStart, onDragOver, onDrop, onDragEnd, onOpenPopover,
}: FundCardProps) {
  const platformName = item.platform ? PLATFORM_LABELS[item.platform] : "Fund";

  return (
    <div
      className="group/card"
      style={{
        background: "var(--bg, #fff)",
        border: isDropTarget ? "2px dashed var(--accent, #B8921A)" : "1px solid var(--border)",
        borderRadius: "12px",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
        position: "relative",
        opacity: isDragging ? 0.4 : 1,
        transition: "opacity 0.15s, border-color 0.15s",
        textAlign: "center",
      }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e, index); }}
      onDrop={(e) => { e.preventDefault(); onDrop(index); }}
    >
      {editing && (
        <>
          <div
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnd={onDragEnd}
            className="absolute left-2 top-3 hidden cursor-grab items-center justify-center text-muted-foreground group-hover/card:flex"
            style={{ fontSize: "1rem", userSelect: "none", lineHeight: 1 }}
            title="Drag to reorder"
          >
            ⠿
          </div>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/card:flex"
            title="Delete"
          >
            ✕
          </button>
        </>
      )}

      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "var(--accent, #B8921A)", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.25rem", fontWeight: 700,
      }}>
        {item.platform ? PLATFORM_ICONS[item.platform] : "$"}
      </div>

      <div
        contentEditable={editing}
        suppressContentEditableWarning
        onBlur={(e) => onUpdate(item.id, { fundTitle: e.currentTarget.textContent ?? "" })}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); } e.stopPropagation(); }}
        style={{
          fontWeight: 600, fontSize: "0.95rem", outline: "none", width: "100%",
          borderBottom: editing ? "1px dashed var(--border)" : "none",
          cursor: editing ? "text" : "default",
          minHeight: "1.2em",
        }}
      >
        {item.fundTitle || (editing ? "" : <span style={{ color: "var(--muted)", fontStyle: "italic" }}>{platformName} Fund</span>)}
      </div>

      {(item.fundDescription || editing) && (
        <div
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={(e) => onUpdate(item.id, { fundDescription: e.currentTarget.textContent ?? "" })}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); } e.stopPropagation(); }}
          style={{
            fontSize: "0.82rem", color: "var(--body-color)", lineHeight: 1.5,
            outline: "none", width: "100%", minHeight: "1.3em",
            borderBottom: editing ? "1px dashed var(--border)" : "none",
            cursor: editing ? "text" : "default",
          }}
        >
          {item.fundDescription || (editing ? <span style={{ color: "var(--muted)", opacity: 0.5, fontStyle: "italic" }}>+ Add description</span> : null)}
        </div>
      )}

      {item.platformHandle && !editing && (
        <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0 }}>
          {item.platformHandle}
        </p>
      )}

      {item.fundGoal != null && (
        <p style={{ fontSize: "0.78rem", color: "var(--accent, #B8921A)", fontWeight: 600, margin: 0 }}>
          Goal: ${item.fundGoal.toLocaleString()}
        </p>
      )}

      {editing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            onOpenPopover("goal", item.id, rect);
          }}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            fontSize: "0.72rem", color: "var(--muted)",
          }}
          className="hover:opacity-70"
        >
          {item.fundGoal != null ? "Edit goal" : <span style={{ fontStyle: "italic", opacity: 0.5 }}>+ Add goal</span>}
        </button>
      )}

      {editing ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            onOpenPopover("fund", item.id, rect);
          }}
          style={{
            marginTop: "auto",
            padding: "0.5rem 1.25rem",
            borderRadius: "6px",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            background: item.platformUrl ? "var(--accent, #B8921A)" : "transparent",
            color: item.platformUrl ? "#fff" : "var(--accent, #B8921A)",
            border: item.platformUrl ? "none" : "1px solid var(--accent, #B8921A)",
          }}
          className="hover:opacity-80"
        >
          {item.platformUrl ? "Contribute" : "Set Link"}
        </button>
      ) : (
        item.platformUrl && (
          <a
            href={item.platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: "auto",
              display: "inline-block",
              padding: "0.5rem 1.25rem",
              borderRadius: "6px",
              fontSize: "0.82rem",
              fontWeight: 600,
              background: "var(--accent, #B8921A)",
              color: "#fff",
              textDecoration: "none",
            }}
            className="hover:opacity-80"
          >
            Contribute
          </a>
        )
      )}
    </div>
  );
}

// ── Popover state ────────────────────────────────────────────────────────────

type PopoverType = "url" | "fund" | "goal";
interface PopoverState {
  type: PopoverType;
  itemId: string;
  rect: DOMRect;
}

// ── Main RegistryBlock ───────────────────────────────────────────────────────

export function RegistryBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as "desktop" | "tablet" | "mobile";
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Registry");
  const subheading = String(cfg.subheading ?? "");
  const displayMode = String(cfg.displayMode ?? "grid");
  const items: RegistryItem[] = Array.isArray(cfg.items)
    ? (cfg.items as RegistryItem[]).filter((i) => i && typeof i === "object" && typeof i.id === "string")
    : [];

  const fullPreview = useEditorStore((s) => s.fullPreview);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const editing = !fullPreview;

  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // ── Item mutation helpers ──────────────────────────────────────────────────

  const addStoreItem = useCallback((store: string) => {
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? (currentCfg.items as RegistryItem[]) : [];
    const newItem: RegistryItem = {
      id: crypto.randomUUID(),
      type: "store",
      store,
      logoUrl: STORE_LOGOS[store],
    };
    updateBlock(block.id, {
      config: { ...currentCfg, items: [...currentItems, newItem] },
    });
  }, [block.id, block.config, updateBlock]);

  const addCustomStoreItem = useCallback(() => {
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? (currentCfg.items as RegistryItem[]) : [];
    const newItem: RegistryItem = {
      id: crypto.randomUUID(),
      type: "store",
      customName: "Custom Registry",
    };
    updateBlock(block.id, {
      config: { ...currentCfg, items: [...currentItems, newItem] },
    });
  }, [block.id, block.config, updateBlock]);

  const addFundItem = useCallback((platform: RegistryItem["platform"]) => {
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? (currentCfg.items as RegistryItem[]) : [];
    const newItem: RegistryItem = {
      id: crypto.randomUUID(),
      type: "fund",
      platform,
      fundTitle: "",
    };
    updateBlock(block.id, {
      config: { ...currentCfg, items: [...currentItems, newItem] },
    });
  }, [block.id, block.config, updateBlock]);

  const deleteItem = useCallback((id: string) => {
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? (currentCfg.items as RegistryItem[]) : [];
    updateBlock(block.id, {
      config: { ...currentCfg, items: currentItems.filter((i) => i.id !== id) },
    });
  }, [block.id, block.config, updateBlock]);

  const updateItem = useCallback((id: string, patch: Partial<RegistryItem>) => {
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? (currentCfg.items as RegistryItem[]) : [];
    updateBlock(block.id, {
      config: {
        ...currentCfg,
        items: currentItems.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      },
    });
  }, [block.id, block.config, updateBlock]);

  // ── Drag-and-drop ─────────────────────────────────────────────────────────

  const handleDragStart = useCallback((index: number) => { setDragIndex(index); }, []);
  const handleDragOver = useCallback((_e: React.DragEvent, index: number) => { setDropIndex(index); }, []);

  const handleDrop = useCallback((index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDropIndex(null);
      return;
    }
    const currentCfg = parseCfg(block.config);
    const currentItems = Array.isArray(currentCfg.items) ? [...(currentCfg.items as RegistryItem[])] : [];
    const [moved] = currentItems.splice(dragIndex, 1);
    currentItems.splice(index, 0, moved);
    updateBlock(block.id, { config: { ...currentCfg, items: currentItems } });
    setDragIndex(null);
    setDropIndex(null);
  }, [dragIndex, block.id, block.config, updateBlock]);

  const handleDragEnd = useCallback(() => { setDragIndex(null); setDropIndex(null); }, []);

  const handleOpenPopover = useCallback((type: PopoverType, itemId: string, rect: DOMRect) => {
    setPopover({ type, itemId, rect });
  }, []);
  const handleClosePopover = useCallback(() => setPopover(null), []);

  const activeItem = popover ? items.find((i) => i.id === popover.itemId) : null;

  const gridStyle: React.CSSProperties = displayMode === "list"
    ? { display: "grid", gridTemplateColumns: "1fr", gap: "1rem", maxWidth: "600px", margin: "2rem auto 0" }
    : { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem", maxWidth: "900px", margin: "2rem auto 0" };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section
      className="block block-registry"
      data-block-id={block.id}
      data-block-type={block.type}
      style={{ padding: "3rem 1.5rem", ...blockSectionStyle(cfg, breakpoint) }}
    >
      <TextEffectWrapper as="h2" className="section-heading" {...editableProps(cfg, "heading")}>
        {heading || <span style={{ opacity: 0.4, fontStyle: "italic" }}>Add heading</span>}
      </TextEffectWrapper>
      <div className="section-rule" aria-hidden="true" />

      {subheading && (
        <p style={{ textAlign: "center", color: "var(--muted)", marginBottom: "1.5rem", maxWidth: "500px", marginLeft: "auto", marginRight: "auto", fontSize: "0.9rem", lineHeight: 1.6 }}>
          {subheading}
        </p>
      )}

      {items.length === 0 && !editing && null}

      {items.length === 0 && editing && (
        <div style={{ maxWidth: "300px", margin: "2rem auto 0" }}>
          <AddItemButton onClick={() => setShowPicker(true)} />
        </div>
      )}

      {items.length > 0 && (
        <div style={gridStyle}>
          {items.map((item, i) => (
            item.type === "store" ? (
              <StoreCard
                key={item.id}
                item={item}
                index={i}
                editing={editing}
                isDragging={dragIndex === i}
                isDropTarget={dropIndex === i && dragIndex !== i}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onOpenPopover={handleOpenPopover}
              />
            ) : (
              <FundCard
                key={item.id}
                item={item}
                index={i}
                editing={editing}
                isDragging={dragIndex === i}
                isDropTarget={dropIndex === i && dragIndex !== i}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onOpenPopover={handleOpenPopover}
              />
            )
          ))}
          {editing && (
            <AddItemButton onClick={() => setShowPicker(true)} />
          )}
        </div>
      )}

      {/* Picker modal */}
      {showPicker && (
        <PickerModal
          onAddStore={addStoreItem}
          onAddCustomStore={addCustomStoreItem}
          onAddFund={addFundItem}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Popovers */}
      {popover && activeItem && popover.type === "url" && (
        <UrlPopover
          anchorRect={popover.rect}
          url={activeItem.url ?? ""}
          onSave={(val) => updateItem(popover.itemId, { url: val })}
          onClose={handleClosePopover}
        />
      )}
      {popover && activeItem && popover.type === "fund" && (
        <FundPopover
          anchorRect={popover.rect}
          platformUrl={activeItem.platformUrl ?? ""}
          platformHandle={activeItem.platformHandle ?? ""}
          onSave={(url, handle) => updateItem(popover.itemId, { platformUrl: url, platformHandle: handle })}
          onClose={handleClosePopover}
        />
      )}
      {popover && activeItem && popover.type === "goal" && (
        <GoalPopover
          anchorRect={popover.rect}
          value={activeItem.fundGoal}
          onSave={(val) => updateItem(popover.itemId, { fundGoal: val })}
          onClose={handleClosePopover}
        />
      )}
    </section>
  );
}
