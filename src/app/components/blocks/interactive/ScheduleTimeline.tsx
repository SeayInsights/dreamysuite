"use client";

import { ScheduleEvent, PopoverType } from "./ScheduleTypes";
import { AddEventButton } from "./SchedulePopovers";

interface ScheduleTimelineProps {
  events: ScheduleEvent[];
  editing: boolean;
  dragIndex: number | null;
  dropIndex: number | null;
  onAddEvent: () => void;
  onDeleteEvent: (id: string) => void;
  onUpdateEvent: (id: string, patch: Partial<ScheduleEvent>) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
  onOpenPopover: (type: PopoverType, eventId: string, rect: DOMRect) => void;
}

function formatTime(t?: string): string {
  if (!t) return "";
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

export function ScheduleTimeline({
  events,
  editing,
  dragIndex,
  dropIndex,
  onAddEvent,
  onDeleteEvent,
  onUpdateEvent,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onOpenPopover,
}: ScheduleTimelineProps) {
  return (
    <div
      className="timeline"
      style={{ maxWidth: "600px", margin: "2rem auto 0", position: "relative" }}
    >
      {/* Vertical rule */}
      <div
        style={{
          position: "absolute",
          left: "5.5rem",
          top: 0,
          bottom: 0,
          width: "2px",
          background: "var(--site-border)",
        }}
        aria-hidden="true"
      />

      {events.map((event, i) => (
        <div
          key={event.id}
          className="timeline-item group/event"
          style={{
            display: "flex",
            gap: "1.25rem",
            marginBottom: "1.75rem",
            position: "relative",
            opacity: dragIndex === i ? 0.4 : 1,
            transition: "opacity 0.15s",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            onDragOver(e, i);
          }}
          onDrop={(e) => {
            e.preventDefault();
            onDrop(i);
          }}
        >
          {/* Drag handle — editing only */}
          {editing && (
            <div
              draggable
              onDragStart={() => onDragStart(i)}
              onDragEnd={onDragEnd}
              className="absolute -left-5 top-0.5 hidden cursor-grab items-center text-muted-foreground group-hover/event:flex"
              style={{ fontSize: "0.9rem", userSelect: "none", lineHeight: 1 }}
              title="Drag to reorder"
            >
              ⠿
            </div>
          )}

          {/* Delete — editing only */}
          {editing && (
            <button
              type="button"
              onClick={() => onDeleteEvent(event.id)}
              className="absolute right-0 top-0 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/event:flex"
              title="Delete event"
            >
              ✕
            </button>
          )}

          {/* Drop indicator */}
          {dropIndex === i && dragIndex !== i && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: -8,
                height: "2px",
                background: "var(--site-accent, #B8921A)",
                borderRadius: "1px",
              }}
            />
          )}

          {/* Time column */}
          <div
            className="timeline-time"
            style={{
              width: "4.5rem",
              flexShrink: 0,
              textAlign: "right",
              fontSize: "0.8rem",
              color: "var(--site-accent, #B8921A)",
              fontWeight: 600,
              paddingTop: "0.2rem",
            }}
          >
            {editing ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = (
                    e.currentTarget as HTMLElement
                  ).getBoundingClientRect();
                  onOpenPopover("time", event.id, rect);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "var(--site-accent, #B8921A)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                }}
                className="hover:opacity-70"
              >
                {event.time ? (
                  formatTime(event.time)
                ) : (
                  <span
                    style={{
                      opacity: 0.4,
                      fontStyle: "italic",
                      fontSize: "0.7rem",
                    }}
                  >
                    + Time
                  </span>
                )}
              </button>
            ) : (
              formatTime(event.time)
            )}
          </div>

          {/* Dot */}
          <div
            style={{
              position: "absolute",
              left: "5rem",
              top: "0.4rem",
              width: "10px",
              height: "10px",
              background: "var(--site-accent, #B8921A)",
              borderRadius: "50%",
              border: "2px solid var(--bg, #fff)",
              zIndex: 1,
            }}
            aria-hidden="true"
          />

          {/* Content */}
          <div
            className="timeline-content"
            style={{
              paddingLeft: "1.25rem",
              flex: 1,
              paddingRight: editing ? "1.5rem" : 0,
            }}
          >
            {(event.date || editing) &&
              (editing ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = (
                      e.currentTarget as HTMLElement
                    ).getBoundingClientRect();
                    onOpenPopover("date", event.id, rect);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    margin: "0 0 0.1rem",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "var(--site-accent, #B8921A)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    display: "block",
                  }}
                  className="hover:opacity-70"
                >
                  {event.date ? (
                    formatDate(event.date)
                  ) : (
                    <span style={{ opacity: 0.4, fontStyle: "italic" }}>
                      + Date
                    </span>
                  )}
                </button>
              ) : (
                <p
                  style={{
                    margin: "0 0 0.1rem",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "var(--site-accent, #B8921A)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {formatDate(event.date)}
                </p>
              ))}

            {/* Title */}
            <p
              style={{
                margin: "0 0 0.125rem",
                fontWeight: 600,
                fontSize: "0.95rem",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              {editing ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = (
                      e.currentTarget as HTMLElement
                    ).getBoundingClientRect();
                    onOpenPopover("emoji", event.id, rect);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1.1rem",
                    padding: "1px",
                    borderRadius: "3px",
                    lineHeight: 1,
                  }}
                  className="hover:bg-accent/20"
                  title="Change icon"
                >
                  {event.icon || "✨"}
                </button>
              ) : (
                event.icon && (
                  <span style={{ marginRight: "0.4rem" }}>{event.icon}</span>
                )
              )}
              <span
                contentEditable={editing}
                suppressContentEditableWarning
                onBlur={(e) =>
                  onUpdateEvent(event.id, {
                    name: e.currentTarget.textContent ?? "",
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).blur();
                  }
                  e.stopPropagation();
                }}
                style={{
                  outline: "none",
                  flex: 1,
                  borderBottom: editing
                    ? "1px dashed var(--site-border)"
                    : "none",
                  cursor: editing ? "text" : "default",
                }}
              >
                {event.name ||
                  (editing ? (
                    ""
                  ) : (
                    <span
                      style={{
                        color: "var(--site-muted)",
                        fontStyle: "italic",
                      }}
                    >
                      Event name
                    </span>
                  ))}
              </span>
            </p>

            {/* End time */}
            {(event.endTime || editing) &&
              (editing ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = (
                      e.currentTarget as HTMLElement
                    ).getBoundingClientRect();
                    onOpenPopover("endTime", event.id, rect);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "0.78rem",
                    color: "var(--site-accent, #B8921A)",
                    display: "block",
                  }}
                  className="hover:opacity-70"
                >
                  {event.endTime ? (
                    `Until ${formatTime(event.endTime)}`
                  ) : (
                    <span
                      style={{
                        opacity: 0.35,
                        fontStyle: "italic",
                        fontSize: "0.72rem",
                      }}
                    >
                      + End time
                    </span>
                  )}
                </button>
              ) : (
                event.endTime && (
                  <p
                    style={{
                      margin: "0 0 0.1rem",
                      fontSize: "0.78rem",
                      color: "var(--site-accent, #B8921A)",
                    }}
                  >
                    Until {formatTime(event.endTime)}
                  </p>
                )
              ))}

            {/* Description */}
            {(event.description || editing) && (
              <p
                style={{
                  margin: "0.125rem 0 0",
                  fontSize: "0.82rem",
                  color: "var(--body-color)",
                  lineHeight: 1.55,
                  minHeight: "1.3em",
                }}
              >
                <span
                  contentEditable={editing}
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    onUpdateEvent(event.id, {
                      description: e.currentTarget.textContent ?? "",
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).blur();
                    }
                    e.stopPropagation();
                  }}
                  style={{
                    outline: "none",
                    whiteSpace: "pre-wrap",
                    borderBottom: editing
                      ? "1px dashed var(--site-border)"
                      : "none",
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
                </span>
              </p>
            )}

            {/* Dress code */}
            {(event.dressCode || editing) && (
              <p
                style={{
                  margin: "0.2rem 0 0",
                  fontSize: "0.75rem",
                  color: "var(--site-muted)",
                }}
              >
                <span
                  contentEditable={editing}
                  suppressContentEditableWarning
                  onBlur={(e) =>
                    onUpdateEvent(event.id, {
                      dressCode: e.currentTarget.textContent ?? "",
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.currentTarget as HTMLElement).blur();
                    }
                    e.stopPropagation();
                  }}
                  style={{
                    outline: "none",
                    borderBottom: editing
                      ? "1px dashed var(--site-border)"
                      : "none",
                    cursor: editing ? "text" : "default",
                  }}
                >
                  {event.dressCode ? (
                    `Dress code: ${event.dressCode}`
                  ) : editing ? (
                    <span style={{ opacity: 0.4, fontStyle: "italic" }}>
                      + Dress code
                    </span>
                  ) : null}
                </span>
              </p>
            )}

            {/* Maps URL */}
            {editing ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = (
                    e.currentTarget as HTMLElement
                  ).getBoundingClientRect();
                  onOpenPopover("mapsUrl", event.id, rect);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "0.75rem",
                  display: "block",
                  marginTop: "0.2rem",
                  color: event.mapsUrl
                    ? "var(--site-accent, #B8921A)"
                    : "var(--site-muted)",
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
                <p
                  style={{
                    margin: "0.125rem 0 0",
                    fontSize: "0.82rem",
                    color: "var(--body-color)",
                  }}
                >
                  <a
                    href={event.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "inherit", textDecoration: "underline" }}
                  >
                    {event.location || "View on map"}
                  </a>
                </p>
              )
            )}
          </div>
        </div>
      ))}

      {/* Add event button at end of timeline */}
      {editing && (
        <div style={{ marginLeft: "5.75rem", marginTop: "0.5rem" }}>
          <AddEventButton onClick={onAddEvent} />
        </div>
      )}
    </div>
  );
}
