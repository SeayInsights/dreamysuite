"use client";

import { useState, useRef } from "react";
import { LinkPopover } from "./ContentCardLinkPopover";
import { LINK_BTN_STYLE, type ContentCardItem, type LinkItem } from "./ContentCardTypes";

export interface CardWithLinksProps {
  item: ContentCardItem;
  index: number;
  cardStyle: React.CSSProperties;
  editing: boolean;
  displayMode: string;
  onDelete: (id: string) => void;
  onAddLink: (itemId: string, link: LinkItem) => void;
  onEditLink: (itemId: string, linkIndex: number, link: LinkItem) => void;
  onDeleteLink: (itemId: string, linkIndex: number) => void;
}

export function CardWithLinks({ item, index, cardStyle, editing, displayMode, onDelete, onAddLink, onEditLink, onDeleteLink }: CardWithLinksProps) {
  const [linkPopover, setLinkPopover] = useState<{ rect: DOMRect; linkIndex?: number } | null>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  function handleAddLinkClick(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setLinkPopover({ rect });
  }

  function handleEditLinkClick(e: React.MouseEvent, linkIndex: number) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setLinkPopover({ rect, linkIndex });
  }

  const links = item.links ?? [];

  return (
    <div style={{ ...cardStyle, position: "relative" }} className="group/fact">
      {editing && item.id && (
        <button
          type="button"
          onClick={() => onDelete(item.id!)}
          className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/fact:flex"
        >
          ✕
        </button>
      )}

      {item.icon && (
        displayMode === "travel" ? (
          <p style={{
            margin: 0, fontSize: "0.72rem", fontWeight: 700,
            color: "var(--accent, #B8921A)", textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            {item.icon}
          </p>
        ) : (
          <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{item.icon}</div>
        )
      )}

      {(item.question || editing) && (
        displayMode === "travel" ? (
          <h4
            style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}
            data-editable-item-index={index}
            data-editable-item-field="question"
            data-editable-array-key="items"
          >
            {item.question || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Heading</span>}
          </h4>
        ) : (
          <p
            style={{
              margin: "0 0 0.5rem",
              fontSize: "0.8rem",
              fontWeight: 500,
              color: "var(--accent, var(--muted))",
              fontStyle: item.question ? "normal" : "italic",
              opacity: item.question ? 1 : 0.4,
            }}
            data-editable-item-index={index}
            data-editable-item-field="question"
            data-editable-array-key="items"
          >
            {item.question || "Double-click to add question"}
          </p>
        )
      )}

      {(item.body || editing) && (
        displayMode === "travel" ? (
          <p
            style={{ margin: 0, fontSize: "0.85rem", color: "var(--body-color)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}
            data-editable-item-index={index}
            data-editable-item-field="body"
            data-editable-array-key="items"
          >
            {item.body || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Details</span>}
          </p>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              color: "var(--body-color)",
              lineHeight: 1.55,
              opacity: item.body ? 1 : 0.4,
              fontStyle: item.body ? "normal" : "italic",
              whiteSpace: "pre-wrap",
            }}
            data-editable-item-index={index}
            data-editable-item-field="body"
            data-editable-array-key="items"
          >
            {item.body || "Double-click to add answer"}
          </p>
        )
      )}

      {links.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
          {links.map((link, li) => (
            <div key={li} style={{ position: "relative" }} className="group/link">
              <a href={link.url} target="_blank" rel="noopener noreferrer" style={LINK_BTN_STYLE}>
                {link.label}
              </a>
              {editing && (
                <button
                  type="button"
                  onClick={(e) => handleEditLinkClick(e, li)}
                  className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full border border-border bg-popover text-[9px] text-muted-foreground shadow-sm hover:bg-accent/50 group-hover/link:flex"
                  title="Edit link"
                >
                  ✎
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (displayMode === "travel" || displayMode === "general") && (
        <button
          ref={addBtnRef}
          type="button"
          onClick={handleAddLinkClick}
          className="mt-2 hidden text-[10px] text-muted-foreground hover:text-primary transition-colors group-hover/fact:inline-block"
        >
          + Add Button
        </button>
      )}

      {!item.question && !item.body && !item.icon && !editing && links.length === 0 && (
        <span style={{ color: "var(--muted)", fontStyle: "italic", fontSize: "0.85rem" }}>
          {displayMode === "travel" ? "Empty travel card" : "Empty card"}
        </span>
      )}

      {linkPopover && item.id && (
        <LinkPopover
          anchorRect={linkPopover.rect}
          existingLink={linkPopover.linkIndex !== undefined ? links[linkPopover.linkIndex] : undefined}
          onSave={(link) => {
            if (linkPopover.linkIndex !== undefined) {
              onEditLink(item.id!, linkPopover.linkIndex, link);
            } else {
              onAddLink(item.id!, link);
            }
            setLinkPopover(null);
          }}
          onDelete={linkPopover.linkIndex !== undefined ? () => {
            onDeleteLink(item.id!, linkPopover.linkIndex!);
            setLinkPopover(null);
          } : undefined}
          onClose={() => setLinkPopover(null)}
        />
      )}
    </div>
  );
}
