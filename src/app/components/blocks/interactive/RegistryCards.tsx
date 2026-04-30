"use client";

import { useState } from "react";
import { STORE_LOGOS, PLATFORM_LABELS, PLATFORM_ICONS } from "./RegistryBlockTypes";
import type { RegistryItem, PopoverType } from "./RegistryBlockTypes";

// ── Generic gift icon for unknown stores ─────────────────────────────────────

export function GiftIcon() {
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

// ── Add button (dotted border) ───────────────────────────────────────────────

export function AddItemButton({ onClick }: { onClick: () => void }) {
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

// ── Shared drag/delete controls ───────────────────────────────────────────────

interface CardControlsProps {
  index: number;
  itemId: string;
  onDelete: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
}

function CardControls({ index, itemId, onDelete, onDragStart, onDragEnd }: CardControlsProps) {
  return (
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
        onClick={() => onDelete(itemId)}
        className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/card:flex"
        title="Delete"
      >
        ✕
      </button>
    </>
  );
}

// ── Store card ───────────────────────────────────────────────────────────────

export interface StoreCardProps {
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

export function StoreCard({
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
        <CardControls
          index={index}
          itemId={item.id}
          onDelete={onDelete}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      )}

      <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {logoSrc && !logoFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- src is a data: URI (inline SVG); next/image does not support data: URIs
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

export interface FundCardProps {
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

export function FundCard({
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
        <CardControls
          index={index}
          itemId={item.id}
          onDelete={onDelete}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
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

// Re-export PopoverType so card consumers don't need to import from Types directly
export type { PopoverType };
