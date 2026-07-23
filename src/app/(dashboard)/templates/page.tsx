import Link from "next/link";
import { STARTERS } from "@/lib/templates/starters";

export const metadata = { title: "Templates — DreamySuite" };

const EVENT_ICON: Record<string, string> = {
  wedding: "💍",
  anniversary: "🥂",
  "vow-renewal": "🌸",
  engagement: "💫",
  elopement: "✈️",
  celebration: "🎉",
};

export default function TemplatesPage() {
  return (
    <div className="sites-page ds-animate">
      <div className="sites-header">
        <div>
          <h1 className="sites-heading">Templates</h1>
          <p className="sites-subheading">
            Start from a designed template — every page, color, and word is
            yours to change after.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {STARTERS.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#fff",
              border: "1px solid #e8e4e0",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            {/* Main area — links to a live preview (or straight to create for
                the empty blank template, which has nothing to preview). */}
            <Link
              href={
                t.pages.length > 0
                  ? `/templates/${t.id}/preview`
                  : `/sites/new?template=${t.id}`
              }
              target={t.pages.length > 0 ? "_blank" : undefined}
              rel={t.pages.length > 0 ? "noopener noreferrer" : undefined}
              style={{
                display: "flex",
                flexDirection: "column",
                textDecoration: "none",
                flex: 1,
              }}
            >
              {/* Preview band */}
              <div
                style={{
                  position: "relative",
                  height: 96,
                  background: `linear-gradient(135deg, ${t.previewColor} 0%, ${t.previewColor}cc 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "2rem", lineHeight: 1 }}>
                  {EVENT_ICON[t.eventType] ?? "✨"}
                </span>
              </div>

              {/* Body */}
              <div
                style={{
                  padding: "0.9rem 1rem 0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "#1c1917",
                  }}
                >
                  {t.name}
                </div>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "#9b8e85",
                    lineHeight: 1.45,
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {t.description}
                </p>

                {t.pages.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {t.pages.map((p) => (
                      <span
                        key={p.slug}
                        style={{
                          fontSize: "0.68rem",
                          color: "#57534e",
                          background: "#f5f2ee",
                          borderRadius: 6,
                          padding: "2px 7px",
                        }}
                      >
                        {p.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: "0.7rem", color: "#a8a29e" }}>
                    Start from a blank canvas
                  </span>
                )}
              </div>
            </Link>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "0.6rem 1rem 0.85rem",
                borderTop: "1px solid #f0ece7",
              }}
            >
              {t.pages.length > 0 ? (
                <Link
                  href={`/templates/${t.id}/preview`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.76rem",
                    color: "#78716c",
                    textDecoration: "none",
                  }}
                >
                  Preview
                </Link>
              ) : (
                <span />
              )}
              <Link
                href={`/sites/new?template=${t.id}`}
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "#B8921A",
                  textDecoration: "none",
                }}
              >
                Use this template →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
