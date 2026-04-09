import { createRequestHandler } from "react-router";

const handler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  AUTH_SECRET: string;
  APP_URL: string;
  CF_ACCOUNT_ID: string;
  CF_API_TOKEN: string;
}

/**
 * Rewrites incoming requests for subdomain and custom domain routing:
 *
 *   {slug}.dreamysuite.com  →  dreamysuite.com/{slug}   (Option B subdomain)
 *   dannis-naomi.com        →  dreamysuite.com/{slug}   (custom domain)
 *
 * Path-based routing (dreamysuite.com/{slug}) is handled by the $slug.tsx
 * route inside React Router — no rewrite needed.
 */
async function routeRequest(request: Request, env: Env): Promise<Request> {
  const url = new URL(request.url);
  const host = (request.headers.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");

  // ── Option B: *.dreamysuite.com subdomain routing ──────────────────────────
  const subMatch = host.match(/^([a-z0-9-]+)\.dreamysuite\.com$/);
  if (subMatch && subMatch[1] !== "www") {
    const slug = subMatch[1];
    return new Request(`https://dreamysuite.com/${slug}`, {
      method: request.method,
      headers: request.headers,
      body: request.body ?? undefined,
      redirect: request.redirect,
    });
  }

  // ── Custom domain routing ──────────────────────────────────────────────────
  const isDreamysuite = host === "dreamysuite.com" || host.endsWith(".dreamysuite.com");
  const isLocal = host === "localhost" || host.startsWith("127.") || host.startsWith("0.0.0.0");
  if (!isDreamysuite && !isLocal) {
    const site = await env.DB
      .prepare("SELECT slug FROM site WHERE customDomain = ? AND status = 'published'")
      .bind(host)
      .first<{ slug: string }>();

    if (site) {
      return new Request(`https://dreamysuite.com/${site.slug}`, {
        method: request.method,
        headers: request.headers,
        body: request.body ?? undefined,
        redirect: request.redirect,
      });
    }
  }

  return request;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      const routed = await routeRequest(request, env);
      return await handler(routed, { cloudflare: { env, ctx } });
    } catch (err) {
      const msg = err instanceof Error
        ? `${err.name}: ${err.message}\n${err.stack ?? ""}`
        : String(err);
      console.error("[worker crash]", msg);
      return new Response(
        `<pre style="font-family:monospace;padding:2rem;white-space:pre-wrap">${msg}</pre>`,
        { status: 500, headers: { "content-type": "text/html" } }
      );
    }
  },
} satisfies ExportedHandler<Env>;
