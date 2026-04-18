import { build } from "esbuild";
import { readdirSync, mkdirSync, writeFileSync } from "fs";
import { join, basename, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const COMPONENTS_DIR = join(ROOT, "src/lib/effects/components");
const OUT_DIR = join(ROOT, "public/effects");

const SKIP = new Set([
  "DotGrid", // gsap/InertiaPlugin (paid plugin — no license)
]);

const CATEGORIES = ["backgrounds"];

function toKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

const EXTERNAL = [
  "react",
  "react-dom",
  "react-dom/*",
  "react/*",
  "ogl",
  "ogl/*",
  "three",
  "three/*",
  "gsap",
  "gsap/*",
  "@react-three/*",
  "postprocessing",
  "postprocessing/*",
  "motion",
  "motion/*",
];

mkdirSync(OUT_DIR, { recursive: true });

// ── Preact runtime bundles ───────────────────────────────────────────────────

console.log("Building Preact runtime...");

await build({
  stdin: {
    contents: `export * from "preact/compat";`,
    resolveDir: ROOT,
    loader: "js",
  },
  bundle: true,
  format: "esm",
  outfile: join(OUT_DIR, "_rt.js"),
  minify: true,
});

await build({
  stdin: {
    contents: `export { jsx, jsxs, Fragment } from "preact/jsx-runtime";`,
    resolveDir: ROOT,
    loader: "js",
  },
  bundle: true,
  format: "esm",
  outfile: join(OUT_DIR, "_jsx.js"),
  minify: true,
});

await build({
  stdin: {
    contents: `export { createRoot } from "preact/compat/client";`,
    resolveDir: ROOT,
    loader: "js",
  },
  bundle: true,
  format: "esm",
  outfile: join(OUT_DIR, "_rt-client.js"),
  minify: true,
});

console.log("Runtime built");

// ── Effect components ────────────────────────────────────────────────────────

const results = { success: [], skipped: [], failed: [] };

for (const category of CATEGORIES) {
  const catDir = join(COMPONENTS_DIR, category);
  const files = readdirSync(catDir).filter((f) => f.endsWith(".tsx"));

  for (const file of files) {
    const name = basename(file, ".tsx");

    if (SKIP.has(name)) {
      results.skipped.push(name);
      continue;
    }

    const id = toKebab(name);

    try {
      await build({
        entryPoints: [join(catDir, file)],
        bundle: true,
        format: "esm",
        outfile: join(OUT_DIR, `${id}.js`),
        minify: true,
        external: EXTERNAL,
        jsx: "automatic",
        jsxImportSource: "react",
        loader: { ".tsx": "tsx", ".ts": "ts" },
        target: ["es2020"],
        define: { "process.env.NODE_ENV": '"production"' },
      });
      results.success.push(id);
    } catch (e) {
      results.failed.push({ id, error: e.message.split("\n")[0] });
    }
  }
}

const manifest = {
  effects: results.success,
  skipped: results.skipped.map((n) => toKebab(n)),
  built: new Date().toISOString(),
};
writeFileSync(
  join(OUT_DIR, "manifest.json"),
  JSON.stringify(manifest, null, 2),
);

console.log(`\nBuilt ${results.success.length} effects`);
console.log(
  `Skipped ${results.skipped.length}: ${results.skipped.join(", ")}`,
);
if (results.failed.length) {
  console.warn(`Failed ${results.failed.length}:`);
  results.failed.forEach((f) => console.warn(`  ${f.id}: ${f.error}`));
}
