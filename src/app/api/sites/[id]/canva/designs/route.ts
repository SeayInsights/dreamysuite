import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth, type Env } from "@/app/lib/auth.server";

interface CanvaConnection {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

async function refreshToken(conn: CanvaConnection, env: Env): Promise<string> {
  const res = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: conn.refreshToken,
      client_id: env.CANVA_CLIENT_ID,
      client_secret: env.CANVA_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error("Token refresh failed");
  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  const now = Date.now();
  await env.DB
    .prepare("UPDATE canva_connection SET accessToken = ?, refreshToken = ?, expiresAt = ?, updatedAt = ? WHERE userId = ?")
    .bind(data.access_token, data.refresh_token, now + data.expires_in * 1000, now, conn.userId)
    .run();
  return data.access_token;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

  const site = await env.DB
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string }>();
  if (!site) {
    const invite = await env.DB
      .prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
      .bind(siteId, session.user.email.toLowerCase())
      .first<{ id: string }>();
    if (!invite) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Site not found or access denied" } }, { status: 403 });
  }

  const conn = await env.DB
    .prepare("SELECT * FROM canva_connection WHERE userId = ?")
    .bind(session.user.id)
    .first<CanvaConnection>();

  if (!conn) return NextResponse.json({ connected: false, designs: [] });

  let accessToken = conn.accessToken;
  if (conn.expiresAt - Date.now() < 5 * 60 * 1000) {
    const lockKey = `canva_refresh_lock:${session.user.id}`;
    const locked = await env.KV.get(lockKey);
    if (locked) {
      await new Promise<void>((r) => setTimeout(r, 500));
      const fresh = await env.DB
        .prepare("SELECT accessToken FROM canva_connection WHERE userId = ?")
        .bind(session.user.id)
        .first<{ accessToken: string }>();
      if (fresh) accessToken = fresh.accessToken;
    } else {
      await env.KV.put(lockKey, "1", { expirationTtl: 30 });
      try {
        accessToken = await refreshToken(conn, env);
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
