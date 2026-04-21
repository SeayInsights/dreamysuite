"use client";

interface FunFactItem {
  id?: string;
  question?: string;
  icon?: string;
  title?: string;
  body?: string;
}

interface Props {
  item: FunFactItem;
  index: number;
  cardStyle: React.CSSProperties;
  editing: boolean;
  onDelete?: (id: string) => void;
}

export function FunFactCard({ item, index, cardStyle, editing, onDelete }: Props) {
  return (
    <div style={{ ...cardStyle, position: "relative" }} className="group/fact">
      {editing && item.id && onDelete && (
        <button
          type="button"
          onClick={() => onDelete(item.id!)}
          className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-popover text-[10px] text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/fact:flex"
        >
          ✕
        </button>
      )}

      {item.icon && (
        <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{item.icon}</div>
      )}

      {(item.question || editing) && (
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
      )}

      {(item.title || editing) && (
        <h4
          style={{
            margin: "0 0 0.375rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            opacity: item.title ? 1 : 0.4,
            fontStyle: item.title ? "normal" : "italic",
          }}
          data-editable-item-index={index}
          data-editable-item-field="title"
          data-editable-array-key="items"
        >
          {item.title || "Double-click to add title"}
        </h4>
      )}

      {(item.body || editing) && (
        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: "var(--body-color)",
            lineHeight: 1.55,
            opacity: item.body ? 1 : 0.4,
            fontStyle: item.body ? "normal" : "italic",
          }}
          data-editable-item-index={index}
          data-editable-item-field="body"
          data-editable-array-key="items"
        >
          {item.body || "Double-click to add answer"}
        </p>
      )}

      {!item.title && !item.body && !item.icon && !item.question && !editing && (
        <span style={{ color: "var(--muted)", fontStyle: "italic", fontSize: "0.85rem" }}>
          Empty fact
        </span>
      )}
    </div>
  );
}
