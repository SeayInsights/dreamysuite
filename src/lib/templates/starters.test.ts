import { describe, it, expect } from "vitest";
import {
  STARTERS,
  STARTER_SUMMARIES,
  getStarter,
  applyStarter,
} from "./starters";

type ApplyDb = Parameters<typeof applyStarter>[0];

function mockDb() {
  const calls: { sql: string; args: unknown[] }[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind: (...args: unknown[]) => ({
          run: async () => {
            calls.push({ sql, args });
          },
        }),
      };
    },
  };
  return { db: db as unknown as ApplyDb, calls };
}

describe("starter templates", () => {
  it("has unique ids and includes blank", () => {
    const ids = STARTERS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("blank");
  });

  it("summaries mirror the starters", () => {
    expect(STARTER_SUMMARIES.length).toBe(STARTERS.length);
    expect(STARTER_SUMMARIES.map((s) => s.id)).toEqual(
      STARTERS.map((s) => s.id),
    );
  });

  it("blank has no pages; every other starter has typed blocks", () => {
    for (const s of STARTERS) {
      if (s.id === "blank") {
        expect(s.pages.length).toBe(0);
        continue;
      }
      expect(s.pages.length).toBeGreaterThan(0);
      for (const p of s.pages) {
        expect(p.slug).toBeTruthy();
        expect(p.label).toBeTruthy();
        for (const b of p.blocks) expect(b.type).toBeTruthy();
      }
    }
  });

  it("applyStarter is a no-op for blank / unknown ids", async () => {
    const a = mockDb();
    await applyStarter(a.db, "site1", "blank", 1700000000000);
    expect(a.calls.length).toBe(0);
    const b = mockDb();
    await applyStarter(b.db, "site1", "does-not-exist", 1700000000000);
    expect(b.calls.length).toBe(0);
  });

  it("applyStarter inserts settings + all pages + all blocks", async () => {
    const { db, calls } = mockDb();
    const starter = getStarter("classic-wedding")!;
    await applyStarter(db, "site1", "classic-wedding", 1700000000000);
    const pages = calls.filter((c) => c.sql.includes("INSERT INTO page"));
    const blocks = calls.filter((c) => c.sql.includes("INSERT INTO block"));
    const settings = calls.filter((c) =>
      c.sql.includes("INSERT INTO site_setting"),
    );
    expect(settings.length).toBe(1);
    expect(pages.length).toBe(starter.pages.length);
    expect(blocks.length).toBe(
      starter.pages.reduce((n, p) => n + p.blocks.length, 0),
    );
  });
});
