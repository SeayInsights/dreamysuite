import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import "~/lib/context";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) return new Response("Missing code or state", { status: 400 });

  let userId: string;
  let siteId: string;
  try {
    const decoded = atob(state);
    const colonIdx = decoded.indexOf(":");
    if (colonIdx < 1) throw new Error("bad state");
    userId = decoded.slice(0, colonIdx);
    siteId = decoded.slice(colonIdx + 1);
  } catch {
    return new Response("Invalid state", { status: 400 });
  }

  const verifier = await env.KV.get(`canva_pkce:${state}`);
  if (!verifier) throw redirect(`/dashboard/sites/${siteId}?s=site-setup&canva=error`);

  const tokenRes = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${env.APP_URL}/api/canva/callback`,
      client_id: env.CANVA_CLIENT_ID,
      client_secret: env.CANVA_CLIENT_SECRET,
      code_verifier: verifier,
    }),
  });

  if (!tokenRes.ok) {
    console.error("[canva callback] token exchange failed", await tokenRes.text());
    throw redirect(`/dashboard/sites/${siteId}?s=site-setup&canva=error`);
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

  throw redirect(`/dashboard/sites/${siteId}?s=site-setup&canva=connected`);
}
