import { build } from "esbuild";
import {
  readdirSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  copyFileSync,
  rmSync,
} from "fs";
import { join, basename, resolve } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const COMPONENTS_DIR = join(ROOT, "src/lib/effects/components");
const OUT_DIR = join(ROOT, "public/effects");
const VENDOR_DIR = join(OUT_DIR, "vendor");

const SKIP = new Set([
  "Carousel",     // react-icons (icon pack — too large)
  "ScrollStack",  // lenis (scroll library)
  "GradualBlur",  // mathjs (math lib — too large for CDN)
]);

const CATEGORIES = ["backgrounds", "text", "cards", "cursors", "decorations", "nav", "transitions"];

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

// ── Vendored shared libraries ────────────────────────────────────────────────
// Effect bundles are built with the shared libraries left `external`, so at
// runtime the browser resolves those bare specifiers through the importmap
// emitted in html-builder.ts. We self-host the libraries (instead of esm.sh /
// cdnjs) so published sites have no runtime dependency on a third-party CDN.
//
// The output file names below MUST match the importmap targets in
// src/app/[slug]/html-builder.ts. The set mirrors the exact bare specifiers the
// built effect bundles import (see:
//   grep -rhoE '(from|import\()"[^"]+"' public/effects/*.js).
console.log("Building vendored libraries...");

rmSync(VENDOR_DIR, { recursive: true, force: true });
mkdirSync(VENDOR_DIR, { recursive: true });

// Naive per-lib bundling breaks two ways in the browser:
//   1. `export * from "<cjs>"` re-exports NOTHING — esbuild can't enumerate a CJS
//      module's named exports (react, react-dom, react/jsx-runtime).
//   2. A CJS `require("react")` targeting an EXTERNAL module becomes a `__require`
//      shim that throws in the browser ("Dynamic require ... is not supported").
//      This bites react-dom AND @react-three/fiber (its dep react-reconciler is
//      CJS and requires react).
//
// Fix: build EVERY vendored lib in ONE esbuild pass with `splitting: true` and
// NOTHING external. react / three / scheduler are then bundled ONCE into shared
// chunks that every entry imports — a single instance each (so hooks + the
// react-dom reconciler + r3f all agree), and with no external targets there are
// zero `__require` shims. CJS named exports (react, react-dom, jsx-runtime) are
// re-exported via runtime property access, which doesn't depend on esbuild's
// static CJS analysis.
const namedExports = (mod) =>
  [...new Set(Object.keys(mod))].filter(
    (k) => /^[A-Za-z$][\w$]*$/.test(k) && !k.startsWith("__") && k !== "default",
  );
const reactNames = namedExports(require("react"));
const reactDomNames = namedExports(require("react-dom")).filter(
  (k) => !reactNames.includes(k) && k !== "createRoot" && k !== "hydrateRoot",
);
const jsxNames = namedExports(require("react/jsx-runtime"));

// Canonical react + react-dom + client (importmap points react, react-dom, and
// react-dom/client all here — one react instance, shared via the split chunk).
const REACT_DOM_ENTRY = `import React from "react";
import ReactDOM from "react-dom";
import { createRoot, hydrateRoot } from "react-dom/client";
const R = React, RD = ReactDOM;
export default React;
export { createRoot, hydrateRoot };
export const ${[
  ...reactNames.map((k) => `${k} = R.${k}`),
  ...reactDomNames.map((k) => `${k} = RD.${k}`),
].join(", ")};`;

// outName → entry source (written to a temp dir before the splitting build).
const CONTENT_ENTRIES = {
  "react-dom": REACT_DOM_ENTRY,
  // jsx-runtime: elements use global Symbol.for, so the bundled react-dom
  // recognizes them; named exports via runtime property access.
  "react-jsx-runtime": `import RT from "react/jsx-runtime";\nexport const ${jsxNames
    .map((k) => `${k} = RT.${k}`)
    .join(", ")};`,
  // gsap core + plugins folded so registerPlugin(ScrollTrigger|Draggable) wires
  // into the same core instance effects import as `gsap`.
  gsap: `export * from "gsap";\nexport { default } from "gsap";\nexport { ScrollTrigger } from "gsap/ScrollTrigger";\nexport { Draggable } from "gsap/Draggable";`,
  three: `export * from "three";`,
  "three-mathutils": `export * from "three/src/math/MathUtils.js";`,
  ogl: `export * from "ogl";`,
  "motion-react": `export * from "motion/react";`,
  postprocessing: `export * from "postprocessing";`,
  "r3f-fiber": `export * from "@react-three/fiber";`,
  "r3f-drei": `export * from "@react-three/drei";`,
  "r3f-postprocessing": `export * from "@react-three/postprocessing";`,
};
// outName → node_modules path (three addons — resolved files, imported directly).
const FILE_ENTRIES = {
  "three-pass": "three/examples/jsm/postprocessing/Pass.js",
  "three-effectcomposer": "three/examples/jsm/postprocessing/EffectComposer.js",
  "three-renderpass": "three/examples/jsm/postprocessing/RenderPass.js",
  "three-shaderpass": "three/examples/jsm/postprocessing/ShaderPass.js",
  "three-unrealbloompass": "three/examples/jsm/postprocessing/UnrealBloomPass.js",
  "three-objloader": "three/examples/jsm/loaders/OBJLoader.js",
  "three-roomenvironment": "three/examples/jsm/environments/RoomEnvironment.js",
};

const TMP = join(ROOT, "node_modules/.cache/ds-vendor-entries");
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const entryPoints = {};
for (const [name, src] of Object.entries(CONTENT_ENTRIES)) {
  const p = join(TMP, `${name}.js`);
  writeFileSync(p, src);
  entryPoints[name] = p;
}
for (const [name, rel] of Object.entries(FILE_ENTRIES)) {
  entryPoints[name] = join(ROOT, "node_modules", rel);
}

let vendorOk = true;
try {
  await build({
    entryPoints,
    bundle: true,
    splitting: true,
    format: "esm",
    outdir: VENDOR_DIR,
    minify: true,
    target: ["es2020"],
    define: { "process.env.NODE_ENV": '"production"' },
  });
} catch (e) {
  vendorOk = false;
  console.error("Vendored library build FAILED:", e.message.split("\n")[0]);
}
rmSync(TMP, { recursive: true, force: true });

// gsap UMD builds — loaded via <script> tags (not the importmap) for the intro
// animations that use the global `gsap`/`CustomEase`/`ScrollTrigger`.
const GSAP_UMD = ["gsap.min.js", "CustomEase.min.js", "ScrollTrigger.min.js"];
for (const f of GSAP_UMD) {
  copyFileSync(join(ROOT, "node_modules/gsap/dist", f), join(VENDOR_DIR, f));
}

if (!vendorOk) process.exit(1);
const entryCount = Object.keys(entryPoints).length;
console.log(`Vendored ${entryCount} libraries (split) + ${GSAP_UMD.length} gsap UMD builds`);

// ── Effect components ────────────────────────────────────────────────────────

const results = { success: [], skipped: [], failed: [] };

for (const category of CATEGORIES) {
  const catDir = join(COMPONENTS_DIR, category);
  if (!existsSync(catDir)) continue;

  // Scan both root and subdirectories (e.g., backgrounds/webgl, backgrounds/canvas)
  const scanDir = (dir) => {
    const entries = readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        files = files.concat(scanDir(join(dir, entry.name)));
      } else if (entry.name.endsWith(".tsx")) {
        files.push(join(dir, entry.name));
      }
    }
    return files;
  };

  const files = scanDir(catDir);

  for (const file of files) {
    const name = basename(file, ".tsx");

    if (SKIP.has(name)) {
      results.skipped.push(name);
      continue;
    }

    const id = toKebab(name);

    try {
      await build({
        entryPoints: [file],
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
