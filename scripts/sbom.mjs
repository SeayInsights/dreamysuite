#!/usr/bin/env node
/**
 * Generate a Software Bill of Materials (SBOM) from package-lock.json.
 * Outputs CycloneDX-lite JSON to stdout or a file.
 *
 * Usage:
 *   node scripts/sbom.mjs                  # stdout
 *   node scripts/sbom.mjs > sbom.json      # file
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const lock = JSON.parse(
  readFileSync(resolve(root, "package-lock.json"), "utf8"),
);

const components = [];

for (const [name, info] of Object.entries(lock.packages || {})) {
  if (!name || name === "") continue;
  const pkgName = name.replace(/^node_modules\//, "");
  if (pkgName.startsWith(".")) continue;

  components.push({
    type: "library",
    name: pkgName,
    version: info.version ?? "unknown",
    purl: `pkg:npm/${pkgName.replace("/", "%2F")}@${info.version ?? "0.0.0"}`,
    scope: info.dev ? "optional" : "required",
    ...(info.license ? { licenses: [{ license: { id: info.license } }] } : {}),
  });
}

const sbom = {
  bomFormat: "CycloneDX",
  specVersion: "1.5",
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    component: {
      type: "application",
      name: pkg.name,
      version: pkg.version,
    },
    tools: [{ name: "dreamysuite-sbom", version: "1.0.0" }],
  },
  components: components.sort((a, b) => a.name.localeCompare(b.name)),
};

console.log(JSON.stringify(sbom, null, 2));
