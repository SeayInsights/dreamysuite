"use client";

import { useState, useEffect } from "react";
import { blockSectionStyle, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";

// Escape HTML to prevent XSS attacks from user-submitted content
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface GuestEntry {
  id: string;
  name: string;
  message: string;
  createdAt: number;
}

interface Block { id: string; type: string; [key: string]: unknown }

export function GuestBookBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Guest Book");
  const placeholder = String(cfg.placeholder ?? "Leave a message for the happy couple…");
  const siteId = String(cfg.siteId ?? "");
  const siteSlug = String(cfg.siteSlug ?? "");

  const [entries, setEntries] = useState<GuestEntry[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Load existing entries on mount
  useEffect(() => {
    if (!siteSlug && !siteId) return;
    const endpoint = siteSlug ? `/api/public/${siteSlug}/guestbook` : `/api/sites/${siteId}/guestbook`;
    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        const typed = data as { entries?: GuestEntry[] };
        if (typed.entries) setEntries(typed.entries);
      })
      .catch(() => {
        // Fail silently — guest book will just start empty
      });
  }, [siteId, siteSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    if (!siteSlug && !siteId) {
      setErrorMsg("Guest book unavailable — site not configured.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    const endpoint = siteSlug ? `/api/public/${siteSlug}/guestbook` : `/api/sites/${siteId}/guestbook`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } | string }).error
          ? typeof (body as { error: { message?: string } | string }).error === "string"
            ? (body as { error: string }).error
            : ((body as { error: { message?: string } }).error.message ?? "Submission failed")
          : "Submission failed");
      }

      const data = await res.json() as { entry?: GuestEntry };
      if (data.entry) {
        setEntries((prev) => [data.entry!, ...prev]);
      }
      setName("");
      setMessage("");
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
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
          onChange={(e) => setName(e.target.value)} required disabled={status === "submitting"} />
        <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
          placeholder={placeholder} value={message}
          onChange={(e) => setMessage(e.target.value)} required disabled={status === "submitting"} />
        <button type="submit" style={{
          alignSelf: "flex-end", background: "var(--accent, #B8921A)", color: "#fff",
          border: "none", padding: "0.5rem 1.25rem", borderRadius: "6px",
          fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
          opacity: status === "submitting" ? 0.6 : 1,
        }} disabled={status === "submitting"}>
          {status === "submitting" ? "Signing..." : "Sign the book"}
        </button>
      </form>

      {status === "success" && (
        <div role="alert" aria-live="polite" style={{ textAlign: "center", color: "#22c55e", padding: "0.5rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
          Thank you for signing!
        </div>
      )}

      {status === "error" && errorMsg && (
        <div role="alert" aria-live="polite" style={{ textAlign: "center", color: "#ef4444", padding: "0.5rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
          {errorMsg}
        </div>
      )}

      {entries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {entries.map((entry) => (
            <div key={entry.id} style={{
              background: "#faf8f6", border: "1px solid #e0dbd4",
              borderRadius: "8px", padding: "0.875rem 1rem",
            }}>
              <p style={{ margin: "0 0 0.25rem", fontWeight: 600, fontSize: "0.875rem" }}>{escapeHtml(entry.name)}</p>
              <p style={{ margin: 0, color: "#4a4540", fontSize: "0.875rem" }}>{escapeHtml(entry.message)}</p>
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
