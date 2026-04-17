import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/app/lib/auth.server";
import {
  requireSiteOwnership,
  apiOwnershipError,
  apiError,
  parseJsonBody,
} from "@/lib/api/site-auth";
import { parseBlockConfig } from "@/lib/schemas/blocks";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId, blockId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const block = await env.DB
    .prepare("SELECT id FROM block WHERE id = ? AND siteId = ?")
    .bind(blockId, siteId)
    .first<{ id: string }>();

  if (!block) {
    return apiError("NOT_FOUND", "Block not found", 404);
  }

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
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId, blockId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const block = await env.DB
    .prepare("SELECT id, type FROM block WHERE id = ? AND siteId = ?")
    .bind(blockId, siteId)
    .first<{ id: string; type: string }>();

  if (!block) {
    return apiError("NOT_FOUND", "Block not found", 404);
  }

  const parsed = await parseJsonBody<{
    config?: unknown;
    sortOrder?: number;
    isVisible?: boolean;
  }>(req);
  if ("error" in parsed) return parsed.error;
  const body = parsed.body;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.config !== undefined) {
    const configParse = parseBlockConfig(block.type, body.config);
    if (!configParse.ok) {
      console.warn(
        `[blocks:PUT blockId=${blockId} type=${block.type}] invalid config: ${configParse.error}`,
      );
    }
    const configValue = configParse.ok ? configParse.config : configParse.fallback;
    fields.push(`"config" = ?`);
    values.push(JSON.stringify(configValue));
  }
  if (body.sortOrder !== undefined) {
    fields.push(`"sortOrder" = ?`);
    values.push(body.sortOrder);
  }
  if (body.isVisible !== undefined) {
    fields.push(`"isVisible" = ?`);
    values.push(body.isVisible ? 1 : 0);
  }

  if (fields.length === 0) {
    return apiError("BAD_REQUEST", "No fields to update", 400);
  }

  fields.push(`"updatedAt" = ?`);
  values.push(Date.now());
  values.push(blockId);

  await env.DB
    .prepare(`UPDATE block SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await env.DB
    .prepare("SELECT * FROM block WHERE id = ?")
    .bind(blockId)
    .first();

  return NextResponse.json({ block: updated });
}
