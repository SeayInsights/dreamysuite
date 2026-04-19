import { NextRequest, NextResponse } from "next/server";

// Paths under /api/sites/* that are intentionally public (no auth required)
// These are handled per-route; middleware skips them.
const PUBLIC_SITE_PATHS = [
  /^\/api\/public\//,
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only gate /api/sites/* routes
  if (!pathname.startsWith("/api/sites/")) {
    return NextResponse.next();
  }

  // Check for better-auth session cookie
  // better-auth sets a cookie named "better-auth.session_token" by default
  const sessionCookie =
    req.cookies.get("better-auth.session_token") ??
    req.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie?.value) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/sites/:path*"],
};
