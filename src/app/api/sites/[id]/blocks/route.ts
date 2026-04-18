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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
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

  const page = await env.DB
    .prepare("SELECT id FROM page WHERE id = ? AND siteId = ?")
    .bind(pageId, siteId)
    .first<{ id: string }>();

  if (!page) {
    return apiError("NOT_FOUND", "Page not found in this site", 404);
  }

  const id = clientId || crypto.randomUUID();
  const now = Date.now();

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
    const maxOrder = await env.DB
      .prepare("SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM block WHERE pageId = ?")
      .bind(pageId)
      .first<{ maxOrder: number }>();
    resolvedOrder = (maxOrder?.maxOrder ?? -1) + 1;
  }

  await env.DB
    .prepare(
      "INSERT INTO block (id, siteId, pageId, type, config, sortOrder, isVisible, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)"
    )
    .bind(id, siteId, pageId, type, configStr, resolvedOrder, now, now)
    .run();

  const block = await env.DB
    .prepare("SELECT * FROM block WHERE id = ?")
    .bind(id)
    .first();

  return NextResponse.json({ block }, { status: 201 });
}
