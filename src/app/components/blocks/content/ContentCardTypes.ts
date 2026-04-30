export interface LinkItem {
  label: string;
  url: string;
}

export interface ContentCardItem {
  id?: string;
  question?: string;
  icon?: string;
  body?: string;
  links?: LinkItem[];
}

export interface Block {
  id: string;
  type: string;
  [key: string]: unknown;
}

export const LINK_BTN_STYLE: React.CSSProperties = {
  display: "inline-flex",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  fontSize: "0.82rem",
  fontWeight: 600,
  color: "var(--site-accent, #B8921A)",
  border: "1px solid var(--site-accent, var(--site-border))",
  textDecoration: "none",
  background: "transparent",
};

export function cardBorderStyle(cardStyle: string): React.CSSProperties {
  if (cardStyle === "bordered")
    return {
      border: "1px solid var(--site-border)",
      borderRadius: "8px",
      padding: "1.25rem",
      background: "transparent",
    };
  if (cardStyle === "flat") return { padding: "0.75rem 0" };
  return {
    background: "var(--bg, #fff)",
    border: "1px solid var(--site-border)",
    borderRadius: "10px",
    padding: "1.5rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  };
}

export function columnsValue(columns: string): string {
  if (columns === "2") return "repeat(2, 1fr)";
  if (columns === "3") return "repeat(3, 1fr)";
  if (columns === "4") return "repeat(4, 1fr)";
  return "repeat(auto-fill, minmax(220px, 1fr))";
}
