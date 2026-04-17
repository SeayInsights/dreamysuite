# Plan: DreamySuite Editor Overhaul

**Spec:** `.planning/dreamysuite-editor-overhaul.md`
**Date:** 2026-04-16
**Repo:** `C:\Users\Dannis Seay\builds\dreamysuite`
**Cutover strategy:** In-place rebuild behind `NEXT_PUBLIC_EDITOR_V2` feature flag. Legacy `editor.tsx` untouched until V2 reaches parity + two-week no-regression window.

---

## Tasks

### Phase 1 — Foundation

#### 1. Tailwind CSS 4 + PostCSS setup
- **Files:** `package.json`, `postcss.config.mjs` (or equivalent), `src/app/globals.css`, `tailwind.config.ts`
- **Depends on:** none
- **Acceptance:** `npm run build` succeeds; a `<div className="bg-red-500">` in the dashboard route renders red; existing `site-editor.css` still loads for legacy editor.
- **Complexity:** low

#### 2. shadcn/ui + Radix primitives scaffold
- **Files:** `components.json`, `src/components/ui/*` (Button, Dialog, Popover, Tabs, Tooltip, Command, Sheet, Toast, ScrollArea)
- **Depends on:** 1
- **Acceptance:** `npx shadcn add` installs without error; shadcn Button renders inside a dashboard page with correct Tailwind styling.
- **Complexity:** low

#### 3. Motion One + feature-flag infrastructure
- **Files:** `package.json`, `src/lib/flags.ts`, `src/lib/motion.ts`, `.env.local.example`
- **Depends on:** 1
- **Acceptance:** `import { animate } from 'motion'` works; `flags.editorV2` returns true when `NEXT_PUBLIC_EDITOR_V2=true`, false otherwise; flag readable both server and client.
- **Complexity:** low

#### 4. Zustand slice refactor
- **Files:** `src/app/stores/editorStore.ts` (split into `editorShellSlice.ts`, `documentSlice.ts`, `transientSlice.ts`, composed in `editorStore.ts`)
- **Depends on:** none
- **Acceptance:** Legacy editor continues to function with identical behavior (selectors updated for new slice shape); Zundo undo/redo operates only on `document` slice (UI state changes do not create history entries — verifiable by opening a panel, undoing, and confirming panel state does not revert).
- **Complexity:** medium

#### 5. V2 flagged entry scaffold
- **Files:** `src/app/(dashboard)/sites/[id]/page.tsx` (route flip), `src/app/(dashboard)/sites/[id]/editor-v2/index.tsx`, `src/app/(dashboard)/sites/[id]/editor-v2/EditorShell.tsx` (empty shell)
- **Depends on:** 3
- **Acceptance:** With `NEXT_PUBLIC_EDITOR_V2=true`, navigating to `/sites/:id` renders empty V2 shell with a "V2" watermark; with flag off, renders existing `editor.tsx` unchanged.
- **Complexity:** low

#### 6. AI provider interface stub
- **Files:** `src/lib/ai/provider.ts`, `src/lib/ai/adapters/index.ts` (empty adapter exports)
- **Depends on:** none
- **Acceptance:** `AIProvider` TypeScript interface exists with methods `generateText`, `generateImage`, `listModels`; adapter registry exports `registerAdapter` and `getAdapter`; zero AI functionality shipped (calling any method throws `NotImplemented`); TypeScript compiles.
- **Complexity:** low

---

### Phase 2 — Shell

#### 7. Icon rail + slide-out tray system
- **Files:** `editor-v2/IconRail.tsx`, `editor-v2/SlideTray.tsx`, `editor-v2/trays/{Pages,Elements,Layers,Theme,Settings}Tray.tsx` (stubs)
- **Depends on:** 2, 5
- **Acceptance:** 48px icon rail renders on left; clicking an icon opens a tray *over* the canvas (does not push); tray close on outside click; rail auto-collapses from expanded state within 250ms of editor mount (Motion One); `[` key toggles rail between 48px and 0px.
- **Complexity:** medium

#### 8. Top bar
- **Files:** `editor-v2/TopBar.tsx`, `editor-v2/topbar/{BreakpointToggle,ModeToggle,UndoRedo,PreviewButton,SaveStatus,PublishButton}.tsx`
- **Depends on:** 2, 4, 5
- **Acceptance:** Top bar renders all six controls; breakpoint toggle updates `editorShell.breakpoint`; mode toggle updates `editorShell.mode`; undo/redo buttons disable appropriately when Zundo history is empty; preview button opens the public `/[slug]` route in new tab.
- **Complexity:** medium

#### 9. Keyboard shortcut registry
- **Files:** `editor-v2/hooks/useShortcuts.ts`, `editor-v2/EditorShell.tsx` (wiring)
- **Depends on:** 5, 7, 8
- **Acceptance:** `[` toggles rail, `]` toggles inspector, `Cmd+.` toggles full-preview (hides all chrome), `G` shows grid overlay, `I` opens inspector, `P` opens preview, `Cmd+Z` / `Cmd+Shift+Z` wired to Zundo. Shortcuts do not fire while focus is inside an editable text input.
- **Complexity:** low

#### 10. Breakpoint frame + selection layer
- **Files:** `editor-v2/BreakpointFrame.tsx`, `editor-v2/SelectionLayer.tsx`, `editor-v2/hooks/useSelection.ts`
- **Depends on:** 4, 7
- **Acceptance:** Canvas renders constrained to breakpoint width (1280 / 768 / 390); selection layer overlays canvas with pointer-events only on element bounds; hovering a (stub) element shows 1px accent outline + label chip; clicking solidifies selection; clicking empty canvas deselects.
- **Complexity:** medium

#### 11. Inspector panel shell + breadcrumb
- **Files:** `editor-v2/Inspector.tsx`, `editor-v2/Breadcrumb.tsx`, `editor-v2/inspector/{Layout,Content,Style,Motion,Assistant}Tab.tsx` (stubs)
- **Depends on:** 2, 10
- **Acceptance:** Inspector closed by default; `]` key or top-bar button opens/closes it with Motion One slide; breadcrumb renders bottom-left showing ancestor path of current selection (e.g., `Section > Column > Text`); clicking a breadcrumb segment selects that ancestor; Assistant tab exists but renders "Coming soon" (AI slot reserved).
- **Complexity:** medium

---

### Phase 3 — Canvas

#### 12. Port public-site renderer to shared React components
- **Files:** `src/app/components/blocks/*` (existing 12 components audited + exported via shared barrel), `src/app/components/SiteRenderer.tsx`, `src/app/[slug]/route.ts` (updated to use shared renderer OR kept until cutover — see acceptance)
- **Depends on:** 1
- **Acceptance:** `SiteRenderer` component renders a full site from the same data shape used by `/[slug]/route.ts`; visual-regression snapshot of three existing prod sites renders identically between route.ts path and new React component path; no block rendering logic duplicated.
- **Complexity:** high

#### 13. Canvas mount + hover/select
- **Files:** `editor-v2/Canvas.tsx`, `editor-v2/EditorOverlay.tsx`, `editor-v2/hooks/useHover.ts`
- **Depends on:** 10, 12
- **Acceptance:** `<SiteRenderer>` mounts inside `<EditorOverlay>` inside `<BreakpointFrame>`; hovering any rendered block shows selection layer outline; clicking selects the block and updates `editorShell.selection`; works at all three breakpoints.
- **Complexity:** medium

#### 14. Inline text editing + floating format toolbar
- **Files:** `editor-v2/editing/TextEditor.tsx`, `editor-v2/editing/FloatingFormatToolbar.tsx`, `editor-v2/hooks/useFloatingToolbar.ts`
- **Depends on:** 13
- **Acceptance:** Double-click any text element → caret inserts at click position, contentEditable active, floating toolbar appears within 100ms pinned above the element (flips below when near viewport top); toolbar provides font family, size, weight, color, alignment; changes update `document` slice; blur saves; Cmd+B / Cmd+I / Cmd+U wired; undo/redo preserved.
- **Complexity:** high

#### 15. Inline image editing + floating toolbar
- **Files:** `editor-v2/editing/ImageEditor.tsx`, `editor-v2/editing/CropHandles.tsx`, `editor-v2/editing/ReplaceMediaDialog.tsx`
- **Depends on:** 13
- **Acceptance:** Double-click any image element → crop handles render in place + floating toolbar with Replace / Crop / Filter / Animate; Replace opens media picker dialog (Uploads, Stock, Unsplash tabs — Unsplash may stub for now); drag handles resize/crop the image in real time; changes persist to `document` slice.
- **Complexity:** high

#### 16. Section toolbar + context menu
- **Files:** `editor-v2/editing/SectionToolbar.tsx`, `editor-v2/editing/ContextMenu.tsx`
- **Depends on:** 13
- **Acceptance:** Selecting a section shows floating section toolbar (Background, Padding, Animation); right-clicking any element opens context menu with Copy / Duplicate / Delete / Save as Template; keyboard Delete key deletes selected element; Cmd+D duplicates.
- **Complexity:** medium

#### 17. Drag handles + grid snap
- **Files:** `editor-v2/editing/DragHandles.tsx`, `editor-v2/hooks/useDrag.ts`, `editor-v2/GridOverlay.tsx`
- **Depends on:** 13
- **Acceptance:** Selected element shows 8 resize handles + move handle; dragging snaps to 12-column grid; `G` shows grid overlay while held; snap threshold is 8px; drag updates `document` slice with layout deltas; works on touch devices (44px handle targets).
- **Complexity:** high

---

### Phase 4 — Blocks

#### 18. Consolidate existing blocks + forward-migration
- **Files:** `src/lib/schemas/blocks.ts` (new schemas: `media-video`, `gallery`, `info-card`), `src/app/components/blocks/{MediaVideo,Gallery,InfoCard}.tsx`, `src/lib/migrations/blockConsolidation.ts`, test fixtures in `testing/`
- **Depends on:** 12
- **Acceptance:** Zod schemas validate correctly for all three merged blocks; migration script converts `video`+`youtube` → `media-video`, `images`+`photo-split` → `gallery`, `registry-card`+`hotel-card` → `info-card` on a cloned test site with 100% visual parity verified via snapshot; legacy renderers preserved and invoked for any un-migrated records.
- **Complexity:** high

#### 19. New block schemas + components
- **Files:** `src/lib/schemas/blocks.ts` (add `rsvp-form`, `story-timeline`, `guest-book`), `src/app/components/blocks/{RsvpForm,StoryTimeline,GuestBook}.tsx`, API routes for RSVP form + guest book submissions
- **Depends on:** 12
- **Acceptance:** Each new block renders in `SiteRenderer` at all breakpoints; RSVP form submits to existing guest list API and creates guest records; guest book stores and displays entries; story-timeline scroll-pinning works on desktop and mobile; Zod schemas prevent invalid configs.
- **Complexity:** high

#### 20. Block component registry update
- **Files:** `editor-v2/blocks/registry.ts`
- **Depends on:** 18, 19
- **Acceptance:** Registry maps all 13 block types to their component + default data + icon + display name + Simple/Pro visibility; registry consumed by `SiteRenderer` and insert palette.
- **Complexity:** low

#### 21. `+` inline block-insert palette
- **Files:** `editor-v2/editing/InsertButton.tsx`, `editor-v2/editing/InsertPalette.tsx`
- **Depends on:** 13, 20
- **Acceptance:** Hovering between two blocks shows `+` button; clicking opens command palette with all available blocks (filtered by Simple/Pro mode); selecting inserts block at that position with defaults from registry; keyboard Arrow + Enter navigation works.
- **Complexity:** medium

#### 22. `/` slash command palette + extensible registry
- **Files:** `editor-v2/editing/SlashPalette.tsx`, `editor-v2/commands/registry.ts`, `editor-v2/commands/builtins.ts`
- **Depends on:** 14
- **Acceptance:** Typing `/` in any editable text field opens command palette; built-in commands: Insert Block, Heading, List, Link, Divider, Emoji; registry exposes `registerCommand(cmd)` API; AI command group reserved (renders "Connect AI — coming soon" placeholder that does not execute).
- **Complexity:** medium

---

### Phase 5 — Mobile editor

#### 23. Touch handles + bottom-sheet toolbar
- **Files:** `editor-v2/editing/BottomSheetToolbar.tsx`, responsive updates to `DragHandles`, `CropHandles`, `FloatingFormatToolbar`
- **Depends on:** 14, 15, 16, 17
- **Acceptance:** At viewport <768, all handles render at 44px+; floating toolbars replaced with bottom-sheet variant; sheet dismiss on swipe-down; sheet does not cover selected element (canvas auto-pans if needed).
- **Complexity:** medium

#### 24. Gestures + collapsed-rail default
- **Files:** `editor-v2/hooks/useGestures.ts`, `editor-v2/EditorShell.tsx` (default rail state by viewport)
- **Depends on:** 7, 23
- **Acceptance:** Pinch-to-zoom canvas works; long-press opens context menu; icon rail defaults to collapsed (0px) on <768 viewports; two-finger scroll does not trigger selection.
- **Complexity:** medium

#### 25. Real device testing + fixes
- **Files:** any files surfaced by testing
- **Depends on:** 23, 24
- **Acceptance:** Editor dogfooded end-to-end on iOS Safari (iPhone 14+), Android Chrome (Pixel 7+), and iPad Safari; Director creates a new site, edits text, replaces image, adds RSVP block, saves, previews. Zero blocker bugs; any cosmetic bugs filed but not blocking.
- **Complexity:** medium

---

### Phase 6 — Motion

#### 26. Motion One chrome animations
- **Files:** updates across `IconRail`, `SlideTray`, `Inspector`, `SelectionLayer`, `FloatingFormatToolbar`, `BottomSheetToolbar`, `InsertPalette`
- **Depends on:** 7, 11, 13, 21, 23
- **Acceptance:** Icon rail slide: 250ms ease-out; tray open: 200ms; inspector open: 220ms; selection outline fade-in: 120ms; toolbar pop: 100ms with slight scale; no janky transitions at 60fps on a 2020 MacBook Air; `prefers-reduced-motion` respected (animations reduced to 0ms).
- **Complexity:** medium

#### 27. GSAP preset library (10 presets, dynamic import)
- **Files:** `src/app/animations/presets/{fadeSlideUp,splitText,maskWipe,parallaxMonogram,kenBurns,scrollPinnedStory,stickyDate,blurIn,envelopeUnfold,letterCascade}.ts`, `src/app/animations/registry.ts`, updates to public `/[slug]` renderer to invoke registry
- **Depends on:** 12
- **Acceptance:** Each preset registered in the animation registry; selecting a preset in editor stores preset ID on block; public site loads only the preset JS for presets actually used (dynamic import verified in Network tab — no unused presets in bundle); visual QA on three prod sites confirms presets render correctly.
- **Complexity:** high

#### 28. Motion tab UI + Simple/Pro split
- **Files:** `editor-v2/inspector/MotionTab.tsx`, `editor-v2/inspector/AnimationPresetPicker.tsx`
- **Depends on:** 11, 27
- **Acceptance:** Motion tab shows preset picker (thumbnail grid of 10 presets); Simple mode shows only preset selection; Pro mode reveals duration, delay, easing-curve controls below preset; changes preview live on canvas.
- **Complexity:** medium

---

### Phase 7 — Pro mode

#### 29. Breakpoint-scoped style edits
- **Files:** `editor-v2/hooks/useStyledValue.ts`, updates to all inspector style controls to read/write `Styled<T>` shape
- **Depends on:** 10, 11
- **Acceptance:** Switching breakpoint toggle in top bar switches which layer (`base` / `tablet` / `mobile`) the inspector edits; per-breakpoint value has empty state indicator when inheriting from desktop (italic placeholder + "inheriting"); Simple mode only exposes `base` editing; Pro mode allows overrides on any breakpoint; removing override falls back to parent.
- **Complexity:** high

#### 30. CSS escape hatch
- **Files:** `editor-v2/inspector/CustomCssPanel.tsx`, sanitizer at `src/lib/cssSanitize.ts`
- **Depends on:** 11, 29
- **Acceptance:** Pro-mode-only panel in inspector with CSS textarea; CSS is sanitized server-side before save (no `@import`, no `url()` to arbitrary origins, no JS); injected as scoped style on the element; invalid CSS shows inline lint error.
- **Complexity:** medium

#### 31. Theme token editor
- **Files:** `editor-v2/trays/ThemeTray.tsx`, `editor-v2/inspector/ThemeTokenPicker.tsx`
- **Depends on:** 7, 11
- **Acceptance:** Theme tray exposes color palette (primary, secondary, accent, background, text) and typography (heading font, body font, scale); changes cascade to all blocks using theme tokens; Simple mode: curated preset themes; Pro mode: raw token editing.
- **Complexity:** medium

#### 32. Advanced animation panel
- **Files:** updates to `MotionTab.tsx` + `AnimationPresetPicker.tsx` for Pro mode
- **Depends on:** 28
- **Acceptance:** Pro mode exposes numeric duration (ms) and delay (ms) inputs, easing dropdown with 10+ curves (ease, ease-in, ease-out, ease-in-out, linear, bounce, elastic, back, circ, quart), and trigger selector (on-view / on-hover / on-scroll-scrub); changes preview live.
- **Complexity:** medium

---

### Phase 8 — Cutover

#### 33. Telemetry wiring
- **Files:** `src/lib/telemetry/editor.ts`, instrumentation across editor-v2 (selection latency, save latency, error boundary reports)
- **Depends on:** all V2 work (13 onwards)
- **Acceptance:** Editor emits events: `editor.mount`, `editor.select` (with latency), `editor.save` (with latency + success/fail), `editor.error` (boundary catches); events land in existing telemetry sink; dashboard query confirms events arriving.
- **Complexity:** medium

#### 34. Beta dogfood + fix list
- **Files:** any surfaced by dogfood
- **Depends on:** 25, 26, 27, 33
- **Acceptance:** Director + three external friendly users build a real site on V2 end-to-end (editor entry → canvas edit → breakpoint check → publish → guest visit); zero P0 or P1 bugs open; fix list groomed to <10 P2s before flip.
- **Complexity:** high

#### 35. Flip default + retire legacy
- **Files:** `src/app/(dashboard)/sites/[id]/page.tsx` (default on), `package.json` (remove unused CSS), **do not delete `editor.tsx` yet**
- **Depends on:** 34
- **Acceptance:** V2 is default for 100% of users; flag allows fallback to V1 via env var; two weeks elapse with no P0/P1 regressions reported; legacy `editor.tsx` + unused CSS files removed in a dedicated commit after the window.
- **Complexity:** medium

#### 36. Recap + memory capture
- **Files:** `recaps/2026-XX-editor-overhaul.md`, memory updates
- **Depends on:** 35
- **Acceptance:** Recap written per `recap:` skill; new project memory captures final block catalog, motion preset IDs, editor architecture decisions; stale memories (e.g., pre-overhaul block list) removed or updated.
- **Complexity:** low

---

## Summary

| # | Task | Depends on | Complexity |
|---|---|---|---|
| 1 | Tailwind CSS 4 + PostCSS | none | low |
| 2 | shadcn/ui + Radix | 1 | low |
| 3 | Motion One + feature flag | 1 | low |
| 4 | Zustand slice refactor | none | medium |
| 5 | V2 flagged entry scaffold | 3 | low |
| 6 | AI provider interface stub | none | low |
| 7 | Icon rail + slide-out tray | 2, 5 | medium |
| 8 | Top bar | 2, 4, 5 | medium |
| 9 | Keyboard shortcut registry | 5, 7, 8 | low |
| 10 | Breakpoint frame + selection layer | 4, 7 | medium |
| 11 | Inspector panel + breadcrumb | 2, 10 | medium |
| 12 | Shared site renderer | 1 | high |
| 13 | Canvas mount + hover/select | 10, 12 | medium |
| 14 | Inline text edit + format toolbar | 13 | high |
| 15 | Inline image edit + toolbar | 13 | high |
| 16 | Section toolbar + context menu | 13 | medium |
| 17 | Drag handles + grid snap | 13 | high |
| 18 | Block consolidation + migration | 12 | high |
| 19 | New block schemas + components | 12 | high |
| 20 | Block component registry | 18, 19 | low |
| 21 | `+` inline insert palette | 13, 20 | medium |
| 22 | `/` slash command palette | 14 | medium |
| 23 | Touch handles + bottom-sheet toolbar | 14, 15, 16, 17 | medium |
| 24 | Gestures + collapsed-rail default | 7, 23 | medium |
| 25 | Real device testing pass | 23, 24 | medium |
| 26 | Motion One chrome animations | 7, 11, 13, 21, 23 | medium |
| 27 | GSAP preset library (10 presets) | 12 | high |
| 28 | Motion tab UI + Simple/Pro split | 11, 27 | medium |
| 29 | Breakpoint-scoped style edits | 10, 11 | high |
| 30 | CSS escape hatch | 11, 29 | medium |
| 31 | Theme token editor | 7, 11 | medium |
| 32 | Advanced animation panel | 28 | medium |
| 33 | Telemetry wiring | 13+ | medium |
| 34 | Beta dogfood + fix list | 25, 26, 27, 33 | high |
| 35 | Flip default + retire legacy | 34 | medium |
| 36 | Recap + memory capture | 35 | low |

**Total:** 36 tasks — 9 high, 17 medium, 10 low.

---

## Parallelization opportunities

- **Foundation wave** (1, 4, 6): all parallel — no mutual dependencies
- **Shell wave** (7, 8): both depend on Phase 1 but not on each other — parallel after foundation
- **Canvas leaf nodes** (14, 15, 16, 17): all depend only on 13 — can run in parallel
- **Blocks wave** (18, 19): parallel — independent schemas
- **Phase 6 + 7** overlap — motion work (26–28) and Pro-mode work (29–32) can interleave once Phase 2 + 3 land

## Next in pipeline
→ `build:` to execute this plan (with Director go-ahead per task wave).

---

**Approval request:** Director, ready to run `build:` starting with the Foundation wave (tasks 1, 4, 6 in parallel)? Or adjustments first?
