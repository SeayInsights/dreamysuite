import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/app/lib/auth.server";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

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
  if ("error" in check) return apiOwnershipError(check);

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
