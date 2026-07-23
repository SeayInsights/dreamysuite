"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogoutButton } from "@/app/components/LogoutButton";
import { usePathname } from "next/navigation";

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

export default function DashboardShell({
  user,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  // Detect editor mode: /sites/[id] (a real site id, not the /sites/new form).
  // The editor route renders editor-v2, a self-contained fixed-inset-0 shell
  // with its own TopBar (Back to dashboard) + SidebarNav — so DashboardShell
  // must NOT wrap it (that produced a second, non-functional left nav).
  const pathMatch = pathname.match(/^\/sites\/([^/]+)$/);
  const editorSiteId = pathMatch?.[1] === "new" ? null : pathMatch?.[1];
  const isEditor = Boolean(editorSiteId);

  if (isEditor) {
    return <>{children}</>;
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
          <span className="ds-nav-section-label">Workspace</span>
          <NavLink href="/sites" icon="grid">
            My Sites
          </NavLink>
          <NavLink href="/templates" icon="layout">
            Templates
          </NavLink>
          <span className="ds-nav-section-label">Account</span>
          <NavLink href="/settings" icon="settings">
            Settings
          </NavLink>
        </nav>
        <div
          className="ds-user-footer-wrap"
          ref={menuRef}
          style={{ position: "relative" }}
        >
          {menuOpen && (
            <div
              role="menu"
              style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1px solid #e8e4e0",
                borderRadius: 10,
                boxShadow: "0 10px 28px rgba(0,0,0,0.14)",
                padding: 6,
                zIndex: 60,
              }}
            >
              <LogoutButton
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  width: "100%",
                  padding: "0.55rem 0.7rem",
                  background: "none",
                  border: "none",
                  borderRadius: 7,
                  cursor: "pointer",
                  font: "inherit",
                  fontSize: "0.875rem",
                  color: "#292524",
                  textAlign: "left",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Log out
              </LogoutButton>
            </div>
          )}
          <div
            className="ds-user-footer"
            role="button"
            tabIndex={0}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setMenuOpen((o) => !o);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <div className="ds-avatar">{initials}</div>
            <div className="ds-user-info">
              <span className="ds-user-name">{user.name ?? "Account"}</span>
              <span className="ds-user-email">{user.email}</span>
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginLeft: "auto", opacity: 0.5, flexShrink: 0 }}
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
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
            overflowY: "auto",
            overflowX: "hidden",
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
    website: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </>
    ),
    media: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </>
    ),
    guestlist: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    templates: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
        <path d="M12 13h4M12 16h2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2" />
      </>
    ),
    analytics: (
      <>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </>
    ),
    layout: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </>
    ),
  };

  return (
    <svg
      className="ds-nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
