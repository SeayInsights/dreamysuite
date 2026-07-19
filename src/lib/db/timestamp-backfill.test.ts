import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

/**
 * Validates migration 0048's timestamp backfill CASE logic against real SQLite:
 * a column that accumulated ISO-8601 text, epoch seconds, and epoch ms must all
 * normalize to plausible epoch-millisecond integers.
 */

const migrationSql = readFileSync(
  fileURLToPath(
    new URL(
      "../../../migrations/0048_normalize_contact_submission_timestamps.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

const MS_2020 = 1_577_836_800_000; // 2020-01-01
const MS_2100 = 4_102_444_800_000; // 2100-01-01

describe("0048 contact/submission timestamp backfill", () => {
  it("normalizes ISO text, epoch seconds, and epoch ms to epoch milliseconds", () => {
    const db = new DatabaseSync(":memory:");
    // Minimal tables — the migration only touches created_at/updated_at.
    for (const t of ["contact", "submission"]) {
      db.exec(
        `CREATE TABLE ${t} (id TEXT PRIMARY KEY, created_at, updated_at)`,
      );
    }

    const isoText = "2026-07-19T20:36:09.015Z";
    const isoMs = Date.parse(isoText); // 1_784_... ms, second-truncated after backfill
    const seconds = 1_720_000_000; // ~2024, epoch seconds
    const ms = 1_752_000_000_000; // ~2025, epoch ms

    const ins = db.prepare(
      "INSERT INTO contact (id, created_at, updated_at) VALUES (?, ?, ?)",
    );
    ins.run("iso", isoText, isoText);
    ins.run("sec", seconds, seconds);
    ins.run("ms", ms, ms);
    ins.run("null", null, null);
    db.prepare(
      "INSERT INTO submission (id, created_at, updated_at) VALUES (?, ?, ?)",
    ).run("s-sec", seconds, seconds);

    db.exec(migrationSql);

    const rows = db
      .prepare("SELECT id, created_at, updated_at FROM contact ORDER BY id")
      .all() as Array<{
      id: string;
      created_at: number | null;
      updated_at: number | null;
    }>;
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));

    // ISO text -> ms (second precision)
    expect(by.iso.created_at).toBe(Math.floor(isoMs / 1000) * 1000);
    // seconds -> ms
    expect(by.sec.created_at).toBe(seconds * 1000);
    // ms -> unchanged
    expect(by.ms.created_at).toBe(ms);
    // null stays null
    expect(by.null.created_at).toBeNull();

    // every non-null value is a plausible epoch-ms integer
    for (const r of rows) {
      for (const v of [r.created_at, r.updated_at]) {
        if (v === null) continue;
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThan(MS_2020);
        expect(v).toBeLessThan(MS_2100);
      }
    }

    const sub = db
      .prepare("SELECT created_at FROM submission WHERE id = ?")
      .get("s-sec") as { created_at: number };
    expect(sub.created_at).toBe(seconds * 1000);
    db.close();
  });
});
