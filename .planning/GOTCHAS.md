# DreamySuite — Gotchas

Real bugs and regressions. Read before debugging or building. Update when a new one is discovered.

---

## Critical

### Animation positioning: never use inset:0
**What happened:** Animation preview used `inset:0` which overlaid the full screen instead of playing at the block's location.
**Fix:** Use `insertBefore` to position relative to the block's actual DOM position.
**Rule:** Always use the block's computed position. Test by playing animation on a block NOT at the top of the page.

### CSS variables — blocks must use design system variables
**What happened:** FAQ, Schedule, Travel, FunFacts blocks hardcoded colors. Broke theming.
**Fix:** PR #54 — converted to CSS variables.
**Rule:** All block styles use only: `--muted`, `--body-color`, `--border`, `--bg`. No hardcoded hex.

### Editor preview vs public render desync
**What happened:** A block looked correct in editor preview but broke on the published `[slug]` route. They are different code paths.
**Rule:** For any block render change, test BOTH: editor preview AND the published `[slug]` route.

### Inspector reads stale state
**What happened:** Inspector panel showed stale data when block selection changed while inspector was open.
**Rule:** Inspector must derive all state from `editorStore` — never local component state.

### Margin inputs only committed on blur (now fixed)
**What happened:** Values entered but not blurred were lost on refresh.
**Fix:** PR #54 — inputs now commit on every keystroke.
**Status:** Fixed.

---

## Architecture

### The cascade system trap
**What happened:** A cascade/inheritance system was built but spread across 4 files with no SSOT. When it broke, nobody could find where to debug it.
**Rule:** Any feature touching more than 1 file needs an SSOT in `src/lib/`. Add it to CONSTITUTION.md before building.

### Domain refactor: never work two domains simultaneously
**What happened:** Parallel domain work caused merge conflicts and broke the test suite.
**Rule:** One domain per PR. Complete → test → commit → start next.

### src/lib barrel export always needs updating
**What happened:** New lib module added but not exported from `src/lib/index.ts`. Downstream imports failed silently.
**Rule:** Every new `src/lib/*.ts` must be exported from `src/lib/index.ts`. Verify before committing.

### Editor state: all shared state goes through editorStore
**What happened:** Historical editor.tsx had 600+ useState calls creating fragmented state. Editor is now decomposed across 112 files.
**Rule:** All shared state goes through `editorStore.ts` (Zustand slices). Local component state is fine for UI-only concerns (hover, open/close).

### Canvas scaling: always use canonical width, never getBoundingClientRect for percentages
**What happened:** BreakpointFrame applies CSS `transform: scale()` when the canvas is narrower than 1280/768/390. `getBoundingClientRect()` returns scaled (visual) dimensions, not canonical dimensions. Drag/resize percentage calculations using scaled width produced wrong values.
**Fix:** useDrag.ts now uses `containerRect.width / scaleFactor` for canonical width. Mouse deltas are divided by scaleFactor to convert screen pixels to canvas pixels.
**Rule:** For percentage calculations in the editor canvas, always use canonical width (1280/768/390) or `getBoundingClientRect().width / scaleFactor`. Never use raw `getBoundingClientRect().width` for percentage math. Import `useCanvasScale()` from BreakpointFrame.tsx.

### Block positioning: wrapper owns desktop, section owns tablet/mobile — never both
**What happened:** Both `getBlockStyle()` (wrapper div) and `blockSectionStyle()` (section element) applied `translate(ox, oy)` on desktop. Visual offset was 2× the stored value. Selection boxes appeared at half the correct position. Drag calculations were off because the wrapper was measured at 1× while content rendered at 2×.
**Fix:** Commits `5c86d76`, `2bda273` — `blockSectionStyle` now skips translate on desktop entirely. `getBlockStyle` is the single source of desktop positioning.
**Rule:** On desktop, ALL positioning (position:absolute + transform) lives in `getBlockStyle` / `src/lib/blockPositioning.ts`. `blockSectionStyle` / `src/lib/editableField.ts` handles translate ONLY for tablet/mobile. Never add translate to blockSectionStyle for desktop.

### Block positioning: flow-to-absolute transition breaks other blocks
**What happened:** `getBlockStyle` returned `undefined` (normal flow) for zero-offset blocks. When a block was dragged, it gained an offset and became `position:absolute`, leaving normal flow. All flow-positioned blocks below it shifted up to fill the gap.
**Fix:** Commit `2bda273` — `getBlockStyle` now always returns `position:absolute` on desktop regardless of offset. `useDrag.startMove` seeds `startOffsetX/Y` from the block's current DOM position when no stored offset exists, so the block doesn't snap to `top:0` on first drag.
**Rule:** On desktop, blocks are ALWAYS `position:absolute`. Zero-offset blocks sit at `top:0` — they must be dragged to their intended position. A block's stored `blockOffsetY` is an absolute pixel distance from the container top, not a relative offset from flow position.

### data-block-id must be on the wrapper div, not just the section
**What happened:** `data-block-id` was only on the inner `<section>` (block component root). When `document.elementsFromPoint` returned the wrapper div edge, `closest("[data-block-id]")` returned null — selection cycling silently failed.
**Fix:** Commit `5c86d76` — `data-block-id`, `data-block-type`, `data-block-label` added to MemoBlock wrapper div in `SiteRenderer.tsx`. The `seen` Set in EditorOverlay deduplicates so each block appears once in the selection stack.
**Rule:** The wrapper div (`data-block-wrapper`) and the inner section both carry `data-block-id`. This is intentional. `SelectionLayer`, `useDrag`, and `detectCollisions` all query `[data-block-id]` — they get the wrapper first, which now has the correct single-transform position.

---

### Animation presets: two separate code paths, no build pipeline

**What happened:** `src/app/animations/presets/*.ts` (editor/preview) and `public/animations/presets/*.js` (public site) are completely independent files. The TS sources use `await import("gsap")`; the JS files rely on the global `gsap` variable from the CDN script. There is no compile step connecting them.
**Rule:** Any change to a TS preset (`fadeIn.ts`, `springIn.ts`, etc.) MUST be manually mirrored to the corresponding `public/animations/presets/*.js` file. If you add a new preset, create BOTH files. Add the preset ID to `VALID_PRESET_IDS` in `src/app/[slug]/route.ts`.
**Future:** A `scripts/build-animation-presets.ts` compile step would eliminate this — not yet built.

---

### North resize handle collapses block to minimum height
**What happened:** `minTopEdge` in `useDrag.ts` was computed as `Math.max(bounds.minY, bottomEdgePx - 20)`. Since `bottomEdgePx - 20 > bounds.minY` on any non-trivial canvas, this always equalled `bottomEdgePx - 20`. The outer `Math.max(minTopEdge, Math.min(bottomEdgePx-20, desired))` then always resolved to `bottomEdgePx - 20` — minimum height every time.
**Fix:** PR #167 — `minTopEdge = bounds.minY` only. The `Math.min(bottomEdgePx - 20, desired)` upper bound still enforces the minimum height without freezing the value.
**Rule:** When clamping a range, verify that the lower bound < upper bound. If `max(x, y) == min(x, y)` for any real input, the clamp is broken.

### Tablet block order ≠ desktop visual order after drag
**What happened:** Dragging blocks on desktop changes `blockOffsetY` (absolute Y position) but not `sortOrder` in the DB. On desktop this is fine (blocks are `position:absolute`, visual order = Y positions). On tablet/mobile, blocks are in normal flow, so render array order = visual order. Array order uses `sortOrder` (unchanged), causing divergence.
**Fix:** PR #167 — `SiteRenderer.tsx` now sorts by `blockOffsetY` from config when `ordered=true` and breakpoint is tablet/mobile.
**Rule:** Any time visual order on desktop can diverge from array order, tablet flow will be wrong. Desktop drag → update both `blockOffsetY` AND re-sort/re-index `sortOrder` eventually.

### CSS variables — `--site-*` namespace for blocks, shadcn names for editor UI
**What happened:** `site-blocks.css` originally defined `--accent`, `--muted`, `--border`, `--radius` — colliding with shadcn/ui globals.
**Fix:** PR #208 renamed all site variables to `--site-accent`, `--site-muted`, `--site-border`, `--site-radius`. Flattened theme chain: `siteThemeVars()` outputs final names directly (no `--theme-*` intermediary).
**Rule:** Site/block CSS variables use `--site-*` prefix. Shadcn names (`--accent`, `--muted`, `--border`, `--radius`, `--primary`) are reserved for editor UI. `globals.css` owns shadcn variables; `site-blocks.css` owns `--site-*` variables.
**Status:** Fixed (PR #208).

### Focus management — use focus restoration, not blur exemption lists
**What happened:** `useEditEventHandlers.ts` prevented text edit commit by checking `closest("[data-format-toolbar]")` and `closest("[data-inspector]")`. Every new panel needed a manual exemption.
**Fix:** PR #209 replaced exemptions with `useLastFocus` hook + `requestAnimationFrame` pattern. Inspector calls `restoreFocus()` on mousedown; blur handler checks if focus returned before committing.
**Rule:** Don't add `closest("[data-something]")` exemptions to blur handlers. New panels get focus-safe behavior automatically via `restoreFocus()`.
**Status:** Fixed (PR #209).

### Iframe isolation — use el.ownerDocument, not document
**What happened:** Phase 2 moved site content into an iframe via React portal. All `document.*` and `window.*` calls in editing hooks (useEditEventHandlers, useDblClickActivation, useDrag) referenced the parent document, not the iframe where contenteditable and blocks live.
**Fix:** PRs #215-#218 — replaced `document.activeElement` with `el.ownerDocument.activeElement`, `document.execCommand` with `el.ownerDocument.execCommand`, `window.getSelection()` with `el.ownerDocument.defaultView?.getSelection()`, etc. Drag listeners added to both iframe and parent windows. Keyboard and mouse events forwarded from iframe to parent.
**Rule:** When writing code that touches DOM inside the canvas: always use `el.ownerDocument` (not `document`) and `el.ownerDocument.defaultView` (not `window`). The canvas content lives in an iframe; the editor chrome lives in the parent.
**Status:** Fixed (PRs #215-#218).

### Effects components use parent window for mouse events
**What happened:** Effect components (cursor, background, decoration) call `window.addEventListener("mousemove")`. Since effects render inside the iframe but `window` resolves to the parent, mouse events from the iframe don't reach them.
**Fix:** PR #218 — BreakpointFrame forwards mousemove/mousedown/mouseup from iframe document to parent window.
**Rule:** Effects can listen on `window` as long as mouse event forwarding is active. If adding new event types (scroll, touch), add forwarding in BreakpointFrame's iframe event bridge. Effects that inject `<style>` into `document.head` will affect the parent, not the iframe — use inline styles or pass through React props instead.
**Status:** Mitigated (PR #218). Style injection into document.head remains a known limitation.

---

## Update log

| Date | Gotcha added | Source |
|---|---|---|
| 2026-04-28 | All initial entries | Architecture review session |
| 2026-04-29 | Double-transform, flow/absolute mismatch, data-block-id placement | Responsive canvas debug session (PR #147) |
| 2026-04-29 | Animation presets dual code path (TS + JS must stay in sync manually) | Codebase audit |
| 2026-04-29 | North resize collapse (minTopEdge == maxTopEdge), tablet block order mismatch | Debug session (PR #167) |
| 2026-04-30 | CSS variable namespace collision (site-blocks.css vs shadcn/ui) | Bug triage (PR #207) |
| 2026-04-30 | Focus exemption fragility (closest() pattern) | Bug triage (PR #207) |
| 2026-04-30 | Updated: CSS namespace collision → fixed (PR #208), focus exemption → fixed (PR #209) | Editor isolation Phase 1 |
| 2026-04-30 | Iframe isolation: ownerDocument rule, effects mouse forwarding | Editor isolation Phase 2 (PRs #214-#218) |
| 2026-05-02 | Canvas scaling: canonical width for percentages, updated editor.tsx monolith gotcha | Cross-browser rendering fix (#248) |
