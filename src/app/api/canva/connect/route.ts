import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth, type Env } from "@/app/lib/auth.server";

async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const encoded = new TextEncoder().encode(verifier);
  const hashed = await crypto.subtle.digest("SHA-256", encoded);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hashed)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return { verifier, challenge };
}

export async function GET(req: NextRequest) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  const url = new URL(req.url);
  const siteId = url.searchParams.get("siteId");
  if (!siteId) return new Response("Missing siteId", { status: 400 });

  const site = await env.DB
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first() as { id: string } | null;
  if (!site) return new Response("Site not found", { status: 404 });

  const { verifier, challenge } = await generatePKCE();
  const nonce = crypto.randomUUID();
  await env.KV.put(
    `canva_pkce:${nonce}`,
    JSON.stringify({ userId: session.user.id, siteId, codeVerifier: verifier }),
    { expirationTtl: 600 }
  );
  const state = nonce;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.CANVA_CLIENT_ID,
    redirect_uri: env.CANVA_REDIRECT_URI,
    scope: "design:content:read asset:read",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });

  return NextResponse.redirect(new URL(`https://www.canva.com/api/oauth/authorize?${params.toString()}`));
}
