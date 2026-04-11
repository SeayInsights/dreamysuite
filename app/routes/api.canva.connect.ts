import { redirect } from "react-router";
import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.canva.connect";
import "~/lib/context";

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

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env;
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw redirect("/login");

  const url = new URL(request.url);
  const siteId = url.searchParams.get("siteId");
  if (!siteId) return new Response("Missing siteId", { status: 400 });

  const site = await env.DB
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string }>();
  if (!site) return new Response("Site not found", { status: 404 });

  const { verifier, challenge } = await generatePKCE();
  const state = btoa(`${session.user.id}:${siteId}`);

  await env.KV.put(`canva_pkce:${state}`, verifier, { expirationTtl: 600 });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.CANVA_CLIENT_ID,
    redirect_uri: `${env.APP_URL}/api/canva/callback`,
    scope: "design:content:read asset:read",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });

  throw redirect(`https://www.canva.com/api/oauth/authorize?${params.toString()}`);
}
