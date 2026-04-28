import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import {
  requireSiteOwnership,
  apiOwnershipError,
  apiError,
  parseJsonBody,
} from "@/lib/api/site-auth";
import { parseBlockConfig } from "@/lib/validation";
import { getPageById, getMaxBlockSortOrder, createBlock } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const parsed = await parseJsonBody<{
    id?: string;
    pageId?: string;
    type?: string;
    config?: unknown;
    sortOrder?: number;
  }>(req);
  if ("error" in parsed) return parsed.error;

  const { id: clientId, pageId, type, config, sortOrder } = parsed.body;
  if (!pageId || !type) {
    return apiError("BAD_REQUEST", "pageId and type are required", 400);
  }
  if (sortOrder !== undefined && (typeof sortOrder !== "number" || !Number.isInteger(sortOrder) || sortOrder < 0)) {
    return apiError("VALIDATION_ERROR", "sortOrder must be a non-negative integer.", 400);
  }

  const page = await getPageById(env.DB, pageId);
  if (!page || page.siteId !== siteId) {
    return apiError("NOT_FOUND", "Page not found in this site", 404);
  }

  const configParse = parseBlockConfig(type, config);
  if (!configParse.ok) {
    console.warn(
      `[blocks:POST siteId=${siteId} pageId=${pageId} type=${type}] invalid config: ${configParse.error}`,
    );
  }
  const configStr = JSON.stringify(
    configParse.ok ? configParse.config : configParse.fallback,
  );

  let resolvedOrder = sortOrder;
  if (resolvedOrder === undefined) {
    const maxOrder = await getMaxBlockSortOrder(env.DB, pageId);
    resolvedOrder = maxOrder + 1;
  }

  const block = await createBlock(env.DB, {
    id: clientId,
    siteId,
    pageId,
    type,
    config: configStr,
    sortOrder: resolvedOrder,
  });

  return NextResponse.json({ block }, { status: 201 });
}
