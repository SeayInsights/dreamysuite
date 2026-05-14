import { NextRequest, NextResponse } from "next/server";

// /api/sites/* sub-paths that must remain public (no session required).
const PUBLIC_SITE_API_PATHS = [/^\/api\/sites\/[^/]+\/guestbook(\/.*)?$/];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only gate /api/sites/* routes.
  if (!pathname.startsWith("/api/sites/")) {
    return NextResponse.next();
  }

  // Allow explicitly public sub-paths before checking auth.
  if (PUBLIC_SITE_API_PATHS.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

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
