import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  const env = await getEnv();
  const { id: siteId, mediaId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  await env.DB
    .prepare("DELETE FROM media_item WHERE id = ? AND siteId = ?")
    .bind(mediaId, siteId)
    .run();

  return NextResponse.json({ ok: true });
}
