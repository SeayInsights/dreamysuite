#!/usr/bin/env node
/**
 * rehash-passwords.mjs
 *
 * One-time migration script: find all site_setting rows whose guestPassword
 * is NOT already PBKDF2-hashed and re-hash them in place.
 *
 * Prerequisites:
 *   - wrangler installed and authenticated
 *   - D1 database bound as DB in wrangler.toml
 *
 * Usage:
 *   node scripts/rehash-passwords.mjs [--database <name>] [--dry-run]
 *
 * Flags:
 *   --database <name>   D1 database name from wrangler.toml (default: "DB")
 *   --dry-run           Print what would be updated without writing anything
 */

import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const dbIndex = args.indexOf("--database");
const DB_NAME = dbIndex !== -1 ? args[dbIndex + 1] : "DB";

if (!DB_NAME) {
  console.error("--database flag requires a value");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// PBKDF2 helpers — mirrors src/lib/crypto/guestPassword.ts logic using the
// Node.js Web Crypto implementation (available since Node 19 / node:crypto).
// ---------------------------------------------------------------------------

const { webcrypto } = await import("node:crypto");
const subtle = webcrypto.subtle;

/**
 * Hash a plaintext password with PBKDF2.
 * Returns a string in the format: `$pbkdf2$<saltHex>$<hashHex>`
 */
async function hashGuestPassword(pw) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(pw),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256,
  );
  const hashHex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `$pbkdf2$${saltHex}$${hashHex}`;
}

// ---------------------------------------------------------------------------
// Wrangler D1 helpers
// ---------------------------------------------------------------------------

function wranglerQuery(sql, remote = true) {
  const remoteFlag = remote ? "--remote" : "--local";
  const cmd = `npx wrangler d1 execute ${DB_NAME} ${remoteFlag} --json --command ${JSON.stringify(sql)}`;
  const output = execSync(cmd, { encoding: "utf8" });
  return JSON.parse(output);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log(`rehash-passwords: database="${DB_NAME}"${dryRun ? " [DRY RUN]" : ""}`);

// 1. Fetch every site_setting row that has a guestPassword value
//    and whose guestPassword does NOT start with '$pbkdf2$'.
const selectSql = `
  SELECT siteId, guestPassword
  FROM site_setting
  WHERE guestPassword IS NOT NULL
    AND guestPassword != ''
    AND SUBSTR(guestPassword, 1, 8) != '$pbkdf2$'
`;

let rows;
try {
  const result = wranglerQuery(selectSql);
  // wrangler returns an array of result objects; the first has a `results` array.
  rows = result[0]?.results ?? [];
} catch (err) {
  console.error("Failed to query D1:", err.message);
  process.exit(1);
}

if (rows.length === 0) {
  console.log("No plaintext/sha256 passwords found — nothing to do.");
  process.exit(0);
}

console.log(`Found ${rows.length} row(s) to rehash.`);

// 2. Re-hash each row and update in place.
let updated = 0;
let failed = 0;

for (const row of rows) {
  const { siteId, guestPassword } = row;
  try {
    const newHash = await hashGuestPassword(guestPassword);

    if (dryRun) {
      console.log(`[DRY RUN] Would update siteId=${siteId}`);
    } else {
      const updateSql = `
        UPDATE site_setting
        SET guestPassword = '${newHash.replace(/'/g, "''")}'
        WHERE siteId = '${String(siteId).replace(/'/g, "''")}'
      `;
      wranglerQuery(updateSql);
      console.log(`Updated siteId=${siteId}`);
      updated++;
    }
  } catch (err) {
    console.error(`Failed to rehash siteId=${siteId}:`, err.message);
    failed++;
  }
}

if (dryRun) {
  console.log(`Dry run complete. ${rows.length} row(s) would be updated.`);
} else {
  console.log(`Done. Updated: ${updated}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}
