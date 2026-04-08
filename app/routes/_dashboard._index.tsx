import { Link } from "react-router";

export function meta() {
  return [{ title: "My Sites — DreamySuite" }];
}

// Placeholder site data — will be replaced with D1 queries
const MOCK_SITES: Array<{
  id: string;
  name: string;
  type: string;
  status: "published" | "draft";
  updatedAt: string;
  previewColor: string;
}> = [];

export default function DashboardIndex() {
  const sites = MOCK_SITES;

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

      {/* Site grid or empty state */}
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
      {/* Builder illustration */}
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
        Create a site
      </Link>
    </div>
  );
}

function SiteCard({
  site,
}: {
  site: (typeof MOCK_SITES)[number];
}) {
  return (
    <Link
      to={`/sites/${site.id}`}
      style={{ textDecoration: "none" }}
    >
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
        {/* Preview */}
        <div
          style={{
            height: "120px",
            background: site.previewColor,
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

        {/* Info */}
        <div style={{ padding: "0.875rem 1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "0.5rem",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#1c1917",
                  marginBottom: "0.2rem",
                }}
              >
                {site.name}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#9b8e85" }}>
                {site.type} · {site.updatedAt}
              </p>
            </div>
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                padding: "0.2rem 0.5rem",
                borderRadius: "4px",
                background:
                  site.status === "published" ? "#f0fdfa" : "#f0ede8",
                color:
                  site.status === "published" ? "#0f766e" : "#9b8e85",
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
