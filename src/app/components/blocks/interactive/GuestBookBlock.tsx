"use client";
import { useEditorStore } from "@/app/stores/editorStore";

import { useState, useEffect } from "react";
import { blockSectionStyle, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";
import { useFormSubmit } from "@/lib/hooks";

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

interface Block {
  id: string;
  type: string;
  [key: string]: unknown;
}

export function GuestBookBlock({ block }: { block: Block }) {
  const breakpoint = useEditorStore((s) => s.breakpoint) as
    | "desktop"
    | "tablet"
    | "mobile";
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "Guest Book");
  const placeholder = String(
    cfg.placeholder ?? "Leave a message for the happy couple…",
  );
  const siteId = String(cfg.siteId ?? "");
  const siteSlug = String(cfg.siteSlug ?? "");

  const [entries, setEntries] = useState<GuestEntry[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  // Load existing entries on mount
  useEffect(() => {
    if (!siteSlug && !siteId) return;
    const endpoint = siteSlug
      ? `/api/public/${siteSlug}/guestbook`
      : `/api/sites/${siteId}/guestbook`;
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

  // Form submission with useFormSubmit hook
  const endpoint = siteSlug
    ? `/api/public/${siteSlug}/guestbook`
    : `/api/sites/${siteId}/guestbook`;

  const { status, error, submit } = useFormSubmit<
    { name: string; message: string },
    { entry?: GuestEntry }
  >({
    endpoint,
    method: "POST",
    onSubmit: () => {
      // Validate fields
      if (!name.trim() || !message.trim()) {
        throw new Error("Please fill in all fields");
      }
      if (!siteSlug && !siteId) {
        throw new Error("Guest book unavailable — site not configured.");
      }

      // Return data to submit
      return {
        name: name.trim(),
        message: message.trim(),
      };
    },
    onSuccess: (data) => {
      // Add new entry to top of list
      if (data.entry) {
        setEntries((prev) => [data.entry!, ...prev]);
      }
      // Clear form
      setName("");
      setMessage("");
    },
    resetDelay: 3000, // Auto-reset success message after 3s
  });

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: "1px solid var(--site-border)",
    borderRadius: "6px",
    fontSize: "0.9rem",
    boxSizing: "border-box",
  };

  return (
    <section
      className="block block-guest-book"
      data-block-id={block.id}
      data-block-type={block.type}
      style={{
        padding: "2rem 1rem",
        maxWidth: "600px",
        margin: "0 auto",
        ...blockSectionStyle(cfg, breakpoint),
      }}
    >
      {heading && (
        <TextEffectWrapper
          as="h2"
          style={{ textAlign: "center", marginBottom: "1.5rem" }}
        >
          {heading}
        </TextEffectWrapper>
      )}

      <form
        onSubmit={submit}
        aria-label="Guest book"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
          marginBottom: "2rem",
        }}
      >
        <label
          htmlFor={`gb-name-${block.id}`}
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--site-muted)",
          }}
        >
          Name
        </label>
        <input
          id={`gb-name-${block.id}`}
          style={inputStyle}
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={status === "submitting"}
        />
        <label
          htmlFor={`gb-msg-${block.id}`}
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--site-muted)",
          }}
        >
          Message
        </label>
        <textarea
          id={`gb-msg-${block.id}`}
          style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          disabled={status === "submitting"}
        />
        <button
          type="submit"
          style={{
            alignSelf: "flex-end",
            background: "var(--site-accent, #B8921A)",
            color: "var(--bg)",
            border: "none",
            padding: "0.5rem 1.25rem",
            borderRadius: "6px",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            opacity: status === "submitting" ? 0.6 : 1,
          }}
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Signing..." : "Sign the book"}
        </button>
      </form>

      {status === "success" && (
        <div
          role="alert"
          aria-live="polite"
          className="text-green-500"
          style={{
            textAlign: "center",
            padding: "0.5rem",
            marginBottom: "1rem",
            fontSize: "0.875rem",
          }}
        >
          Thank you for signing!
        </div>
      )}

      {status === "error" && error && (
        <div
          role="alert"
          aria-live="polite"
          className="text-red-500"
          style={{
            textAlign: "center",
            padding: "0.5rem",
            marginBottom: "1rem",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      {entries.length > 0 && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--site-border)",
                borderRadius: "8px",
                padding: "0.875rem 1rem",
              }}
            >
              <p
                style={{
                  margin: "0 0 0.25rem",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                {escapeHtml(entry.name)}
              </p>
              <p
                style={{
                  margin: 0,
                  color: "var(--body-color)",
                  fontSize: "0.875rem",
                }}
              >
                {escapeHtml(entry.message)}
              </p>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <p
          style={{
            textAlign: "center",
            color: "var(--site-muted)",
            fontStyle: "italic",
            fontSize: "0.875rem",
          }}
        >
          Be the first to sign!
        </p>
      )}
    </section>
  );
}
