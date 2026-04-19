"use client";

import { useState, useActionState } from "react";
import Link from "next/link";

const EVENT_TYPES = [
  { type: "wedding", icon: "💍", label: "Wedding" },
  { type: "anniversary", icon: "🥂", label: "Anniversary" },
  { type: "vow-renewal", icon: "🌸", label: "Vow Renewal" },
  { type: "engagement", icon: "💫", label: "Engagement" },
  { type: "elopement", icon: "✈️", label: "Elopement" },
  { type: "celebration", icon: "🎉", label: "Celebration" },
];

type ActionFn = (prevState: { error?: string } | null, formData: FormData) => Promise<{ error?: string }>;

export function NewSiteForm({ action }: { action: ActionFn }) {
  const [state, formAction, pending] = useActionState(action, null);

  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [eventType, setEventType] = useState("wedding");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const autoSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const displaySlug = slugEdited ? slug : autoSlug;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.875rem",
    border: "1px solid #e8e4e0",
    borderRadius: "8px",
    fontSize: "0.9rem",
    color: "#1c1917",
    background: "#faf8f5",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 500,
    color: "#44403c",
    marginBottom: "0.375rem",
    letterSpacing: "0.02em",
  };

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "680px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1c1917", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>
          Create a new site
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#9b8e85" }}>
          Give it a name, pick an event type, and start building.
        </p>
      </div>

      <form action={formAction}>
        {/* Hidden field for eventType and slug */}
        <input type="hidden" name="eventType" value={eventType} />
        <input type="hidden" name="slug" value={displaySlug} />

        {/* Site Name */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="name" style={labelStyle}>Site name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Dannis & Naomi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              ...inputStyle,
              borderColor: nameTouched && !name.trim() ? "#dc2626" : "#e8e4e0",
            }}
            onFocus={(e) => (e.target.style.borderColor = nameTouched && !name.trim() ? "#dc2626" : "#B8921A")}
            onBlur={(e) => {
              setNameTouched(true);
              e.target.style.borderColor = !name.trim() ? "#dc2626" : "#e8e4e0";
            }}
          />
          {nameTouched && !name.trim() && (
            <p style={{ fontSize: "0.75rem", color: "#dc2626", marginTop: "0.375rem" }}>
              Site name is required
            </p>
          )}
          {displaySlug && name.trim() && (
            <p style={{ fontSize: "0.75rem", color: "#9b8e85", marginTop: "0.375rem" }}>
              URL: <span style={{ color: "#B8921A" }}>{displaySlug}.dreamysuite.com</span>
            </p>
          )}
        </div>

        {/* Event Type */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Event type</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "8px" }}>
            {EVENT_TYPES.map(({ type, icon, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => setEventType(type)}
                style={{
                  background: eventType === type ? "#FDF6E0" : "#fff",
                  border: `1.5px solid ${eventType === type ? "#B8921A" : "#e8e4e0"}`,
                  borderRadius: "10px",
                  padding: "0.875rem 0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "5px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: eventType === type ? "0 0 0 3px rgba(184,146,26,0.12)" : "none",
                }}
              >
                <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{icon}</span>
                <span style={{
                  fontSize: "0.72rem",
                  fontWeight: 500,
                  color: eventType === type ? "#B8921A" : "#1c1917",
                }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom slug */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="slug-input" style={labelStyle}>
            URL slug{" "}
            <span style={{ fontSize: "0.7rem", color: "#9b8e85", fontWeight: 400 }}>(optional — auto-generated from name)</span>
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.82rem", color: "#9b8e85", whiteSpace: "nowrap" }}>dreamysuite.com/</span>
            <input
              id="slug-input"
              type="text"
              placeholder={autoSlug || "my-site"}
              value={slugEdited ? slug : autoSlug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
              }}
              style={{ ...inputStyle, flex: 1 }}
              onFocus={(e) => (e.target.style.borderColor = "#B8921A")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e4e0")}
            />
          </div>
        </div>

        {state && "error" in state && state.error && (
          <div style={{
            fontSize: "0.82rem",
            color: "#dc2626",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "0.625rem 0.875rem",
            marginBottom: "1rem",
          }}>
            {state.error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div onClick={() => { if (!name.trim()) setNameTouched(true); }}>
          <button
            type="submit"
            disabled={pending || !name.trim()}
            style={{
              padding: "0.7rem 1.75rem",
              background: pending ? "#9b8e85" : "#B8921A",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: pending ? "default" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {pending ? "Creating…" : "Create Site"}
          </button>
          </div>
          <Link
            href="/"
            style={{ fontSize: "0.85rem", color: "#9b8e85", textDecoration: "none" }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
