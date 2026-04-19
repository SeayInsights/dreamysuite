import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";

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
  const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

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
  const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

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
    pages.map(async (page: PageRow) => {
      const blocksResult = await env.DB
        .prepare("SELECT * FROM block WHERE pageId = ? ORDER BY sortOrder ASC")
        .bind(page.id)
        .all<BlockRow>();
      return {
        ...page,
        blocks: blocksResult.results.map((b: BlockRow) => ({
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
