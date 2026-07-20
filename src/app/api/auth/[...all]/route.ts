import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/app/lib/auth.server";
import { isRateLimited } from "@/lib/rateLimit";

async function handler(req: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const cfEnv = env as Parameters<typeof createAuth>[0];

  // In-code IP rate limit on auth mutations (login / signup / password reset /
  // verification) to blunt brute-force and credential-stuffing. GET (session
  // reads) is not limited. Uses the shared KV limiter so the cap is global
  // across Worker isolates (better-auth's built-in limiter defaults to
  // per-isolate memory). The Cloudflare WAF rule remains defense-in-depth.
  if (req.method === "POST") {
    const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
    if (await isRateLimited(cfEnv.KV, `auth:${ip}`, 10, 60)) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      });
    }
  }

  const auth = createAuth(cfEnv);
  return auth.handler(req);
}

export { handler as GET, handler as POST };
