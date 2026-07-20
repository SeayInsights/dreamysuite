import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Env } from "@/app/lib/auth.server";
import type { NextRequest } from "next/server";
import type { SessionResult } from "@/lib/api/get-session";

// getSession routes through better-auth; mock it so these tests exercise the
// ownership/invite authorization logic in isolation.
vi.mock("@/lib/api/get-session", () => ({ getSession: vi.fn() }));
import { getSession } from "@/lib/api/get-session";
import { requireSiteOwnership, requireSiteOwner } from "./site-auth";

const mockedGetSession = vi.mocked(getSession);

/** env.DB double: ownership/invite lookups resolve from the given sets. */
function fakeEnv(opts: {
  ownerSites?: Set<string>;
  invites?: Set<string>;
  siteName?: string;
}): Env {
  const db = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async first() {
              const siteId = String(args[0]);
              if (sql.includes("site_invite")) {
                return opts.invites?.has(siteId) ? { id: "inv" } : null;
              }
              // site ownership lookup (SELECT id / SELECT name ... WHERE id AND userId)
              if (!opts.ownerSites?.has(siteId)) return null;
              return sql.includes("SELECT name")
                ? { name: opts.siteName ?? "My Site" }
                : { id: siteId };
            },
          };
        },
      };
    },
  };
  return { DB: db } as unknown as Env;
}

function session(id: string, email: string): SessionResult {
  return {
    user: { id, email },
    session: { id: "sess", token: "tok", expiresAt: "2999-01-01T00:00:00Z" },
  };
}

const req = { headers: new Headers() } as unknown as NextRequest;

describe("requireSiteOwnership", () => {
  beforeEach(() => mockedGetSession.mockReset());

  it("401s when unauthenticated", async () => {
    mockedGetSession.mockResolvedValue(null);
    const r = await requireSiteOwnership(req, fakeEnv({}), "site1");
    expect(r).toEqual({
      error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      status: 401,
    });
  });

  it("passes for the site owner", async () => {
    mockedGetSession.mockResolvedValue(session("u1", "owner@x.com"));
    const r = await requireSiteOwnership(
      req,
      fakeEnv({ ownerSites: new Set(["site1"]) }),
      "site1",
    );
    expect(r).toEqual({ userId: "u1" });
  });

  it("passes for an invited collaborator", async () => {
    mockedGetSession.mockResolvedValue(session("u2", "guest@x.com"));
    const r = await requireSiteOwnership(
      req,
      fakeEnv({ invites: new Set(["site1"]) }),
      "site1",
    );
    expect(r).toEqual({ userId: "u2" });
  });

  it("403s for a non-owner, non-invited user (IDOR guard)", async () => {
    mockedGetSession.mockResolvedValue(session("u3", "attacker@x.com"));
    const r = await requireSiteOwnership(req, fakeEnv({}), "site1");
    expect(r).toEqual({
      error: { code: "FORBIDDEN", message: "Site not found or access denied" },
      status: 403,
    });
  });
});

describe("requireSiteOwner", () => {
  beforeEach(() => mockedGetSession.mockReset());

  it("returns owner context for the owner; 403 for others; 401 unauth", async () => {
    mockedGetSession.mockResolvedValue(session("u1", "owner@x.com"));
    const ok = await requireSiteOwner(
      req,
      fakeEnv({ ownerSites: new Set(["s1"]), siteName: "Jane & John" }),
      "s1",
    );
    expect(ok).toEqual({
      userId: "u1",
      userName: "owner@x.com",
      siteName: "Jane & John",
    });

    // an invited-but-not-owner user is NOT an owner
    mockedGetSession.mockResolvedValue(session("u2", "guest@x.com"));
    const forbidden = await requireSiteOwner(
      req,
      fakeEnv({ invites: new Set(["s1"]) }),
      "s1",
    );
    expect("error" in forbidden && forbidden.status).toBe(403);

    mockedGetSession.mockResolvedValue(null);
    const unauth = await requireSiteOwner(req, fakeEnv({}), "s1");
    expect("error" in unauth && unauth.status).toBe(401);
  });
});
