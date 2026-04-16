import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth, type Env } from "@/app/lib/auth.server";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const typedEnv = env as unknown as Env;

  // 1. Check env
  const envCheck = {
    AUTH_SECRET: typedEnv.AUTH_SECRET ? `set (${typedEnv.AUTH_SECRET.length} chars)` : "MISSING",
    APP_URL: typedEnv.APP_URL ?? "MISSING",
    DB: typedEnv.DB ? "bound" : "MISSING",
  };

  // 2. Check cookies from raw request
  const cookieHeader = req.headers.get("cookie") ?? "(none)";
  const sessionCookie = req.cookies.get("__Secure-better-auth.session_token")?.value
    ?? req.cookies.get("better-auth.session_token")?.value
    ?? "(not found)";

  // 3. Try getSession via better-auth using Next.js headers
  const auth = createAuth(typedEnv);
  const requestHeaders = await headers();
  let sessionResult: unknown = null;
  let sessionError: string | null = null;
  try {
    sessionResult = await auth.api.getSession({ headers: requestHeaders });
  } catch (err) {
    sessionError = err instanceof Error ? err.message : String(err);
  }

  // 4. Try getSession via raw request headers
  let rawSessionResult: unknown = null;
  let rawSessionError: string | null = null;
  try {
    rawSessionResult = await auth.api.getSession({ headers: req.headers });
  } catch (err) {
    rawSessionError = err instanceof Error ? err.message : String(err);
  }

  // 5. Direct D1 session lookup (bypass better-auth)
  let d1Session: unknown = null;
  if (sessionCookie && sessionCookie !== "(not found)") {
    // Token is before the first dot (if signed) or the whole value
    const token = sessionCookie.split(".")[0];
    try {
      const result = await typedEnv.DB
        .prepare("SELECT id, token, userId, expiresAt FROM session WHERE token = ?")
        .bind(token)
        .first();
      d1Session = result ?? "no row found";
    } catch (err) {
      d1Session = `D1 error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return NextResponse.json({
    envCheck,
    cookieHeader: cookieHeader.slice(0, 200),
    sessionCookie: sessionCookie.slice(0, 60),
    betterAuth_nextHeaders: sessionResult ?? `null (error: ${sessionError})`,
    betterAuth_rawHeaders: rawSessionResult ?? `null (error: ${rawSessionError})`,
    d1DirectLookup: d1Session,
  });
}
