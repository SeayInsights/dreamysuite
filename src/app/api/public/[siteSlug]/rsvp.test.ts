import { describe, it, expect, vi, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import type { NextRequest } from "next/server";

// Mock the Cloudflare env accessor so the route runs against a local SQLite DB.
vi.mock("@/lib/cloudflare", () => ({ getEnv: vi.fn() }));
import { getEnv } from "@/lib/cloudflare";
import { POST } from "./route";

const mockedGetEnv = vi.mocked(getEnv);

/** Minimal D1Database facade over node:sqlite (prepare/bind/first/all/run). */
function d1(db: DatabaseSync): D1Database {
  const stmt = (sql: string) => {
    let bound: unknown[] = [];
    const api = {
      bind: (...args: unknown[]) => {
        bound = args;
        return api;
      },
      first: async () => db.prepare(sql).get(...(bound as [])) ?? null,
      all: async () => ({ results: db.prepare(sql).all(...(bound as [])) }),
      run: async () => {
        db.prepare(sql).run(...(bound as []));
        return { success: true };
      },
    };
    return api;
  };
  return { prepare: stmt } as unknown as D1Database;
}

/** In-memory KV double (get/put) — limiter stays under threshold. */
function fakeKV(): KVNamespace {
  const m = new Map<string, string>();
  return {
    get: async (k: string) => m.get(k) ?? null,
    put: async (k: string, v: string) => {
      m.set(k, v);
    },
  } as unknown as KVNamespace;
}

function seededDb(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  db.exec(
    `CREATE TABLE site (id TEXT PRIMARY KEY, name TEXT, slug TEXT, status TEXT, userId TEXT);`,
  );
  db.exec(
    `CREATE TABLE contact (id TEXT PRIMARY KEY, site_id TEXT, name TEXT, email TEXT, phone TEXT, contact_type TEXT, tags TEXT DEFAULT '[]', status TEXT DEFAULT 'active', metadata TEXT DEFAULT '{}', created_at INTEGER, updated_at INTEGER);`,
  );
  db.exec(
    `CREATE TABLE submission (id TEXT PRIMARY KEY, site_id TEXT, contact_id TEXT, submission_type TEXT, status TEXT DEFAULT 'pending', data TEXT, amount_cents INTEGER, created_at INTEGER, updated_at INTEGER);`,
  );
  // RSVP's success path reads site_setting.mainLanguage for the response message.
  db.exec(
    `CREATE TABLE site_setting (siteId TEXT PRIMARY KEY, mainLanguage TEXT);`,
  );
  db.exec(
    `INSERT INTO site (id, name, slug, status, userId) VALUES ('site1','Jane & John','test-slug','published','owner1');`,
  );
  db.exec(
    `INSERT INTO site_setting (siteId, mainLanguage) VALUES ('site1','en');`,
  );
  return db;
}

function rsvpRequest(body: unknown): NextRequest {
  return new Request("https://dreamysuite.com/api/public/test-slug", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.5",
    },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}
const params = Promise.resolve({ siteSlug: "test-slug" });
const count = (db: DatabaseSync, t: string) =>
  (db.prepare(`SELECT count(*) c FROM ${t}`).get() as { c: number }).c;

describe("RSVP POST /api/public/[siteSlug]", () => {
  beforeEach(() => mockedGetEnv.mockReset());

  it("rejects invalid submissions without writing to the DB", async () => {
    const db = seededDb();
    mockedGetEnv.mockResolvedValue({ DB: d1(db), KV: fakeKV() } as never);

    const res = await POST(rsvpRequest({ firstName: "A" }), { params }); // missing lastName/attending
    expect(res.status).toBe(400);
    expect(count(db, "contact")).toBe(0);
    expect(count(db, "submission")).toBe(0);
  });

  it("persists a contact + submission on a valid RSVP and upserts on re-submit", async () => {
    const db = seededDb();
    mockedGetEnv.mockResolvedValue({ DB: d1(db), KV: fakeKV() } as never);

    const res = await POST(
      rsvpRequest({
        firstName: "Guest",
        lastName: "One",
        attending: "yes",
        email: "guest@example.com",
      }),
      { params },
    );
    expect(res.status).toBeLessThan(400);
    expect(count(db, "contact")).toBe(1);
    expect(count(db, "submission")).toBe(1);

    const contact = db
      .prepare("SELECT site_id, email, contact_type FROM contact")
      .get() as { site_id: string; email: string; contact_type: string };
    expect(contact.site_id).toBe("site1");
    expect(contact.email).toBe("guest@example.com");

    const sub = db
      .prepare("SELECT submission_type, data FROM submission")
      .get() as { submission_type: string; data: string };
    expect(sub.submission_type).toBe("rsvp");
    expect(JSON.parse(sub.data).attending).toBe(true);

    // Re-submit with the same email → same contact updated, new submission row.
    await POST(
      rsvpRequest({
        firstName: "Guest",
        lastName: "One",
        attending: "no",
        email: "guest@example.com",
      }),
      { params },
    );
    expect(count(db, "contact")).toBe(1); // upserted, not duplicated
    expect(count(db, "submission")).toBe(2);
  });

  it("404s for an unknown slug", async () => {
    const db = seededDb();
    mockedGetEnv.mockResolvedValue({ DB: d1(db), KV: fakeKV() } as never);
    const res = await POST(
      new Request("https://dreamysuite.com/api/public/nope", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: "A",
          lastName: "B",
          attending: "yes",
        }),
      }) as unknown as NextRequest,
      { params: Promise.resolve({ siteSlug: "nope" }) },
    );
    expect(res.status).toBe(404);
    expect(count(db, "contact")).toBe(0);
  });
});
