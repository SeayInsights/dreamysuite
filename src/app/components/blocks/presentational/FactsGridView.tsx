import type { CSSProperties } from "react";
import { Placeholder } from "./primitives";

/**
 * Presentational grid for tidbits / fun-facts blocks — single source for
 * published markup. Both share the "block-tidbits" shell; they differ only in
 * the item label field (tidbits=title, fun-facts=question) and its styling.
 * Store-free/hook-free. Empty items render the placeholder.
 */

export interface FactsGridItem {
  icon?: string;
  label?: string;
  body?: string;
}

export interface FactsGridViewProps {
  id: string;
  type: string;
  showTitle: boolean;
  columns: string; // "2" | "3" | anything -> auto-fill
  cardStyle: string; // "flat" | "bordered" | "card"
  labelVariant: "tidbits" | "fun-facts";
  items: FactsGridItem[];
  style?: CSSProperties;
  data?: Record<string, string>;
}

function colsCssFor(cols: string): string {
  return cols === "2"
    ? "repeat(2,1fr)"
    : cols === "3"
      ? "repeat(3,1fr)"
      : "repeat(auto-fill,minmax(200px,1fr))";
}

function cardCssFor(cardStyle: string): CSSProperties {
  if (cardStyle === "flat") {
    return {
      padding: "1.25rem",
      textAlign: "center",
      color: "var(--block-text,var(--site-text))",
    };
  }
  if (cardStyle === "bordered") {
    return {
      border: "1px solid var(--site-border)",
      borderRadius: "12px",
      padding: "1.25rem",
      textAlign: "center",
      color: "var(--block-text,var(--site-text))",
    };
  }
  return {
    background: "#fff",
    border: "1px solid var(--site-border)",
    borderRadius: "12px",
    padding: "1.25rem",
    textAlign: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    color: "var(--block-text,var(--text))",
  };
}

const ICON_STYLE: CSSProperties = { fontSize: "2rem", marginBottom: "0.5rem" };
const TIDBITS_LABEL_STYLE: CSSProperties = {
  display: "block",
  marginBottom: "0.375rem",
};
const FUNFACTS_LABEL_STYLE: CSSProperties = {
  display: "block",
  marginBottom: "0.375rem",
  fontSize: "0.8rem",
  fontWeight: 500,
  color: "var(--site-accent,var(--site-muted))",
};
const BODY_STYLE: CSSProperties = {
  color: "var(--block-text,var(--site-muted))",
  fontSize: "0.9375rem",
  margin: 0,
};

export function FactsGridView({
  id,
  type,
  showTitle,
  columns,
  cardStyle,
  labelVariant,
  items,
  style,
  data,
}: FactsGridViewProps) {
  const hasStyle = style && Object.keys(style).length > 0;
  const cardCss = cardCssFor(cardStyle);
  const labelStyle =
    labelVariant === "fun-facts" ? FUNFACTS_LABEL_STYLE : TIDBITS_LABEL_STYLE;
  return (
    <section
      className="block block-tidbits"
      {...(hasStyle ? { style } : {})}
      {...(data ?? {})}
      aria-label="Fun facts"
      data-block-id={id}
      data-block-type={type}
    >
      {showTitle ? (
        <>
          <h2 className="section-heading">Fun Facts</h2>
          <div className="section-rule" aria-hidden="true"></div>
        </>
      ) : null}
      {items.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: colsCssFor(columns),
            gap: "1rem",
          }}
        >
          {items.map((it, i) => (
            <div key={i} style={cardCss}>
              {it.icon ? <div style={ICON_STYLE}>{it.icon}</div> : null}
              {it.label ? <strong style={labelStyle}>{it.label}</strong> : null}
              {it.body ? <p style={BODY_STYLE}>{it.body}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <Placeholder text="Fun facts will appear here once added in the Content tab." />
      )}
    </section>
  );
}
