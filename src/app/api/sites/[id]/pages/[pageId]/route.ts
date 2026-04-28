import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { z } from "zod";
import { requireSiteOwnership, apiOwnershipError, parseJsonBody } from "@/lib/api/site-auth";
import { getPageById, getBlocksByPageId } from "@/lib/db";

const PageUpdateSchema = z.object({
  label: z.string().max(100).optional(),
  isVisible: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const env = await getEnv();
  const { id: siteId, pageId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const page = await getPageById(env.DB, pageId);
  if (!page || page.siteId !== siteId) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Page not found" } }, { status: 404 });
  }

  const blocks = await getBlocksByPageId(env.DB, pageId);

  return NextResponse.json({ page, blocks });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const env = await getEnv();
  const { id: siteId, pageId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const page = await getPageById(env.DB, pageId);
  if (!page || page.siteId !== siteId) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Page not found" } }, { status: 404 });
  }

  const pageBlocks = await getBlocksByPageId(env.DB, pageId);

  // Use batch to delete page, blocks, and translations atomically
  const stmts = [
    env.DB.prepare("DELETE FROM page WHERE id = ?").bind(pageId),
    env.DB.prepare("DELETE FROM block WHERE pageId = ?").bind(pageId),
  ];
  for (const block of pageBlocks) {
    stmts.push(env.DB.prepare("DELETE FROM block_translation WHERE blockId = ?").bind(block.id));
  }
  await env.DB.batch(stmts);

  return NextResponse.json({ success: true });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const env = await getEnv();
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

  const parsed = await parseJsonBody<unknown>(req);
  if ("error" in parsed) return parsed.error;

  const result = PageUpdateSchema.safeParse(parsed.body);
  if (!result.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: result.error.issues[0]?.message ?? "Invalid request body" } },
      { status: 400 },
    );
  }

  const body = result.data;

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
