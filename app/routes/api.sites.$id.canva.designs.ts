import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.canva.designs";
import "~/lib/context";

interface CanvaConnection {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function refreshToken(
  conn: CanvaConnection,
  env: Route.LoaderArgs["context"]["cloudflare"]["env"]
): Promise<string> {
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

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, 401);

  const siteId = params.id;
  const site = await env.DB
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string }>();
  if (!site) return jsonResponse({ error: { code: "FORBIDDEN", message: "Site not found" } }, 403);

  const conn = await env.DB
    .prepare("SELECT * FROM canva_connection WHERE userId = ?")
    .bind(session.user.id)
    .first<CanvaConnection>();

  if (!conn) return jsonResponse({ connected: false, designs: [] });

  let accessToken = conn.accessToken;
  if (conn.expiresAt - Date.now() < 5 * 60 * 1000) {
    try {
      accessToken = await refreshToken(conn, env);
    } catch {
      return jsonResponse({ connected: false, designs: [] });
    }
  }

  const designsRes = await fetch("https://api.canva.com/rest/v1/designs?limit=20", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!designsRes.ok) return jsonResponse({ connected: true, designs: [] });

  const designsData = await designsRes.json() as {
    items?: Array<{ id: string; title: string; thumbnail?: { url: string } }>;
  };

  const designs = (designsData.items ?? []).map((item) => ({
    id: item.id,
    title: item.title || "Untitled",
    thumbnail_url: item.thumbnail?.url ?? "",
  }));

  return jsonResponse({ connected: true, designs });
}
