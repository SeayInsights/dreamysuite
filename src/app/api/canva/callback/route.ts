import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/app/lib/auth.server";

export async function GET(req: NextRequest) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || typeof code !== "string") return new Response("Bad request", { status: 400 });
  if (!state || typeof state !== "string") return new Response("Bad request", { status: 400 });
  if (!/^[0-9a-f-]{36}$/.test(state)) return new Response("Bad request", { status: 400 });

  const record = await env.KV.get(`canva_pkce:${state}`, "json") as {
    userId: string;
    siteId: string;
    codeVerifier: string;
  } | null;
  if (!record) return new Response("Invalid or expired state", { status: 400 });
  await env.KV.delete(`canva_pkce:${state}`);
  const { userId, siteId, codeVerifier: verifier } = record;

  const tokenRes = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: env.CANVA_REDIRECT_URI,
      client_id: env.CANVA_CLIENT_ID,
      client_secret: env.CANVA_CLIENT_SECRET,
      code_verifier: verifier,
    }),
  });

  if (!tokenRes.ok) {
    console.error("[canva callback] token exchange failed", await tokenRes.text());
    return NextResponse.redirect(new URL(`/dashboard/sites/${siteId}?s=site-setup&canva=error`, req.url));
  }

  const tokenData = await tokenRes.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const now = Date.now();
  const expiresAt = now + tokenData.expires_in * 1000;

  await env.DB
    .prepare(`INSERT INTO canva_connection (userId, accessToken, refreshToken, expiresAt, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT(userId) DO UPDATE SET
                accessToken = excluded.accessToken,
                refreshToken = excluded.refreshToken,
                expiresAt = excluded.expiresAt,
                updatedAt = excluded.updatedAt`)
    .bind(userId, tokenData.access_token, tokenData.refresh_token, expiresAt, now, now)
    .run();

  await env.KV.delete(`canva_pkce:${state}`);

  return NextResponse.redirect(new URL(`/dashboard/sites/${siteId}?s=site-setup&canva=connected`, req.url));
}
