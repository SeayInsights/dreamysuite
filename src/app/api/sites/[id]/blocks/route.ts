import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth, type Env } from "@/app/lib/auth.server";

async function requireSiteOwnership(
  req: NextRequest,
  env: Env,
  siteId: string
) {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return { error: { code: "UNAUTHORIZED", message: "Not authenticated" }, status: 401 as const };
  }
  const _db = env.DB;
  const site = await _db
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string }>();
  if (site) return { userId: session.user.id };
  const invite = await _db
    .prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
    .bind(siteId, session.user.email.toLowerCase())
    .first<{ id: string }>();
  if (invite) return { userId: session.user.id };
  return { error: { code: "FORBIDDEN", message: "Site not found or access denied" }, status: 403 as const };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return NextResponse.json(check, { status: check.status });

  let body: { pageId?: string; type?: string; config?: unknown; sortOrder?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, { status: 400 });
  }

  const { pageId, type, config, sortOrder } = body;
  if (!pageId || !type) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "pageId and type are required" } }, { status: 400 });
  }

  // Verify the page belongs to this site
  const page = await env.DB
    .prepare("SELECT id FROM page WHERE id = ? AND siteId = ?")
    .bind(pageId, siteId)
    .first<{ id: string }>();

  if (!page) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Page not found in this site" } }, { status: 404 });
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  const configStr = config !== undefined ? JSON.stringify(config) : "{}";

  let resolvedOrder = sortOrder;
  if (resolvedOrder === undefined) {
    const maxOrder = await env.DB
      .prepare("SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM block WHERE pageId = ?")
      .bind(pageId)
      .first<{ maxOrder: number }>();
    resolvedOrder = (maxOrder?.maxOrder ?? -1) + 1;
  }

  await env.DB
    .prepare(
      "INSERT INTO block (id, siteId, pageId, type, config, sortOrder, isVisible, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)"
    )
    .bind(id, siteId, pageId, type, configStr, resolvedOrder, now, now)
    .run();

  const block = await env.DB
    .prepare("SELECT * FROM block WHERE id = ?")
    .bind(id)
    .first();

  return NextResponse.json({ block }, { status: 201 });
}
