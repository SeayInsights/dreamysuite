import { NextRequest, NextResponse } from "next/server";

/**
 * Host-based routing for per-site subdomains.
 *
 * `yoursite.dreamysuite.com/` is rewritten to the `/[slug]` renderer (slug =
 * subdomain), so every site is reachable at its own subdomain in addition to
 * `dreamysuite.com/<slug>`.
 *
 * Fail-safe by construction: ONLY a clean single-label subdomain of
 * dreamysuite.com (that isn't reserved) is rewritten. The apex host, www,
 * localhost, reserved names, and any other host pass straight through — so a
 * mismatch can never take down the primary app. Custom domains are handled
 * separately (a later change); they fall through to `next()` here.
 */

const ROOT_HOST = "dreamysuite.com";

// Subdomains that belong to the app/infrastructure, not to a site.
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "fallback",
  "mail",
  "static",
  "assets",
  "cdn",
]);

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const { pathname } = req.nextUrl;

  // Main app host → leave untouched (dashboard, landing, /[slug], etc.).
  if (host === ROOT_HOST || host === "localhost" || host === "") {
    return NextResponse.next();
  }

  // Per-site subdomain of dreamysuite.com → render the site whose slug === sub.
  if (host.endsWith("." + ROOT_HOST)) {
    const sub = host.slice(0, host.length - (ROOT_HOST.length + 1));
    if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) {
      return NextResponse.next();
    }
    if (pathname !== "/") return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = `/${sub}`;
    return NextResponse.rewrite(url);
  }

  // Any other host that reached the Worker is a connected custom domain — route
  // its root to the renderer, which resolves it to a site by customDomain.
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/__host__";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  // Run on page navigations only — never on framework internals, API routes,
  // effect bundles, or static assets.
  matcher: [
    "/((?!_next/|api/|effects/|assets/|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
