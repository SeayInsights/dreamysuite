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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return NextResponse.json(check, { status: check.status });

  const result = await env.DB
    .prepare("SELECT * FROM page WHERE siteId = ? ORDER BY sortOrder ASC")
    .bind(siteId)
    .all();

  return NextResponse.json({ pages: result.results });
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

  let body: { slug?: string; label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, { status: 400 });
  }

  const { slug, label } = body;
  if (!slug || !label) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "slug and label are required" } }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  const maxOrder = await env.DB
    .prepare("SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM page WHERE siteId = ?")
    .bind(siteId)
    .first<{ maxOrder: number }>();

  const sortOrder = (maxOrder?.maxOrder ?? -1) + 1;

  try {
    await env.DB
      .prepare(
        "INSERT INTO page (id, siteId, slug, label, isVisible, isLocked, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, 0, ?, ?, ?)"
      )
      .bind(id, siteId, slug, label, sortOrder, now, now)
      .run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) {
      return NextResponse.json({ error: { code: "CONFLICT", message: "A page with that slug already exists" } }, { status: 409 });
    }
    console.error("[api/sites/[id]/pages POST]", msg);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create page" } }, { status: 500 });
  }

  const page = await env.DB
    .prepare("SELECT * FROM page WHERE id = ?")
    .bind(id)
    .first();

  return NextResponse.json({ page }, { status: 201 });
}
