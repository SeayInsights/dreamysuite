import { createAuth, type Env } from "@/app/lib/auth.server";

interface SessionUser {
  id: string;
  email: string;
  name?: string;
}

export interface SessionResult {
  user: SessionUser;
  session: { id: string; token: string; expiresAt: string };
}

/**
 * Verifies the session by routing through auth.handler() instead of
 * auth.api.getSession(). The latter relies on AsyncLocalStorage which
 * doesn't propagate reliably on Cloudflare Workers, causing
 * "No request state found" errors.
 */
export async function getSession(
  headers: Headers,
  env: Env,
): Promise<SessionResult | null> {
  try {
    const auth = createAuth(env);
    const baseURL = env.APP_URL || "https://dreamysuite.com";
    const res = await auth.handler(
      new Request(`${baseURL}/api/auth/get-session`, { headers }),
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && typeof data === "object" && "user" in data) {
      return data as SessionResult;
    }
    return null;
  } catch (e) {
    console.error("[getSession] auth.handler threw:", e instanceof Error ? e.message : String(e));
    return null;
  }
}
