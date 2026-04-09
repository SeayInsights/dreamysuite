import { Form, redirect, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/_dashboard.sites.new";
import "~/lib/context";

export function meta() {
  return [{ title: "New Site — DreamySuite" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw redirect("/login");
  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw redirect("/login");

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const eventType = String(formData.get("eventType") ?? "wedding");
  const slugRaw = String(formData.get("slug") ?? "").trim();

  if (!name) return { error: "Site name is required." };

  const slug = slugRaw || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: "Slug may only contain lowercase letters, numbers, and hyphens." };
  }

  const id = `site_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  const now = Date.now();

  try {
    await context.cloudflare.env.DB
      .prepare(
        "INSERT INTO site (id, userId, name, slug, eventType, previewColor, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(id, session.user.id, name, slug, eventType, "#0d9488", "draft", now, now)
      .run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) return { error: `The slug "${slug}" is already taken. Choose a different one.` };
    return { error: msg };
  }

  throw redirect(`/sites/${id}`);
}

const EVENT_TYPES = [
  { type: "wedding", icon: "💍", label: "Wedding" },
  { type: "anniversary", icon: "🥂", label: "Anniversary" },
  { type: "vow-renewal", icon: "🌸", label: "Vow Renewal" },
  { type: "engagement", icon: "💫", label: "Engagement" },
  { type: "elopement", icon: "✈️", label: "Elopement" },
  { type: "celebration", icon: "🎉", label: "Celebration" },
];

export default function NewSite() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  const [name, setName] = useState("");
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

      <Form method="post">
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
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
            onBlur={(e) => (e.target.style.borderColor = "#e8e4e0")}
          />
          {displaySlug && (
            <p style={{ fontSize: "0.75rem", color: "#9b8e85", marginTop: "0.375rem" }}>
              URL: <span style={{ color: "#0d9488" }}>{displaySlug}.dreamysuite.com</span>
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
                  background: eventType === type ? "#f0fdfa" : "#fff",
                  border: `1.5px solid ${eventType === type ? "#0d9488" : "#e8e4e0"}`,
                  borderRadius: "10px",
                  padding: "0.875rem 0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "5px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: eventType === type ? "0 0 0 3px rgba(13,148,136,0.08)" : "none",
                }}
              >
                <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{icon}</span>
                <span style={{
                  fontSize: "0.72rem",
                  fontWeight: 500,
                  color: eventType === type ? "#0d9488" : "#1c1917",
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
              onFocus={(e) => (e.target.style.borderColor = "#0d9488")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e4e0")}
            />
          </div>
        </div>

        {actionData && "error" in actionData && (
          <div style={{
            fontSize: "0.82rem",
            color: "#dc2626",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "0.625rem 0.875rem",
            marginBottom: "1rem",
          }}>
            {actionData.error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            style={{
              padding: "0.7rem 1.75rem",
              background: submitting ? "#9b8e85" : "#0d9488",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: submitting ? "default" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {submitting ? "Creating…" : "Create Site"}
          </button>
          <a
            href="/"
            style={{ fontSize: "0.85rem", color: "#9b8e85", textDecoration: "none" }}
          >
            Cancel
          </a>
        </div>
      </Form>
    </div>
  );
}
