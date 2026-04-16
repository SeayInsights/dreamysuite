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

  const url = new URL(req.url);
  const mediaType = url.searchParams.get("type") ?? "video";

  const result = await env.DB
    .prepare("SELECT * FROM media_item WHERE siteId = ? AND mediaType = ? ORDER BY sortOrder ASC, createdAt DESC")
    .bind(siteId, mediaType)
    .all();

  return NextResponse.json({ items: result.results });
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

  const body = await req.json() as { url?: string; title?: string; mediaType?: string };

  if (!body.url || !body.url.trim()) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "url is required" } }, { status: 400 });
  }

  const mediaType = body.mediaType ?? "video";
  if (!["video", "music"].includes(mediaType)) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "mediaType must be video or music" } }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  const maxOrder = await env.DB
    .prepare("SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM media_item WHERE siteId = ? AND mediaType = ?")
    .bind(siteId, mediaType)
    .first<{ maxOrder: number }>();

  const sortOrder = (maxOrder?.maxOrder ?? -1) + 1;

  await env.DB
    .prepare("INSERT INTO media_item (id, siteId, mediaType, url, title, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, siteId, mediaType, body.url.trim(), body.title?.trim() ?? null, sortOrder, now)
    .run();

  const item = await env.DB
    .prepare("SELECT * FROM media_item WHERE id = ?")
    .bind(id)
    .first();

  return NextResponse.json({ item }, { status: 201 });
}
