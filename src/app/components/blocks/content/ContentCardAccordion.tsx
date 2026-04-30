"use client";

import { useRef } from "react";
import { FunFactPicker } from "./FunFactPicker";
import { LinkButtons, AddButton } from "./ContentCardShared";
import type { ContentCardItem } from "./ContentCardTypes";

export interface ContentCardAccordionProps {
  items: ContentCardItem[];
  editing: boolean;
  displayMode: string;
  openAccordionId: string | null;
  onToggleAccordion: (id: string | null) => void;
  onDelete: (id: string) => void;
  pickerOpen: boolean;
  pickerAnchor: DOMRect | null;
  onOpenPicker: (e: React.MouseEvent) => void;
  onSelect: (question: string) => void;
  onCustom: () => void;
  onClosePicker: () => void;
}

export function ContentCardAccordion({
  items,
  editing,
  displayMode,
  openAccordionId,
  onToggleAccordion,
  onDelete,
  pickerOpen,
  pickerAnchor,
  onOpenPicker,
  onSelect,
  onCustom,
  onClosePicker,
}: ContentCardAccordionProps) {
  const addBtnRef = useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        borderTop: "1px solid var(--site-border)",
      }}
    >
      {items.map((item, i) => {
        const isOpen = openAccordionId === (item.id ?? String(i));
        return (
          <div
            key={item.id ?? i}
            style={{
              borderBottom: "1px solid var(--site-border)",
              position: "relative",
            }}
            className="group/fact"
          >
            {editing && item.id && (
              <button
                type="button"
                onClick={() => onDelete(item.id!)}
                className="absolute right-8 top-3 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/fact:flex"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                onToggleAccordion(isOpen ? null : (item.id ?? String(i)))
              }
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
              data-editable-item-index={i}
              data-editable-item-field="question"
              data-editable-array-key="items"
            >
              <span>
                {item.question || (
                  <span
                    style={{ color: "var(--site-muted)", fontStyle: "italic" }}
                  >
                    Question
                  </span>
                )}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
                style={{
                  flexShrink: 0,
                  marginLeft: "1rem",
                  transform: isOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              >
                <path
                  d="M4 6 L8 10 L12 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {isOpen && (
              <div
                style={{
                  paddingBottom: "1rem",
                  color: "var(--body-color)",
                  lineHeight: 1.6,
                  fontSize: "0.9rem",
                  whiteSpace: "pre-wrap",
                }}
                data-editable-item-index={i}
                data-editable-item-field="body"
                data-editable-array-key="items"
              >
                {item.body || (
                  <span
                    style={{ color: "var(--site-muted)", fontStyle: "italic" }}
                  >
                    Answer
                  </span>
                )}
                {(item.links ?? []).length > 0 && (
                  <LinkButtons links={item.links!} />
                )}
              </div>
            )}
          </div>
        );
      })}
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
