"use client";

import { ScheduleEvent, PopoverType } from "./ScheduleTypes";

export interface EventCardProps {
  event: ScheduleEvent;
  index: number;
  editing: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onUpdate: (id: string, patch: Partial<ScheduleEvent>) => void;
  onDelete: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
  onOpenPopover: (type: PopoverType, eventId: string, rect: DOMRect) => void;
}

function formatTime(t?: string): string | null {
  if (!t) return null;
  try {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
  } catch {
    return t;
  }
}

function formatDate(d?: string): string | null {
  if (!d) return null;
  try {
    const [y, mo, da] = d.split("-").map(Number);
    return new Date(y, mo - 1, da).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export function EventCard({
  event,
  index,
  editing,
  isDragging,
  isDropTarget,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onOpenPopover,
}: EventCardProps) {
  const cardStyle: React.CSSProperties = {
    background: "var(--bg, #fff)",
    border: isDropTarget
      ? "2px dashed var(--site-accent, #B8921A)"
      : "1px solid var(--site-border)",
    borderRadius: "10px",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
    position: "relative",
    opacity: isDragging ? 0.4 : 1,
    transition: "opacity 0.15s, border-color 0.15s",
  };

  function handleTitleBlur(e: React.FocusEvent<HTMLDivElement>) {
    onUpdate(event.id, { name: e.currentTarget.textContent ?? "" });
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }
    e.stopPropagation();
  }

  function handleDescriptionBlur(e: React.FocusEvent<HTMLDivElement>) {
    onUpdate(event.id, { description: e.currentTarget.textContent ?? "" });
  }

  function handleDescriptionKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }
    e.stopPropagation();
  }

  function handleDressCodeBlur(e: React.FocusEvent<HTMLDivElement>) {
    onUpdate(event.id, { dressCode: e.currentTarget.textContent ?? "" });
  }

  function handleDressCodeKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }
    e.stopPropagation();
  }

  function openPopover(type: PopoverType, e: React.MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onOpenPopover(type, event.id, rect);
  }

  return (
    <div
      style={cardStyle}
      className="group/event"
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e, index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(index);
      }}
    >
      {/* Drag handle + delete — visible on hover in editing mode */}
      {editing && (
        <>
          <div
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnd={onDragEnd}
            className="absolute left-2 top-3 hidden cursor-grab items-center justify-center text-muted-foreground group-hover/event:flex"
            style={{ fontSize: "1rem", userSelect: "none", lineHeight: 1 }}
            title="Drag to reorder"
          >
            ⠿
          </div>
          <button
            type="button"
            onClick={() => onDelete(event.id)}
            className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/event:flex"
            title="Delete event"
          >
            ✕
          </button>
        </>
      )}

      {/* Icon + Title row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          paddingLeft: editing ? "1.25rem" : 0,
        }}
      >
        {editing ? (
          <button
            type="button"
            onClick={(e) => openPopover("emoji", e)}
            style={{
              fontSize: "1.25rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              lineHeight: 1,
              minWidth: "1.5rem",
              flexShrink: 0,
              borderRadius: "4px",
              padding: "1px",
            }}
            className="hover:bg-accent/20"
            title="Change icon"
          >
            {event.icon || "✨"}
          </button>
        ) : (
          event.icon && (
            <span style={{ fontSize: "1.25rem", lineHeight: 1, flexShrink: 0 }}>
              {event.icon}
            </span>
          )
        )}
        <div
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          style={{
            fontWeight: 600,
            fontSize: "0.95rem",
            flex: 1,
            outline: "none",
            borderBottom: editing ? "1px dashed var(--site-border)" : "none",
            minHeight: "1.2em",
            cursor: editing ? "text" : "default",
          }}
          data-placeholder="Event name"
        >
          {event.name ||
            (editing ? (
              ""
            ) : (
              <span style={{ color: "var(--site-muted)", fontStyle: "italic" }}>
                Event name
              </span>
            ))}
        </div>
      </div>

      {/* Date row */}
      {(event.date || editing) &&
        (editing ? (
          <button
            type="button"
            onClick={(e) => openPopover("date", e)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              textAlign: "left",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--site-accent, #B8921A)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
            className="hover:opacity-70"
          >
            {event.date ? (
              formatDate(event.date)
            ) : (
              <span style={{ opacity: 0.4, fontStyle: "italic" }}>
                + Add date
              </span>
            )}
          </button>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--site-accent, #B8921A)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {formatDate(event.date)}
          </p>
        ))}

      {/* Time row */}
      {(event.time || event.endTime || editing) && (
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {editing ? (
            <>
              <button
                type="button"
                onClick={(e) => openPopover("time", e)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "0.8rem",
                  color: "var(--site-accent, #B8921A)",
                  fontWeight: 600,
                }}
                className="hover:opacity-70"
              >
                {event.time ? (
                  formatTime(event.time)
                ) : (
                  <span style={{ opacity: 0.4, fontStyle: "italic" }}>
                    + Time
                  </span>
                )}
              </button>
              {(event.time || event.endTime) && (
                <span
                  style={{ fontSize: "0.75rem", color: "var(--site-muted)" }}
                >
                  –
                </span>
              )}
              <button
                type="button"
                onClick={(e) => openPopover("endTime", e)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "0.8rem",
                  color: "var(--site-accent, #B8921A)",
                  fontWeight: 600,
                }}
                className="hover:opacity-70"
              >
                {event.endTime ? (
                  formatTime(event.endTime)
                ) : (
                  <span
                    style={{
                      opacity: 0.4,
                      fontStyle: "italic",
                      fontSize: "0.75rem",
                    }}
                  >
                    + End
                  </span>
                )}
              </button>
            </>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: "var(--site-accent, #B8921A)",
                fontWeight: 600,
              }}
            >
              {formatTime(event.time)}
              {event.endTime ? ` – ${formatTime(event.endTime)}` : ""}
            </p>
          )}
        </div>
      )}

      {/* Description */}
      {(event.description || editing) && (
        <div
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={handleDescriptionBlur}
          onKeyDown={handleDescriptionKeyDown}
          style={{
            fontSize: "0.82rem",
            color: "var(--body-color)",
            lineHeight: 1.55,
            outline: "none",
            whiteSpace: "pre-wrap",
            minHeight: "1.3em",
            borderBottom: editing ? "1px dashed var(--site-border)" : "none",
            cursor: editing ? "text" : "default",
          }}
        >
          {event.description ||
            (editing ? (
              <span
                style={{
                  color: "var(--site-muted)",
                  opacity: 0.5,
                  fontStyle: "italic",
                }}
              >
                + Description
              </span>
            ) : null)}
        </div>
      )}

      {/* Dress code */}
      {(event.dressCode || editing) && (
        <div
          contentEditable={editing}
          suppressContentEditableWarning
          onBlur={handleDressCodeBlur}
          onKeyDown={handleDressCodeKeyDown}
          style={{
            fontSize: "0.75rem",
            color: "var(--site-muted)",
            outline: "none",
            borderBottom: editing ? "1px dashed var(--site-border)" : "none",
            cursor: editing ? "text" : "default",
          }}
          data-placeholder="Dress code"
        >
          {event.dressCode ? (
            `Dress code: ${event.dressCode}`
          ) : editing ? (
            <span style={{ opacity: 0.4, fontStyle: "italic" }}>
              + Dress code
            </span>
          ) : null}
        </div>
      )}

      {/* Maps URL */}
      {editing ? (
        <button
          type="button"
          onClick={(e) => openPopover("mapsUrl", e)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            fontSize: "0.78rem",
            color: event.mapsUrl
              ? "var(--site-accent, #B8921A)"
              : "var(--site-muted)",
            textAlign: "left",
            textDecoration: event.mapsUrl ? "underline" : "none",
          }}
          className="hover:opacity-70"
        >
          {event.mapsUrl ? (
            "Edit location link"
          ) : (
            <span style={{ fontStyle: "italic", opacity: 0.5 }}>
              + Add location
            </span>
          )}
        </button>
      ) : (
        event.mapsUrl && (
          <a
            href={event.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.78rem",
              color: "var(--site-accent, #B8921A)",
              textDecoration: "underline",
            }}
          >
            {event.location || "View on map"}
          </a>
        )
      )}
    </div>
  );
}
