"use client";

import { useState } from "react";
import { blockSectionStyle, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";

interface GuestEntry {
  name: string;
  message: string;
}

interface Block { id: string; type: string; [key: string]: unknown }

export function GuestBookBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Guest Book");
  const placeholder = String(cfg.placeholder ?? "Leave a message for the happy couple…");

  // Local state only — storage is stubbed pending a guest book API
  const [entries, setEntries] = useState<GuestEntry[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setEntries((prev) => [{ name: name.trim(), message: message.trim() }, ...prev]);
    setName("");
    setMessage("");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #e0dbd4",
    borderRadius: "6px", fontSize: "0.9rem", boxSizing: "border-box",
  };

  return (
    <section className="block block-guest-book" data-block-id={block.id} data-block-type={block.type}
      style={{ padding: "2rem 1rem", maxWidth: "600px", margin: "0 auto", ...blockSectionStyle(cfg) }}>
      {heading && <TextEffectWrapper as="h2" style={{ textAlign: "center", marginBottom: "1.5rem" }}>{heading}</TextEffectWrapper>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "2rem" }}>
        <input style={inputStyle} placeholder="Your name" value={name}
          onChange={(e) => setName(e.target.value)} required />
        <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
          placeholder={placeholder} value={message}
          onChange={(e) => setMessage(e.target.value)} required />
        <button type="submit" style={{
          alignSelf: "flex-end", background: "var(--accent, #B8921A)", color: "#fff",
          border: "none", padding: "0.5rem 1.25rem", borderRadius: "6px",
          fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
        }}>
          Sign the book
        </button>
      </form>

      {entries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {entries.map((entry, i) => (
            <div key={i} style={{
              background: "#faf8f6", border: "1px solid #e0dbd4",
              borderRadius: "8px", padding: "0.875rem 1rem",
            }}>
              <p style={{ margin: "0 0 0.25rem", fontWeight: 600, fontSize: "0.875rem" }}>{entry.name}</p>
              <p style={{ margin: 0, color: "#4a4540", fontSize: "0.875rem" }}>{entry.message}</p>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <p style={{ textAlign: "center", color: "#9b8e85", fontStyle: "italic", fontSize: "0.875rem" }}>
          Be the first to sign!
        </p>
      )}
    </section>
  );
}
