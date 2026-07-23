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

  // Not a subdomain of the root → leave untouched (apex, localhost, custom
  // domains, etc.).
  if (!host.endsWith("." + ROOT_HOST)) {
    return NextResponse.next();
  }

  const sub = host.slice(0, host.length - (ROOT_HOST.length + 1));
  if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) {
    return NextResponse.next();
  }

  // Only the site page itself (root path) maps to the site; other paths on the
  // subdomain (assets/api are already excluded by the matcher) pass through.
  if (req.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${sub}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Run on page navigations only — never on framework internals, API routes,
  // effect bundles, or static assets.
  matcher: [
    "/((?!_next/|api/|effects/|assets/|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
