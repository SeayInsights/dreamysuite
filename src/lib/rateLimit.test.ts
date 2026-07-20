import { describe, it, expect } from "vitest";
import { isRateLimited } from "./rateLimit";

/** In-memory KV double sufficient for isRateLimited (get/put only). */
function fakeKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => {
      store.set(k, v);
    },
  } as unknown as KVNamespace;
}

describe("isRateLimited", () => {
  it("allows the first N requests then blocks", async () => {
    const kv = fakeKV();
    const key = "auth:1.2.3.4";
    const max = 3;
    const results: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      results.push(await isRateLimited(kv, key, max, 60));
    }
    // first 3 allowed (false), remaining blocked (true)
    expect(results).toEqual([false, false, false, true, true]);
  });

  it("tracks separate keys independently", async () => {
    const kv = fakeKV();
    expect(await isRateLimited(kv, "auth:a", 1, 60)).toBe(false);
    expect(await isRateLimited(kv, "auth:a", 1, 60)).toBe(true);
    // different key (different IP) is unaffected
    expect(await isRateLimited(kv, "auth:b", 1, 60)).toBe(false);
  });
});
