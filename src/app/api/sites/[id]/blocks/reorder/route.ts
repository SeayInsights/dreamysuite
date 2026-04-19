import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/app/lib/auth.server";
import {
  requireSiteOwnership,
  apiOwnershipError,
  apiError,
  parseJsonBody,
} from "@/lib/api/site-auth";

interface ReorderItem {
  id: string;
  sortOrder: number;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const parsed = await parseJsonBody<{ blocks?: unknown }>(req);
  if ("error" in parsed) return parsed.error;

  const { blocks } = parsed.body;

  if (!Array.isArray(blocks) || blocks.length === 0) {
    return apiError("BAD_REQUEST", "blocks must be a non-empty array", 400);
  }

  if (blocks.length > 100) {
    return apiError("BAD_REQUEST", "blocks array must not exceed 100 items", 400);
  }

  for (let i = 0; i < blocks.length; i++) {
    const item = blocks[i] as Record<string, unknown>;
    if (typeof item?.id !== "string" || item.id.trim() === "") {
      return apiError(
        "VALIDATION_ERROR",
        `blocks[${i}].id must be a non-empty string`,
        400,
      );
    }
    if (typeof item?.sortOrder !== "number" || !Number.isFinite(item.sortOrder)) {
      return apiError(
        "VALIDATION_ERROR",
        `blocks[${i}].sortOrder must be a finite number`,
        400,
      );
    }
  }

  const validBlocks = blocks as ReorderItem[];

  const stmts = validBlocks.map((b) =>
    env.DB.prepare(
      "UPDATE block SET sortOrder = ?, updatedAt = ? WHERE id = ? AND siteId = ?",
    ).bind(b.sortOrder, Date.now(), b.id, siteId),
  );

  await env.DB.batch(stmts);

  return NextResponse.json({ ok: true, updated: validBlocks.length });
}
