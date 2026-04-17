import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth, type Env } from "@/app/lib/auth.server";

export const metadata = { title: "My Sites — DreamySuite" };

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

export default async function DashboardIndex() {
  const { env } = await getCloudflareContext({ async: true });
  const typedEnv = env as unknown as Env;

  const auth = createAuth(typedEnv);
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    redirect("/login");
  }

  const db = typedEnv.DB;

  const [owned, invited] = await Promise.all([
    db
      .prepare(
        "SELECT id, name, eventType, status, customDomain, slug, previewColor, updatedAt FROM site WHERE userId = ? ORDER BY updatedAt DESC"
      )
      .bind(session.user.id)
      .all<Site>(),
    db
      .prepare(
        "SELECT s.id, s.name, s.eventType, s.status, s.customDomain, s.slug, s.previewColor, s.updatedAt FROM site s JOIN site_invite i ON i.siteId = s.id WHERE i.email = ? ORDER BY s.updatedAt DESC"
      )
      .bind(session.user.email.toLowerCase())
      .all<Site>(),
  ]);

  const seenIds = new Set(owned.results.map((s: Site) => s.id));
  const sites = [
    ...owned.results,
    ...invited.results.filter((s: Site) => !seenIds.has(s.id)),
  ].sort((a: Site, b: Site) => b.updatedAt - a.updatedAt);

  return (
    <div className="sites-page ds-animate">
      {/* Header */}
      <div className="sites-header">
        <div>
          <h1 className="sites-heading">My Sites</h1>
          <p className="sites-subheading">
            {sites.length === 0
              ? "No sites yet — create your first one"
              : `${sites.length} site${sites.length === 1 ? "" : "s"}`}
          </p>
        </div>

      </div>

      {sites.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="sites-grid ds-stagger">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
          <NewSiteCard />
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="sites-empty">
      <div className="sites-empty-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
          <path d="M12 13h4M12 16h2" />
        </svg>
      </div>
      <h2 className="sites-empty-heading">Build your first site</h2>
      <p className="sites-empty-body">
        Choose a template, add your content, and publish — no code required.
      </p>
      <Link href="/sites/new" className="ds-btn-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Create a site
      </Link>
    </div>
  );
}

function NewSiteCard() {
  return (
    <Link href="/sites/new" className="site-card-outer" style={{ opacity: 0.7 }}>
      <div className="site-card-inner" style={{ height: "100%" }}>
        <div
          className="site-card-preview"
          style={{
            background: "transparent",
            border: "2px dashed var(--ds-border, #e8e4e0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ds-text-subtle, #9b8e85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <div className="site-card-body">
          <div className="site-card-row">
            <p className="site-card-name" style={{ color: "var(--ds-text-subtle, #9b8e85)" }}>New Site</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SiteCard({ site }: { site: Site }) {
  const label = site.customDomain ?? `${site.slug}.dreamysuite.com`;
  const relativeTime = formatRelative(site.updatedAt);

  return (
    <Link href={`/sites/${site.id}`} className="site-card-outer">
      <div className="site-card-inner">
        <div
          className="site-card-preview"
          style={{ background: site.previewColor ?? "var(--ds-bg-subtle)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        <div className="site-card-body">
          <div className="site-card-row">
            <div style={{ minWidth: 0 }}>
              <p className="site-card-name">{site.name}</p>
              <p className="site-card-meta">{label} · {relativeTime}</p>
            </div>
            <span className={`site-card-badge ${site.status}`}>{site.status}</span>
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
