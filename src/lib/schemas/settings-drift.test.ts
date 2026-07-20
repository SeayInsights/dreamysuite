import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { ALLOWED_FIELDS } from "./settings";

/**
 * Guard against the class of bug fixed in migration 0046: the 0040 rebuild
 * dropped site_setting columns that were still listed in SettingsSchema /
 * ALLOWED_FIELDS, so upsertSiteSettings' INSERT (which lists every
 * ALLOWED_FIELDS column) failed with "no such column".
 *
 * We reconstruct the effective site_setting column set by replaying the
 * migration DDL statically (no DB required) and assert every ALLOWED_FIELDS
 * key has a backing column.
 */

const migrationsDir = fileURLToPath(
  new URL("../../../migrations", import.meta.url),
);

function parseCreateColumns(body: string): Set<string> {
  const cols = new Set<string>();
  for (const raw of body.split("\n")) {
    const line = raw.trim().replace(/,\s*$/, "");
    if (!line) continue;
    const upper = line.toUpperCase();
    if (
      upper.startsWith("FOREIGN KEY") ||
      upper.startsWith("PRIMARY KEY") ||
      upper.startsWith("UNIQUE") ||
      upper.startsWith("CONSTRAINT") ||
      upper.startsWith("CHECK")
    )
      continue;
    const m = line.match(/^["'`]?([A-Za-z0-9_]+)["'`]?/);
    if (m) cols.add(m[1]);
  }
  return cols;
}

function effectiveSiteSettingColumns(): Set<string> {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  let cols = new Set<string>();
  for (const file of files) {
    // strip line comments so commented DDL and section headers are ignored
    const sql = readFileSync(join(migrationsDir, file), "utf8").replace(
      /--[^\n]*/g,
      "",
    );

    // A CREATE of site_setting (or the 0040 rebuild's site_setting_new) resets the column set.
    const createRe =
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?site_setting(?:_new)?["'`]?\s*\(([\s\S]*?)\);/gi;
    let m: RegExpExecArray | null;
    while ((m = createRe.exec(sql)) !== null) cols = parseCreateColumns(m[1]);

    // ADD COLUMN on site_setting (or site_setting_new) extends the set.
    const alterRe =
      /ALTER\s+TABLE\s+["'`]?site_setting(?:_new)?["'`]?\s+ADD\s+COLUMN\s+["'`]?([A-Za-z0-9_]+)["'`]?/gi;
    while ((m = alterRe.exec(sql)) !== null) cols.add(m[1]);
  }
  return cols;
}

describe("site_setting schema <-> ALLOWED_FIELDS drift guard", () => {
  it("every ALLOWED_FIELDS key has a backing site_setting column across migrations", () => {
    const cols = effectiveSiteSettingColumns();
    const missing = (ALLOWED_FIELDS as readonly string[]).filter(
      (f) => !cols.has(f),
    );
    expect(
      missing,
      `ALLOWED_FIELDS with no backing site_setting column (add a migration): ${missing.join(", ")}`,
    ).toEqual([]);
  });
});
