import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { z } from "zod";
import { requireSiteOwnership, apiOwnershipError, parseJsonBody } from "@/lib/api/site-auth";

const MediaCreateSchema = z.object({
  url: z.string().url().max(2048).refine(
    (u) => new URL(u).protocol === "https:",
    { message: "URL must use HTTPS" }
  ),
  title: z.string().max(200).optional(),
  mediaType: z.enum(["video", "music"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const url = new URL(req.url);
  const mediaType = url.searchParams.get("type") ?? "video";

  const result = await env.DB
    .prepare("SELECT * FROM media_item WHERE siteId = ? AND mediaType = ? ORDER BY sortOrder ASC, createdAt DESC")
    .bind(siteId, mediaType)
    .all();

  return NextResponse.json({ items: result.results });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const parsed = await parseJsonBody<unknown>(req);
  if ("error" in parsed) return parsed.error;

  const result = MediaCreateSchema.safeParse(parsed.body);
  if (!result.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: result.error.issues[0]?.message ?? "Invalid request body" } },
      { status: 400 },
    );
  }

  const { url: bodyUrl, title: bodyTitle, mediaType: rawMediaType } = result.data;
  const mediaType = rawMediaType ?? "video";

  const id = crypto.randomUUID();
  const now = Date.now();

  const maxOrder = await env.DB
    .prepare("SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM media_item WHERE siteId = ? AND mediaType = ?")
    .bind(siteId, mediaType)
    .first<{ maxOrder: number }>();

  const sortOrder = (maxOrder?.maxOrder ?? -1) + 1;

  const item = await env.DB
    .prepare("INSERT INTO media_item (id, siteId, mediaType, url, title, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *")
    .bind(id, siteId, mediaType, bodyUrl.trim(), bodyTitle?.trim() ?? null, sortOrder, now)
    .first();

  return NextResponse.json({ item }, { status: 201 });
}
