import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { apiError, apiOwnershipError, parseJsonBody } from "./site-auth";

/**
 * Integration test for `requireSiteOwnership` is skipped — it would require
 * mocking `createAuth` from `@/app/lib/auth.server`, which drags in
 * better-auth + the full D1 binding. The pure helpers below have no auth
 * dependency and cover the error-shape contract consumers rely on.
 */

describe("apiError", () => {
  it("returns NextResponse with status + error body", async () => {
    const res = apiError("BAD_REQUEST", "oops", 400);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: { code: "BAD_REQUEST", message: "oops" } });
  });

  it("defaults status to 400", () => {
    const res = apiError("X", "y");
    expect(res.status).toBe(400);
  });
});

describe("apiOwnershipError", () => {
  it("401 UNAUTHORIZED shape", async () => {
    const res = apiOwnershipError({
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      status: 401,
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
    });
    expect("status" in (body as Record<string, unknown>)).toBe(false);
  });

  it("403 FORBIDDEN shape", async () => {
    const res = apiOwnershipError({
      error: { code: "FORBIDDEN", message: "Site not found or access denied" },
      status: 403,
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("FORBIDDEN");
  });
});

describe("parseJsonBody", () => {
  it("returns { body } on valid JSON", async () => {
    const req = new NextRequest("http://localhost/test", {
      method: "POST",
      body: JSON.stringify({ foo: "bar" }),
      headers: { "content-type": "application/json" },
    });
    const out = await parseJsonBody<{ foo: string }>(req);
    expect("body" in out).toBe(true);
    if ("body" in out) expect(out.body.foo).toBe("bar");
  });

  it("returns { error } NextResponse with 400 on invalid JSON", async () => {
    const req = new NextRequest("http://localhost/test", {
      method: "POST",
      body: "not-json",
      headers: { "content-type": "application/json" },
    });
    const out = await parseJsonBody(req);
    expect("error" in out).toBe(true);
    if ("error" in out) {
      expect(out.error.status).toBe(400);
      const body = (await out.error.json()) as { error: { code: string } };
      expect(body.error.code).toBe("BAD_REQUEST");
    }
  });
});
