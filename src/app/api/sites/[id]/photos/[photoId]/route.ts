import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/app/lib/auth.server";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId, photoId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const photo = await env.DB
    .prepare("SELECT r2Key, mimeType FROM photo WHERE id = ? AND siteId = ?")
    .bind(photoId, siteId)
    .first<{ r2Key: string; mimeType: string }>();

  if (!photo) {
    return new Response("Not found", { status: 404 });
  }

  const object = await env.R2.get(photo.r2Key);
  if (!object) {
    return new Response("Not found in storage", { status: 404 });
  }

  const headers = new Headers();
  headers.set("content-type", photo.mimeType || "image/jpeg");
  headers.set("cache-control", "private, max-age=3600");
  return new Response(object.body, { headers });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId, photoId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const photo = await env.DB
    .prepare("SELECT * FROM photo WHERE id = ? AND siteId = ?")
    .bind(photoId, siteId)
    .first<{ id: string; r2Key: string }>();

  if (!photo) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Photo not found" } }, { status: 404 });
  }

  // Delete from R2 first, then DB
  try {
    await env.R2.delete(photo.r2Key);
  } catch (err) {
    console.error("[api/sites/[id]/photos/[photoId] DELETE r2]", err instanceof Error ? err.message : String(err));
    // Continue to delete the DB record even if R2 delete fails
  }

  await env.DB
    .prepare("DELETE FROM photo WHERE id = ?")
    .bind(photoId)
    .run();

  return NextResponse.json({ success: true });
}
