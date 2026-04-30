import { type Env } from "@/app/lib/auth.server";

export interface CanvaConnection {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export async function refreshCanvaToken(conn: CanvaConnection, env: Env): Promise<string> {
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
