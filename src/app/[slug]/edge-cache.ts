/**
 * Edge caching for the public `[slug]` renderer.
 *
 * Only ANONYMOUS visitors (no better-auth session cookie) use the cache, and
 * only live + published + non-password-gated renders are ever stored — so an
 * owner, an invited guest, or a password-gated page is never served a cached
 * copy. Everything here is best-effort and FAILS OPEN: if `caches.default` is
 * unavailable (non-edge runtime) or any call throws, the route renders normally
 * exactly as it did before, with no behavioural change.
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

const SESSION_COOKIE = "__Secure-better-auth.session_token";

/** True when the request carries no better-auth session cookie. */
export function isAnonymous(req: Request): boolean {
  return !(req.headers.get("cookie") ?? "").includes(SESSION_COOKIE);
}

/** The Cloudflare per-colo default cache, or null on runtimes without it. */
function edgeCache(): Cache | null {
  try {
    const c = (globalThis as unknown as { caches?: { default?: Cache } })
      .caches;
    return c?.default ?? null;
  } catch {
    return null;
  }
}

/** Cache key: the request URL, method GET. Query (incl. `_lang`) is part of it. */
function keyFor(req: Request): Request {
  return new Request(new URL(req.url).toString(), { method: "GET" });
}

/** Best-effort read from the edge cache. Returns null on miss or any error. */
export async function edgeCacheMatch(req: Request): Promise<Response | null> {
  try {
    const cache = edgeCache();
    if (!cache) return null;
    return (await cache.match(keyFor(req))) ?? null;
  } catch {
    return null;
  }
}

/**
 * Best-effort write to the edge cache. Uses ctx.waitUntil so the write does not
 * block the response; swallows every error (caching is optional). The response
 * is cached for as long as its own Cache-Control max-age allows.
 */
export async function edgeCachePut(req: Request, res: Response): Promise<void> {
  try {
    const cache = edgeCache();
    if (!cache) return;
    const { ctx } = await getCloudflareContext({ async: true });
    const put = cache.put(keyFor(req), res.clone());
    if (ctx?.waitUntil) ctx.waitUntil(put);
    else await put;
  } catch {
    /* best-effort — never let caching break a render */
  }
}
