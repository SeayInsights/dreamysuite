"use client";

import { useRef } from "react";
import { FunFactPicker } from "./FunFactPicker";
import { LinkButtons, AddButton } from "./ContentCardShared";
import type { ContentCardItem } from "./ContentCardTypes";

export interface ContentCardNumberedProps {
  items: ContentCardItem[];
  editing: boolean;
  displayMode: string;
  onDelete: (id: string) => void;
  pickerOpen: boolean;
  pickerAnchor: DOMRect | null;
  onOpenPicker: (e: React.MouseEvent) => void;
  onSelect: (question: string) => void;
  onCustom: () => void;
  onClosePicker: () => void;
}

export function ContentCardNumbered({
  items,
  editing,
  displayMode,
  onDelete,
  pickerOpen,
  pickerAnchor,
  onOpenPicker,
  onSelect,
  onCustom,
  onClosePicker,
}: ContentCardNumberedProps) {
  const addBtnRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ maxWidth: "680px", margin: "2rem auto 0" }}>
      {items.map((item, i) => (
        <div key={item.id ?? i} style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", marginBottom: "1.75rem", position: "relative" }} className="group/fact">
          {editing && item.id && (
            <button
              type="button"
              onClick={() => onDelete(item.id!)}
              className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/fact:flex"
            >
              ✕
            </button>
          )}
          <span style={{
            flexShrink: 0, fontFamily: "var(--heading-font)", fontSize: "2.5rem", fontWeight: 700,
            lineHeight: 1, color: "var(--accent)", opacity: 0.35, width: "3rem", textAlign: "right",
          }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div style={{ flex: 1 }}>
            {item.icon && <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{item.icon}</div>}
            {(item.question || editing) && (
              <p
                style={{
                  margin: "0 0 0.25rem", fontSize: "0.8rem", fontWeight: 500,
                  color: "var(--accent, var(--muted))",
                  opacity: item.question ? 1 : 0.4,
                  fontStyle: item.question ? "normal" : "italic",
                }}
                data-editable-item-index={i} data-editable-item-field="question" data-editable-array-key="items"
              >
                {item.question || "Double-click to add question"}
              </p>
            )}
            {(item.body || editing) && (
              <p style={{
                  margin: 0, fontSize: "0.85rem", color: "var(--body-color)", lineHeight: 1.55,
                  opacity: item.body ? 1 : 0.4,
                  fontStyle: item.body ? "normal" : "italic",
                  whiteSpace: "pre-wrap",
                }}
                 data-editable-item-index={i} data-editable-item-field="body" data-editable-array-key="items">
                {item.body || "Double-click to add answer"}
              </p>
            )}
            {(item.links ?? []).length > 0 && <LinkButtons links={item.links!} />}
          </div>
        </div>
      ))}
      {editing && (
        <div ref={addBtnRef} style={{ marginTop: "1rem" }}>
          <AddButton onClick={onOpenPicker} />
          <FunFactPicker
            open={pickerOpen}
            onSelect={onSelect}
            onCustom={onCustom}
            onClose={onClosePicker}
            anchorRect={pickerAnchor}
            displayMode={displayMode}
          />
        </div>
      )}
    </div>
  );
}
