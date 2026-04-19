/**
 * KV-based IP rate limiter for public endpoints.
 *
 * Returns true if the request should be blocked (limit exceeded).
 * Key pattern: `rl:${key}`
 */
export async function isRateLimited(
  kv: KVNamespace,
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  const kvKey = `rl:${key}`;
  const raw = await kv.get(kvKey);
  const count = raw !== null ? parseInt(raw, 10) : 0;

  if (count >= maxRequests) {
    return true;
  }

  // Increment and write back. On the first hit set the TTL; on subsequent hits
  // preserve the remaining TTL by re-using the same expiration window.
  // KV put with expirationTtl resets the TTL each write, which is acceptable
  // for a sliding-window approximation at low request volumes.
  await kv.put(kvKey, String(count + 1), { expirationTtl: windowSeconds });
  return false;
}
