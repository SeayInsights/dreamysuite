import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import {
  requireSiteOwnership,
  apiOwnershipError,
  apiError,
  parseJsonBody,
} from "@/lib/api/site-auth";
import { parseBlockConfig } from "@/lib/validation";
import { getBlockById, updateBlock } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  const env = await getEnv();
  const { id: siteId, blockId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const block = await getBlockById(env.DB, blockId);
  if (!block || block.siteId !== siteId) {
    return apiError("NOT_FOUND", "Block not found", 404);
  }

  // Use batch to delete block and translations atomically
  await env.DB.batch([
    env.DB.prepare("DELETE FROM block WHERE id = ?").bind(blockId),
    env.DB.prepare("DELETE FROM block_translation WHERE blockId = ?").bind(blockId),
  ]);

  return NextResponse.json({ success: true });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  const env = await getEnv();
  const { id: siteId, blockId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const block = await getBlockById(env.DB, blockId);
  if (!block || block.siteId !== siteId) {
    return apiError("NOT_FOUND", "Block not found", 404);
  }

  const parsed = await parseJsonBody<{
    type?: string;
    config?: unknown;
    overrides?: unknown;
    sortOrder?: number;
    isVisible?: boolean;
  }>(req);
  if ("error" in parsed) return parsed.error;
  const body = parsed.body;

  const updateData: { type?: string; config?: string; sortOrder?: number; isVisible?: number } = {};

  if (body.type !== undefined && body.type !== block.type) {
    updateData.type = body.type;
  }

  if (body.config !== undefined) {
    const configParse = parseBlockConfig(block.type, body.config);
    if (!configParse.ok) {
      console.warn(
        `[blocks:PUT blockId=${blockId} type=${block.type}] invalid config: ${configParse.error}`,
      );
    }
    const configValue = configParse.ok ? configParse.config : configParse.fallback;
    updateData.config = JSON.stringify(configValue);
  }

  // Note: overrides field not currently in updateBlock function - handle separately if needed
  if (body.overrides !== undefined) {
    // TODO: Add overrides support to updateBlock function
    console.warn('[blocks:PUT] overrides field not yet supported in query layer');
  }

  if (body.sortOrder !== undefined) {
    updateData.sortOrder = body.sortOrder;
  }

  if (body.isVisible !== undefined) {
    updateData.isVisible = body.isVisible ? 1 : 0;
  }

  if (Object.keys(updateData).length === 0 && body.overrides === undefined) {
    return apiError("BAD_REQUEST", "No fields to update", 400);
  }

  const updated = await updateBlock(env.DB, blockId, updateData);

  return NextResponse.json({ block: updated });
}
