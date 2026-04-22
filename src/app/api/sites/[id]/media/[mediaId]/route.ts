import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { getSession } from "@/lib/api/get-session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  const env = await getEnv();
  const { id: siteId, mediaId } = await params;

  const session = await getSession(req.headers, env);
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  const _db = env.DB;
  const site = await _db
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string }>();
  if (!site) {
    const invite = await _db
      .prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
      .bind(siteId, session.user.email.toLowerCase())
      .first<{ id: string }>();
    if (!invite) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Access denied" } }, { status: 403 });
  }

  await env.DB
    .prepare("DELETE FROM media_item WHERE id = ? AND siteId = ?")
    .bind(mediaId, siteId)
    .run();

  return NextResponse.json({ ok: true });
}
