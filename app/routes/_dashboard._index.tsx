import { Link, useLoaderData } from "react-router";
import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/_dashboard._index";
import "~/lib/context";

interface Site {
  id: string;
  name: string;
  eventType: string | null;
  status: "published" | "draft";
  customDomain: string | null;
  slug: string;
  previewColor: string;
  updatedAt: number;
}

export function meta() {
  return [{ title: "My Sites — DreamySuite" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    const { redirect } = await import("react-router");
    throw redirect("/login");
  }

  const result = await context.cloudflare.env.DB
    .prepare(
      "SELECT id, name, eventType, status, customDomain, slug, previewColor, updatedAt FROM site WHERE userId = ? ORDER BY updatedAt DESC"
    )
    .bind(session.user.id)
    .all<Site>();

  return { sites: result.results };
}

export default function DashboardIndex() {
  const { sites } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: "960px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#1c1917",
              letterSpacing: "-0.02em",
              marginBottom: "0.25rem",
            }}
          >
            My Sites
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#9b8e85" }}>
            {sites.length === 0
              ? "No sites yet — create your first one"
              : `${sites.length} site${sites.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <Link
          to="/sites/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.6rem 1.125rem",
            background: "#0d9488",
            color: "white",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: 600,
            textDecoration: "none",
            transition: "background 0.15s",
          }}
          onMouseOver={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.background = "#0f766e")
          }
          onMouseOut={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.background = "#0d9488")
          }
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Site
        </Link>
      </div>

      {sites.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1rem",
          }}
        >
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "5rem 2rem",
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e8e4e0",
      }}
    >
      <div
        style={{
          width: "72px",
          height: "72px",
          background: "#f0fdfa",
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0d9488"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
          <path d="M12 13h4M12 16h2" />
        </svg>
      </div>
      <h2
        style={{
          fontSize: "1.125rem",
          fontWeight: 700,
          color: "#1c1917",
          marginBottom: "0.5rem",
          letterSpacing: "-0.01em",
        }}
      >
        Build your first site
      </h2>
      <p
        style={{
          fontSize: "0.875rem",
          color: "#9b8e85",
          maxWidth: "320px",
          margin: "0 auto 1.75rem",
          lineHeight: 1.6,
        }}
      >
        Choose a template, add your content, and publish — no code required.
      </p>
      <Link
        to="/sites/new"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.7rem 1.5rem",
          background: "#0d9488",
          color: "white",
          borderRadius: "8px",
          fontSize: "0.9rem",
          fontWeight: 600,
          textDecoration: "none",
        }}
        onMouseOver={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.background = "#0f766e")
        }
        onMouseOut={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.background = "#0d9488")
        }
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Create a site
      </Link>
    </div>
  );
}

function SiteCard({ site }: { site: Site }) {
  const label = site.customDomain ?? `${site.slug}.dreamysuite.com`;
  const relativeTime = formatRelative(site.updatedAt);

  return (
    <Link to={`/sites/${site.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "white",
          borderRadius: "10px",
          border: "1px solid #e8e4e0",
          overflow: "hidden",
          transition: "box-shadow 0.15s, border-color 0.15s",
          cursor: "pointer",
        }}
        onMouseOver={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
          el.style.borderColor = "#0d9488";
        }}
        onMouseOut={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = "none";
          el.style.borderColor = "#e8e4e0";
        }}
      >
        <div
          style={{
            height: "120px",
            background: site.previewColor ?? "#0d9488",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        <div style={{ padding: "0.875rem 1rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1c1917", marginBottom: "0.2rem" }}>
                {site.name}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#9b8e85", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {label} · {relativeTime}
              </p>
            </div>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                padding: "0.2rem 0.5rem",
                borderRadius: "4px",
                background: site.status === "published" ? "#f0fdfa" : "#f0ede8",
                color: site.status === "published" ? "#0f766e" : "#9b8e85",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                flexShrink: 0,
              }}
            >
              {site.status}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function formatRelative(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
