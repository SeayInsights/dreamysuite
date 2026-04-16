import { NextRequest, NextResponse } from "next/server";
import { createAuth, type Env } from "@/app/lib/auth.server";

export type ApiError = { code: string; message: string };
export type OwnershipResult =
  | { userId: string }
  | { error: ApiError; status: 401 | 403 };

export async function requireSiteOwnership(
  req: NextRequest,
  env: Env,
  siteId: string,
): Promise<OwnershipResult> {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return {
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      status: 401,
    };
  }
  const site = await env.DB
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string }>();
  if (site) return { userId: session.user.id };

  const invite = await env.DB
    .prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
    .bind(siteId, session.user.email.toLowerCase())
    .first<{ id: string }>();
  if (invite) return { userId: session.user.id };

  return {
    error: { code: "FORBIDDEN", message: "Site not found or access denied" },
    status: 403,
  };
}

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function apiOwnershipError(result: Extract<OwnershipResult, { error: ApiError }>) {
  return NextResponse.json({ error: result.error }, { status: result.status });
}

export async function parseJsonBody<T = unknown>(
  req: NextRequest,
): Promise<{ body: T } | { error: NextResponse }> {
  try {
    const body = (await req.json()) as T;
    return { body };
  } catch {
    return {
      error: apiError("BAD_REQUEST", "Invalid JSON body", 400),
    };
  }
}
