import { Link, Outlet, redirect, useLoaderData, useLocation, useMatches, useSearchParams } from "react-router";

import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/_dashboard";
import "~/lib/context";
import dashboardStyles from "~/styles/dashboard.css?url";

export function links() {
  return [{ rel: "stylesheet", href: dashboardStyles }];
}

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
    { key: "website",    label: "Website",    icon: "website" },
    { key: "media",      label: "Media",      icon: "media" },
    { key: "guestlist",  label: "Guest List", icon: "guestlist" },
    { key: "templates",  label: "Templates",  icon: "templates" },
    { key: "site-setup", label: "Site Setup", icon: "settings" },
    { key: "analytics",  label: "Analytics",  icon: "analytics" },
  ] as const;

  const initials = (user.name ?? user.email)
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="ds-shell">

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside className="ds-sidebar">

        {/* Logo */}
        <div className="ds-logo-area">
          <Link to="/" className="ds-logo-link">
            <span className="ds-logo-text"><em>Dreamy</em>Suite</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="ds-nav">
          {isEditor ? (
            /* ── Editor mode nav ── */
            <>
              <Link to="/" className="ds-nav-back">
                <svg className="ds-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                My Sites
              </Link>

              <span className="ds-nav-site-name">{site?.name}</span>

              <span className="ds-nav-section-label">Editor</span>

              {editorNavItems.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setSection(key)}
                  className={"ds-nav-item" + (currentSection === key ? " ds-active" : "")}
                >
                  <NavIcon name={icon} />
                  {label}
                </button>
              ))}
            </>
          ) : (
            /* ── Workspace mode nav ── */
            <>
              <span className="ds-nav-section-label">Workspace</span>
              <NavLink to="/" icon="grid">My Sites</NavLink>
              <NavLink to="/templates" icon="layout">Templates</NavLink>

              <span className="ds-nav-section-label">Account</span>
              <NavLink to="/settings" icon="settings">Settings</NavLink>
            </>
          )}
        </nav>

        {/* User */}
        <div className="ds-user-footer">
          <div className="ds-avatar">{initials}</div>
          <div className="ds-user-info">
            <span className="ds-user-name">{user.name ?? "Account"}</span>
            <span className="ds-user-email">{user.email}</span>
          </div>
        </div>
      </aside>

      {/* ── Main column ────────────────────────────────────── */}
      <div className="ds-main">
        <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    website: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>,
    media: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
    guestlist: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    templates: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /><path d="M12 13h4M12 16h2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2" /></>,
    analytics: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
    layout: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>,
  };

  return (
    <svg className="ds-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function NavLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link to={to} className="ds-nav-item">
      <NavIcon name={icon} />
      {children}
    </Link>
  );
}
