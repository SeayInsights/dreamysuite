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
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      return await handler(request, { cloudflare: { env, ctx } });
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
