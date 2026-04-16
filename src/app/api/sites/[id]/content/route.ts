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
    .prepare("SELECT pageSlug, lang, content FROM site_content WHERE siteId = ? ORDER BY pageSlug ASC, lang ASC")
    .bind(siteId)
    .all<{ pageSlug: string; lang: string; content: string }>();

  const rows = result.results.map((row: { pageSlug: string; lang: string; content: string }) => {
    let parsed: unknown = {};
    try { parsed = JSON.parse(row.content); } catch { /* keep empty */ }
    return { pageSlug: row.pageSlug, lang: row.lang, content: parsed };
  });

  return NextResponse.json({ content: rows });
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

  let body: { pageSlug?: string; lang?: string; content?: unknown };
  try {
    body = await req.json() as { pageSlug?: string; lang?: string; content?: unknown };
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid JSON" } }, { status: 400 });
  }

  const { pageSlug, lang, content } = body;
  if (!pageSlug || !lang) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "pageSlug and lang are required" } }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  const contentStr = JSON.stringify(content ?? {});

  await env.DB
    .prepare(`
      INSERT INTO site_content (id, siteId, pageSlug, lang, content, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (siteId, pageSlug, lang) DO UPDATE SET
        content = excluded.content,
        updatedAt = excluded.updatedAt
    `)
    .bind(id, siteId, pageSlug, lang, contentStr, now)
    .run();

  return NextResponse.json({ ok: true });
}
