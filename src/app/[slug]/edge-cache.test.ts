import { describe, it, expect, afterEach } from "vitest";
import { isAnonymous, edgeCacheMatch, edgeCachePut } from "./edge-cache";

const req = (cookie?: string) =>
  new Request("https://dreamysuite.com/my-site", {
    headers: cookie ? { cookie } : {},
  });

const globalCaches = () => globalThis as unknown as { caches?: unknown };

afterEach(() => {
  delete globalCaches().caches;
});

describe("isAnonymous", () => {
  it("is true with no cookie", () => {
    expect(isAnonymous(req())).toBe(true);
  });
  it("is true with unrelated cookies", () => {
    expect(isAnonymous(req("theme=dark; lang=en"))).toBe(true);
  });
  it("is false when a better-auth session cookie is present", () => {
    expect(isAnonymous(req("__Secure-better-auth.session_token=abc.def"))).toBe(
      false,
    );
  });
});

describe("edge cache fails open without caches.default", () => {
  it("edgeCacheMatch returns null", async () => {
    expect(await edgeCacheMatch(req())).toBeNull();
  });
  it("edgeCachePut resolves without throwing", async () => {
    await expect(
      edgeCachePut(req(), new Response("ok")),
    ).resolves.toBeUndefined();
  });
});

describe("edge cache uses caches.default when present", () => {
  it("edgeCacheMatch returns the cached response", async () => {
    globalCaches().caches = {
      default: {
        match: async () => new Response("CACHED"),
        put: async () => {},
      },
    };
    const hit = await edgeCacheMatch(req());
    expect(hit).not.toBeNull();
    expect(await hit!.text()).toBe("CACHED");
  });

  it("edgeCacheMatch returns null on a miss", async () => {
    globalCaches().caches = {
      default: { match: async () => undefined, put: async () => {} },
    };
    expect(await edgeCacheMatch(req())).toBeNull();
  });
});
