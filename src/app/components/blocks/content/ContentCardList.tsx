"use client";

import { useRef } from "react";
import { FunFactPicker } from "./FunFactPicker";
import { LinkButtons, AddButton } from "./ContentCardShared";
import type { ContentCardItem } from "./ContentCardTypes";

export interface ContentCardListProps {
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

export function ContentCardList({
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
}: ContentCardListProps) {
  const addBtnRef = useRef<HTMLDivElement>(null);

  return (
    <dl style={{ maxWidth: "720px", margin: "0 auto" }}>
      {items.map((item, i) => (
        <div
          key={item.id ?? i}
          style={{ marginBottom: "1.5rem", position: "relative" }}
          className="group/fact"
        >
          {editing && item.id && (
            <button
              type="button"
              onClick={() => onDelete(item.id!)}
              className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/fact:flex"
            >
              ✕
            </button>
          )}
          <dt
            style={{ fontWeight: 600, marginBottom: "0.375rem" }}
            data-editable-item-index={i}
            data-editable-item-field="question"
            data-editable-array-key="items"
          >
            {item.question || (
              <span style={{ color: "var(--site-muted)", fontStyle: "italic" }}>
                Question
              </span>
            )}
          </dt>
          <dd
            style={{
              margin: 0,
              color: "var(--body-color)",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
            data-editable-item-index={i}
            data-editable-item-field="body"
            data-editable-array-key="items"
          >
            {item.body || (
              <span style={{ color: "var(--site-muted)", fontStyle: "italic" }}>
                Answer
              </span>
            )}
          </dd>
          {(item.links ?? []).length > 0 && <LinkButtons links={item.links!} />}
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
    </dl>
  );
}
