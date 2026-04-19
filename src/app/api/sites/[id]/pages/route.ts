import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const result = await env.DB
    .prepare("SELECT * FROM page WHERE siteId = ? ORDER BY sortOrder ASC")
    .bind(siteId)
    .all();

  return NextResponse.json({ pages: result.results });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  let body: { slug?: string; label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, { status: 400 });
  }

  const { slug, label } = body;
  if (!slug || !label) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "slug and label are required" } }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(slug.trim())) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Page slug must contain only lowercase letters, numbers, and hyphens." } }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  const maxOrder = await env.DB
    .prepare("SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM page WHERE siteId = ?")
    .bind(siteId)
    .first<{ maxOrder: number }>();

  const sortOrder = (maxOrder?.maxOrder ?? -1) + 1;

  let page: unknown;
  try {
    page = await env.DB
      .prepare(
        "INSERT INTO page (id, siteId, slug, label, isVisible, isLocked, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, 0, ?, ?, ?) RETURNING *"
      )
      .bind(id, siteId, slug, label, sortOrder, now, now)
      .first();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) {
      return NextResponse.json({ error: { code: "CONFLICT", message: "A page with that slug already exists" } }, { status: 409 });
    }
    console.error("[api/sites/[id]/pages POST]", msg);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create page" } }, { status: 500 });
  }

  return NextResponse.json({ page }, { status: 201 });
}
