import { Link, Outlet, redirect, useLoaderData, useLocation, useMatches, useSearchParams } from "react-router";

import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/_dashboard";
import "~/lib/context";

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw redirect("/login");
  return { user: session.user };
}

interface SiteData {
  name: string;
  slug: string;
  customDomain?: string | null;
}

export default function DashboardLayout() {
  const { user } = useLoaderData<typeof loader>();
  const location = useLocation();
  const matches = useMatches();
  const [searchParams, setSearchParams] = useSearchParams();
  // Detect editor mode from URL path (reliable) + get site data from matches
  const pathMatch = location.pathname.match(/^\/sites\/([^/]+)$/);
  const isEditor = Boolean(pathMatch?.[1]);
  const siteMatch = matches.find((m) => (m.params as Record<string, string>).id);
  const site = (siteMatch?.data as { site?: SiteData } | undefined)?.site;

  const currentSection = searchParams.get("s") ?? "website";

  function setSection(s: string) {
    setSearchParams((prev) => { prev.set("s", s); return prev; });
  }

  const editorNavItems = [
    { key: "website",   label: "Website" },
    { key: "media",     label: "Media" },
    { key: "guestlist", label: "Guest List" },
    { key: "templates", label: "Templates" },
    { key: "site-setup",label: "Site Setup" },
    { key: "analytics", label: "Analytics" },
  ] as const;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#faf8f5" }}>

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside
        style={{
          width: "240px",
          minWidth: "240px",
          background: "white",
          borderRight: "1px solid #e8e4e0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: "1px solid #e8e4e0" }}>
          <Link
            to="/"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}
          >
            <span
              style={{
                width: "28px",
                height: "28px",
                background: "#0d9488",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </span>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "#1c1917", letterSpacing: "-0.02em" }}>
              DreamySuite
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.75rem", overflowY: "auto" }}>
          {isEditor ? (
            /* ── Editor mode nav ── */
            <>
              <Link
                to="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.45rem 0.625rem",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  color: "#9b8e85",
                  textDecoration: "none",
                  marginBottom: "0.75rem",
                  transition: "color 0.15s, background 0.15s",
                }}
                onMouseOver={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.color = "#1c1917";
                  el.style.background = "#f0ede8";
                }}
                onMouseOut={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.color = "#9b8e85";
                  el.style.background = "transparent";
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                My Sites
              </Link>

              <p
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#9b8e85",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "0 0.5rem",
                  marginBottom: "0.375rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {site?.name}
              </p>

              {editorNavItems.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSection(key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    padding: "0.5rem 0.625rem",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    color: currentSection === key ? "#0d9488" : "#44403c",
                    background: currentSection === key ? "#f0fdfa" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontWeight: currentSection === key ? 600 : 400,
                    marginBottom: "2px",
                    transition: "background 0.15s, color 0.15s",
                    outline: "none",
                  }}
                  onMouseOver={(e) => {
                    if (currentSection !== key) {
                      (e.currentTarget as HTMLButtonElement).style.background = "#f0ede8";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (currentSection !== key) {
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    }
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 3px rgba(13,148,136,0.2)";
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                  }}
                >
                  {label}
                </button>
              ))}
            </>
          ) : (
            /* ── Workspace mode nav ── */
            <>
              <p
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#9b8e85",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "0 0.5rem",
                  marginBottom: "0.375rem",
                  marginTop: "0.5rem",
                }}
              >
                Workspace
              </p>
              <NavLink to="/" icon="grid">My Sites</NavLink>
              <NavLink to="/templates" icon="layout">Templates</NavLink>

              <p
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#9b8e85",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "0 0.5rem",
                  marginBottom: "0.375rem",
                  marginTop: "1.25rem",
                }}
              >
                Account
              </p>
              <NavLink to="/settings" icon="settings">Settings</NavLink>
            </>
          )}
        </nav>

        {/* User */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderTop: "1px solid #e8e4e0",
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "#ccfbf1",
              color: "#0f766e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1c1917", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name ?? "Account"}
            </p>
            <p style={{ fontSize: "0.7rem", color: "#9b8e85", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main column ────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Content */}
        <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: "grid" | "layout" | "settings";
  children: React.ReactNode;
}) {
  const icons = {
    grid: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    layout: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
      </svg>
    ),
    settings: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2" />
      </svg>
    ),
  };

  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        padding: "0.5rem 0.625rem",
        borderRadius: "6px",
        fontSize: "0.85rem",
        color: "#44403c",
        textDecoration: "none",
        transition: "background 0.15s, color 0.15s",
        marginBottom: "2px",
      }}
      onMouseOver={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = "#f0ede8";
        el.style.color = "#1c1917";
      }}
      onMouseOut={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.background = "transparent";
        el.style.color = "#44403c";
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 0 3px rgba(13,148,136,0.2)";
        (e.currentTarget as HTMLAnchorElement).style.outline = "none";
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
      }}
    >
      <span style={{ color: "#9b8e85", flexShrink: 0 }}>{icons[icon]}</span>
      {children}
    </Link>
  );
}
