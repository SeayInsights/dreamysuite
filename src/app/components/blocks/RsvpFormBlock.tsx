"use client";

import { useState } from "react";
import { blockSectionStyle, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";

interface Block { id: string; type: string; [key: string]: unknown }

export function RsvpFormBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? "RSVP");
  const subheading = String(cfg.subheading ?? "We hope to see you there!");
  const siteId = String(cfg.siteId ?? "");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [attending, setAttending] = useState<"yes" | "no" | "">("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!siteId) { setErrorMsg("RSVP unavailable — site not configured."); setStatus("error"); return; }
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/sites/${siteId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, rsvpStatus: attending || "pending" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: { message?: string } }).error?.message ?? "Submission failed");
      }
      setStatus("success");
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
    <section className="block block-rsvp-form" data-block-id={block.id} data-block-type={block.type}
      style={{ padding: "2rem", maxWidth: "480px", margin: "0 auto", ...blockSectionStyle(cfg) }}>
      <TextEffectWrapper as="h2" style={{ textAlign: "center", marginBottom: "0.25rem" }}>{heading}</TextEffectWrapper>
      {subheading && <p style={{ textAlign: "center", color: "#9b8e85", marginBottom: "1.5rem" }}>{subheading}</p>}

      {status === "success" ? (
        <p style={{ textAlign: "center", color: "#22c55e", fontWeight: 500 }}>
          Thank you! Your RSVP has been received.
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <input style={inputStyle} placeholder="First name" value={firstName}
              onChange={(e) => setFirstName(e.target.value)} required />
            <input style={inputStyle} placeholder="Last name" value={lastName}
              onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <input style={inputStyle} type="email" placeholder="Email address" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["yes", "no"] as const).map((val) => (
              <label key={val} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                gap: "0.4rem", padding: "0.5rem", border: `1px solid ${attending === val ? "var(--accent, #B8921A)" : "#e0dbd4"}`,
                borderRadius: "6px", cursor: "pointer", fontSize: "0.875rem",
                background: attending === val ? "var(--accent-light, #fdf6e3)" : "#fff",
              }}>
                <input type="radio" name="attending" value={val} checked={attending === val}
                  onChange={() => setAttending(val)} style={{ accentColor: "var(--accent, #B8921A)" }} />
                {val === "yes" ? "Attending" : "Not attending"}
              </label>
            ))}
          </div>
          {status === "error" && (
            <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: 0 }}>{errorMsg}</p>
          )}
          <button type="submit" disabled={status === "submitting"} style={{
            background: "var(--accent, #B8921A)", color: "#fff", border: "none",
            padding: "0.65rem 1.5rem", borderRadius: "6px", fontSize: "0.9rem",
            fontWeight: 600, cursor: status === "submitting" ? "not-allowed" : "pointer",
            opacity: status === "submitting" ? 0.7 : 1,
          }}>
            {status === "submitting" ? "Sending…" : "Send RSVP"}
          </button>
        </form>
      )}
    </section>
  );
}
