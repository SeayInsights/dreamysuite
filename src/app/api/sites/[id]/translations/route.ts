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
    .prepare("SELECT blockId, lang, field, value FROM block_translation WHERE siteId = ?")
    .bind(siteId)
    .all<{ blockId: string; lang: string; field: string; value: string }>();

  return NextResponse.json({ rows: result.results });
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

  let body: { rows?: { blockId: string; lang: string; field: string; value: string }[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 },
    );
  }

  const rows = body.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "rows array required" } },
      { status: 400 },
    );
  }
  if (rows.length > 200) {
    return NextResponse.json(
      { error: { code: "PAYLOAD_TOO_LARGE", message: "rows array exceeds 200 items." } },
      { status: 400 },
    );
  }

  // Verify all supplied blockIds belong to this site
  const uniqueBlockIds = [...new Set(rows.map((r) => r.blockId))];
  const placeholders = uniqueBlockIds.map(() => "?").join(",");
  const owned = await env.DB
    .prepare(`SELECT id FROM block WHERE id IN (${placeholders}) AND siteId = ?`)
    .bind(...uniqueBlockIds, siteId)
    .all<{ id: string }>();
  if (owned.results.length !== uniqueBlockIds.length) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "One or more blockIds do not belong to this site." } },
      { status: 403 },
    );
  }

  const now = Date.now();
  const stmts = rows.map((r) =>
    env.DB
      .prepare(
        `INSERT INTO block_translation (id, siteId, blockId, lang, field, value, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (blockId, lang, field) DO UPDATE SET
           value = excluded.value,
           updatedAt = excluded.updatedAt`,
      )
      .bind(crypto.randomUUID(), siteId, r.blockId, r.lang, r.field, r.value, now),
  );

  await env.DB.batch(stmts);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const url = new URL(req.url);
  const blockId = url.searchParams.get("blockId");

  if (blockId) {
    await env.DB
      .prepare("DELETE FROM block_translation WHERE siteId = ? AND blockId = ?")
      .bind(siteId, blockId)
      .run();
  } else {
    await env.DB
      .prepare("DELETE FROM block_translation WHERE siteId = ?")
      .bind(siteId)
      .run();
  }

  return NextResponse.json({ ok: true });
}
