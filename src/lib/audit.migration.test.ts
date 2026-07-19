import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

/**
 * Functional guard for the audit-logging fix (migration 0047).
 *
 * 0035 created audit_log; 0043's `CREATE TABLE IF NOT EXISTS audit_log` with a
 * different shape was a silent no-op, so logAudit()'s INSERT (detail/ip columns,
 * null userId/siteId) always threw and was swallowed. 0047 rebuilds the table to
 * the intended shape. This test replays 0035 -> 0043 -> 0047 against real SQLite
 * (reproducing the no-op) and asserts logAudit's ACTUAL INSERT column list —
 * extracted from src/lib/audit.ts — succeeds, including the login case with null
 * userId/siteId.
 */

const repoUrl = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const migration = (f: string) =>
  readFileSync(repoUrl(`../../migrations/${f}`), "utf8");

function auditInsertColumns(): string[] {
  const src = readFileSync(repoUrl("./audit.ts"), "utf8");
  const m = src.match(/INSERT INTO audit_log\s*\(([^)]+)\)/i);
  if (!m) throw new Error("could not find the audit_log INSERT in audit.ts");
  return m[1].split(",").map((c) => c.trim());
}

describe("audit_log migrations produce a schema logAudit() can write", () => {
  it("replays 0035 -> 0043(no-op) -> 0047 and logAudit's INSERT succeeds", () => {
    const db = new DatabaseSync(":memory:");
    db.exec(migration("0035_audit_log.sql"));
    // 0043's CREATE TABLE IF NOT EXISTS no-ops over 0035, and its
    // `CREATE INDEX ... ON audit_log(timestamp)` then errors ("no such column")
    // — leaving the table stuck on the 0035 shape. Reproduce that partial apply.
    try {
      db.exec(migration("0043_audit_log.sql"));
    } catch {
      /* expected: 0043 errors on the timestamp index against the 0035 table */
    }
    db.exec(migration("0047_reconcile_audit_log.sql"));

    const cols = auditInsertColumns();
    expect(cols).toEqual(["id", "userId", "siteId", "action", "detail", "ip"]);

    // Build logAudit's exact INSERT and run the worst case (login: null userId/siteId).
    const placeholders = cols.map(() => "?").join(", ");
    const stmt = db.prepare(
      `INSERT INTO audit_log (${cols.join(", ")}) VALUES (${placeholders})`,
    );
    const values: Record<string, unknown> = {
      id: "audit-1",
      userId: null,
      siteId: null,
      action: "login",
      detail: null,
      ip: "203.0.113.7",
    };
    expect(() => stmt.run(...cols.map((c) => values[c]))).not.toThrow();

    const row = db
      .prepare("SELECT action, ip, timestamp FROM audit_log WHERE id = ?")
      .get("audit-1") as { action: string; ip: string; timestamp: string };
    expect(row.action).toBe("login");
    expect(row.ip).toBe("203.0.113.7");
    expect(typeof row.timestamp).toBe("string"); // defaulted by the schema
    db.close();
  });
});
