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

interface PageRow {
  id: string;
  siteId: string;
  slug: string;
  label: string;
  isVisible: number;
  isLocked: number;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

interface BlockRow {
  id: string;
  siteId: string;
  pageId: string;
  type: string;
  config: string;
  sortOrder: number;
  isVisible: number;
  createdAt: number;
  updatedAt: number;
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
    .prepare("SELECT * FROM site_template WHERE siteId = ? ORDER BY createdAt DESC")
    .bind(siteId)
    .all();

  return NextResponse.json({ templates: result.results });
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

  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, { status: 400 });
  }

  if (!body.name) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "name is required" } }, { status: 400 });
  }

  // Build snapshot: all pages with their blocks
  const pagesResult = await env.DB
    .prepare("SELECT * FROM page WHERE siteId = ? ORDER BY sortOrder ASC")
    .bind(siteId)
    .all<PageRow>();

  const pages = pagesResult.results;

  const pagesWithBlocks = await Promise.all(
    pages.map(async (page) => {
      const blocksResult = await env.DB
        .prepare("SELECT * FROM block WHERE pageId = ? ORDER BY sortOrder ASC")
        .bind(page.id)
        .all<BlockRow>();
      return {
        ...page,
        blocks: blocksResult.results.map((b) => ({
          ...b,
          config: (() => { try { return JSON.parse(b.config); } catch { return {}; } })(),
        })),
      };
    })
  );

  const settingsRow = await env.DB
    .prepare("SELECT * FROM site_setting WHERE siteId = ?")
    .bind(siteId)
    .first();

  const snapshot = JSON.stringify({ pages: pagesWithBlocks, settings: settingsRow ?? null });
  const id = crypto.randomUUID();
  const now = Date.now();

  await env.DB
    .prepare("INSERT INTO site_template (id, siteId, name, snapshot, isPublished, createdAt) VALUES (?, ?, ?, ?, 0, ?)")
    .bind(id, siteId, body.name, snapshot, now)
    .run();

  const template = await env.DB
    .prepare("SELECT * FROM site_template WHERE id = ?")
    .bind(id)
    .first();

  return NextResponse.json({ template }, { status: 201 });
}
