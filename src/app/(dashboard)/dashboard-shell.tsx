"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

interface User {
  name?: string | null;
  email: string;
}

interface SiteData {
  name: string;
  slug: string;
  customDomain?: string | null;
}

interface DashboardShellProps {
  user: User;
  children: React.ReactNode;
  // Optional: editor pages can pass site data via prop drilling or context (Task 2.7)
  site?: SiteData;
}

const editorNavItems = [
  { key: "website", label: "Website", icon: "website" },
  { key: "media", label: "Media", icon: "media" },
  { key: "guestlist", label: "Guest List", icon: "guestlist" },
  { key: "templates", label: "Templates", icon: "templates" },
  { key: "site-setup", label: "Site Setup", icon: "settings" },
  { key: "analytics", label: "Analytics", icon: "analytics" },
] as const;

export default function DashboardShell({ user, children, site }: DashboardShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Detect editor mode: /sites/[id] pattern
  const pathMatch = pathname.match(/^\/sites\/([^/]+)$/);
  const isEditor = Boolean(pathMatch?.[1]);
  const currentSection = searchParams.get("s") ?? "website";

  function setSection(s: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("s", s);
    router.push(`${pathname}?${params.toString()}`);
  }

  const initials = (user.name ?? user.email)
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="ds-shell">
      <aside className="ds-sidebar">
        <div className="ds-logo-area">
          <Link href="/" className="ds-logo-link">
            <span className="ds-logo-text">
              <em>Dreamy</em>Suite
            </span>
          </Link>
        </div>
        <nav className="ds-nav">
          {isEditor ? (
            <>
              <Link href="/" className="ds-nav-back">
                <svg
                  className="ds-nav-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                My Sites
              </Link>
              {site?.name && (
                <span className="ds-nav-site-name">{site.name}</span>
              )}
              <span className="ds-nav-section-label">Editor</span>
              {editorNavItems.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setSection(key)}
                  className={
                    "ds-nav-item" + (currentSection === key ? " ds-active" : "")
                  }
                >
                  <NavIcon name={icon} />
                  {label}
                </button>
              ))}
            </>
          ) : (
            <>
              <span className="ds-nav-section-label">Workspace</span>
              <NavLink href="/" icon="grid">
                My Sites
              </NavLink>
              <NavLink href="/templates" icon="layout">
                Templates
              </NavLink>
              <span className="ds-nav-section-label">Account</span>
              <NavLink href="/settings" icon="settings">
                Settings
              </NavLink>
            </>
          )}
        </nav>
        <div className="ds-user-footer">
          <div className="ds-avatar">{initials}</div>
          <div className="ds-user-info">
            <span className="ds-user-name">{user.name ?? "Account"}</span>
            <span className="ds-user-email">{user.email}</span>
          </div>
        </div>
      </aside>
      <div className="ds-main">
        <main
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NavIcon — renders SVG icons for the sidebar
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// NavLink — sidebar link with an icon
// ---------------------------------------------------------------------------

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={"ds-nav-item" + (isActive ? " ds-active" : "")}
    >
      <NavIcon name={icon} />
      {children}
    </Link>
  );
}
