import { NextRequest, NextResponse } from "next/server";
import { type Env } from "@/app/lib/auth.server";
import { getSession } from "@/lib/api/get-session";

export type ApiError = { code: string; message: string };
export type OwnershipResult =
  | { userId: string }
  | { error: ApiError; status: 401 | 403 };

export type OwnerResult =
  | { userId: string; userName: string; siteName: string }
  | { error: ApiError; status: 401 | 403 };

export async function requireSiteOwnership(
  req: NextRequest,
  env: Env,
  siteId: string,
): Promise<OwnershipResult> {
  const session = await getSession(req.headers, env);
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

export async function requireSiteOwner(
  req: NextRequest,
  env: Env,
  siteId: string,
): Promise<OwnerResult> {
  const session = await getSession(req.headers, env);
  if (!session) {
    return {
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      status: 401,
    };
  }
  const site = await env.DB
    .prepare("SELECT name FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ name: string }>();
  if (!site) {
    return {
      error: { code: "FORBIDDEN", message: "Site not found or access denied" },
      status: 403,
    };
  }
  return {
    userId: session.user.id,
    userName: session.user.name ?? session.user.email,
    siteName: site.name,
  };
}

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function apiOwnershipError(
  result: { error: ApiError; status: 401 | 403 },
) {
  return NextResponse.json({ error: result.error }, { status: result.status });
}

export async function parseJsonBody<T = unknown>(
  req: NextRequest,
): Promise<{ body: T } | { error: NextResponse }> {
  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > 1_048_576) {
    return { error: apiError("PAYLOAD_TOO_LARGE", "Request body must be 1 MB or less.", 413) };
  }
  try {
    const body = (await req.json()) as T;
    return { body };
  } catch {
    return {
      error: apiError("BAD_REQUEST", "Invalid JSON body", 400),
    };
  }
}
