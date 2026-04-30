"use client";

import type { LinkItem } from "./ContentCardTypes";
import { LINK_BTN_STYLE } from "./ContentCardTypes";

export function LinkButtons({ links }: { links: LinkItem[] }) {
  if (!links || links.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
      {links.map((link, i) => (
        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={LINK_BTN_STYLE}>
          {link.label}
        </a>
      ))}
    </div>
  );
}

export function AddButton({ onClick, large }: { onClick: (e: React.MouseEvent) => void; large?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      style={{
        minHeight: large ? "120px" : "80px",
        width: "100%",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      <span style={{ fontSize: large ? "2rem" : "1.5rem", lineHeight: 1 }}>+</span>
    </button>
  );
}
