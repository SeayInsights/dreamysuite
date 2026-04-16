import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth, type Env } from "@/app/lib/auth.server";

async function requireSiteOwnership(
  req: NextRequest,
  env: Env,
  siteId: string
) {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return { error: { code: "UNAUTHORIZED", message: "Not authenticated" }, status: 401 as const };
  }
  const _db = env.DB;
  const site = await _db
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string }>();
  if (site) return { userId: session.user.id };
  const invite = await _db
    .prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
    .bind(siteId, session.user.email.toLowerCase())
    .first<{ id: string }>();
  if (invite) return { userId: session.user.id };
  return { error: { code: "FORBIDDEN", message: "Site not found or access denied" }, status: 403 as const };
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId, blockId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return NextResponse.json(check, { status: check.status });

  const block = await env.DB
    .prepare("SELECT * FROM block WHERE id = ? AND siteId = ?")
    .bind(blockId, siteId)
    .first();

  if (!block) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Block not found" } }, { status: 404 });
  }

  await env.DB
    .prepare("DELETE FROM block WHERE id = ?")
    .bind(blockId)
    .run();

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
  if ("error" in check) return NextResponse.json(check, { status: check.status });

  const block = await env.DB
    .prepare("SELECT * FROM block WHERE id = ? AND siteId = ?")
    .bind(blockId, siteId)
    .first();

  if (!block) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Block not found" } }, { status: 404 });
  }

  let body: { config?: unknown; sortOrder?: number; isVisible?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, { status: 400 });
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.config !== undefined) { fields.push("config = ?"); values.push(body.config); }
  if (body.sortOrder !== undefined) { fields.push("sortOrder = ?"); values.push(body.sortOrder); }
  if (body.isVisible !== undefined) { fields.push("isVisible = ?"); values.push(body.isVisible ? 1 : 0); }

  if (fields.length === 0) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "No fields to update" } }, { status: 400 });
  }

  fields.push("updatedAt = ?");
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
