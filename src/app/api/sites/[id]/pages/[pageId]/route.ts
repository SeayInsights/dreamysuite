import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/app/lib/auth.server";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId, pageId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const page = await env.DB
    .prepare("SELECT * FROM page WHERE id = ? AND siteId = ?")
    .bind(pageId, siteId)
    .first();

  if (!page) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Page not found" } }, { status: 404 });
  }

  const blocks = await env.DB
    .prepare("SELECT * FROM block WHERE pageId = ? ORDER BY sortOrder ASC")
    .bind(pageId)
    .all();

  return NextResponse.json({ page, blocks: blocks.results });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId, pageId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const page = await env.DB
    .prepare("SELECT * FROM page WHERE id = ? AND siteId = ?")
    .bind(pageId, siteId)
    .first();

  if (!page) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Page not found" } }, { status: 404 });
  }

  const pageBlocks = await env.DB
    .prepare("SELECT id FROM block WHERE pageId = ?")
    .bind(pageId)
    .all<{ id: string }>();

  const stmts = [
    env.DB.prepare("DELETE FROM page WHERE id = ?").bind(pageId),
    env.DB.prepare("DELETE FROM block WHERE pageId = ?").bind(pageId),
  ];
  for (const b of pageBlocks.results) {
    stmts.push(env.DB.prepare("DELETE FROM block_translation WHERE blockId = ?").bind(b.id));
  }
  await env.DB.batch(stmts);

  return NextResponse.json({ success: true });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId, pageId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const page = await env.DB
    .prepare("SELECT * FROM page WHERE id = ? AND siteId = ?")
    .bind(pageId, siteId)
    .first();

  if (!page) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Page not found" } }, { status: 404 });
  }

  let body: { label?: string; isVisible?: boolean; isLocked?: boolean; sortOrder?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, { status: 400 });
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.label !== undefined) { fields.push("label = ?"); values.push(body.label); }
  if (body.isVisible !== undefined) { fields.push("isVisible = ?"); values.push(body.isVisible ? 1 : 0); }
  if (body.isLocked !== undefined) { fields.push("isLocked = ?"); values.push(body.isLocked ? 1 : 0); }
  if (body.sortOrder !== undefined) { fields.push("sortOrder = ?"); values.push(body.sortOrder); }

  if (fields.length === 0) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "No fields to update" } }, { status: 400 });
  }

  fields.push("updatedAt = ?");
  values.push(Date.now());
  values.push(pageId);

  await env.DB
    .prepare(`UPDATE page SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await env.DB
    .prepare("SELECT * FROM page WHERE id = ?")
    .bind(pageId)
    .first();

  return NextResponse.json({ page: updated });
}
