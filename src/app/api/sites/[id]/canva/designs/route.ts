import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";
import { type CanvaConnection, refreshCanvaToken } from "@/lib/api/canva";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const conn = await env.DB
    .prepare("SELECT * FROM canva_connection WHERE userId = ?")
    .bind(check.userId)
    .first<CanvaConnection>();

  if (!conn) return NextResponse.json({ connected: false, designs: [] });

  let accessToken = conn.accessToken;
  if (conn.expiresAt - Date.now() < 5 * 60 * 1000) {
    const lockKey = `canva_refresh_lock:${check.userId}`;
    const locked = await env.KV.get(lockKey);
    if (locked) {
      await new Promise<void>((r) => setTimeout(r, 500));
      const fresh = await env.DB
        .prepare("SELECT accessToken FROM canva_connection WHERE userId = ?")
        .bind(check.userId)
        .first<{ accessToken: string }>();
      if (fresh) accessToken = fresh.accessToken;
    } else {
      await env.KV.put(lockKey, "1", { expirationTtl: 30 });
      try {
        accessToken = await refreshCanvaToken(conn, env);
      } catch {
        await env.KV.delete(lockKey);
        return NextResponse.json({ connected: false, designs: [] });
      }
      await env.KV.delete(lockKey);
    }
  }

  const designsRes = await fetch("https://api.canva.com/rest/v1/designs?limit=20", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!designsRes.ok) return NextResponse.json({ connected: true, designs: [] });

  const designsData = await designsRes.json() as {
    items?: Array<{ id: string; title: string; thumbnail?: { url: string } }>;
  };

  const designs = (designsData.items ?? []).map((item) => ({
    id: item.id,
    title: item.title || "Untitled",
    thumbnail_url: item.thumbnail?.url ?? "",
  }));

  return NextResponse.json({ connected: true, designs });
}
