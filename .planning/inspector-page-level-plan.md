# Plan: Inspector Page-Level Refactor + Animation Popover

**Spec:** `.planning/inspector-page-level-refactor.md`
**Date:** 2026-04-17
**Branch:** `feat/editor-overhaul`

---

## Tasks

### 1. Schema + migration for new page settings fields
- **Files:** `src/lib/schemas/settings.ts`, `migrations/0025_page_settings.sql`
- **Depends on:** none
- **Acceptance:** `SettingsSchema` includes 7 new fields (`sectionSpacing`, `pageTemplate`, `seoTitle`, `seoDescription`, `ogImage`, `animationsDisabled`, `defaultAnimation`); `DEFAULTS` exposes them; migration SQL adds columns to `site_setting` table; `npx tsc --noEmit` passes.
- **Complexity:** low

### 2. Settings store slice
- **Files:** `src/app/stores/slices/settings.ts`, `src/app/stores/editorStore.ts`
- **Depends on:** 1
- **Acceptance:** `SettingsSlice` interface with `settings`, `settingsLoaded`, `settingsDirty`, `loadSettings(siteId)`, `updateSettings(patch)`, `saveSettings(siteId)`. Composed into `EditorState` in `editorStore.ts`. NOT wrapped by Zundo (`partialize` unchanged — only `blocks` tracked). TypeScript compiles.
- **Complexity:** medium

### 3. Settings load + auto-save wiring in EditorShell
- **Files:** `editor-v2/EditorShell.tsx`, `editor-v2/Canvas.tsx` (or new `hooks/useSettingsSync.ts`)
- **Depends on:** 2
- **Acceptance:** `EditorShell` calls `loadSettings(site.id)` on mount. Settings auto-save when `settingsDirty` is true (debounced 1.5s). Unmount flushes any pending save. PublishButton awaits any pending settings save before publishing.
- **Complexity:** medium

### 4. Animation popover in SectionToolbar
- **Files:** `editor-v2/editing/SectionToolbar.tsx`
- **Depends on:** none (reuses existing `AnimationPresetPicker`)
- **Acceptance:** `AnimationStub` replaced with `AnimationPopover` using `FloatingPopover`. Simple mode: `AnimationPresetPicker` grid + "None" clear button. Pro mode: picker + duration (ms input + slider), delay (ms input + slider), easing dropdown (24 options), trigger selector (on-view / on-hover / scroll-scrub). Reads/writes `block.config.animation` via `updateBlock()`. Live preview on preset select. Popover opens on click, closes on outside click.
- **Complexity:** medium

### 5. Inspector shell — remove block gate, show page context
- **Files:** `editor-v2/Inspector.tsx`
- **Depends on:** 2
- **Acceptance:** Inspector no longer gates content behind `selectedBlockId`. Header shows "Page Settings" (not "Block"). All tabs render regardless of selection state. Tabs consume settings from store (not block config). Tab visibility: simple mode shows Layout, Content, Style, Motion; pro mode adds AI.
- **Complexity:** low

### 6. Layout tab — page-level controls
- **Files:** `editor-v2/inspector/LayoutTab.tsx`
- **Depends on:** 2, 5
- **Acceptance:** Controls for: `siteMaxWidth` (text input, px), `marginTop/Right/Bottom/Left` (4-input grid, px), `sectionSpacing` (input, px). Page template placeholder (disabled button "Templates — coming soon"). All read/write via `updateSettings()`. Changes reflect in store immediately. TypeScript compiles.
- **Complexity:** medium

### 7. Content tab — page metadata
- **Files:** `editor-v2/inspector/ContentTab.tsx`
- **Depends on:** 2, 5
- **Acceptance:** Controls for: `eventName` (text input), `seoTitle` (text input with character count, max 60), `seoDescription` (textarea with character count, max 160), `ogImage` (URL input with preview thumbnail). All read/write via `updateSettings()`. TypeScript compiles.
- **Complexity:** medium

### 8. Style tab — page background + animation kill switch
- **Files:** `editor-v2/inspector/StyleTab.tsx`
- **Depends on:** 2, 5
- **Acceptance:** Controls for: `bgColor` (reuses `ColorInput` — solid/gradient/transparent), `bgImage` (URL input + preview), `bgImageOpacity` (slider 0–1), `bgImageLayer` (toggle: behind/overlay). Read-only theme token display (5 colors from `themeTokens` in shell slice, with "Edit in Theme tray" link). `animationsDisabled` toggle at bottom of tab with label "Disable all animations". All read/write via `updateSettings()`. TypeScript compiles.
- **Complexity:** medium

### 9. Motion tab — page-wide default animation
- **Files:** `editor-v2/inspector/MotionTab.tsx`
- **Depends on:** 2, 5
- **Acceptance:** Simple mode: `AnimationPresetPicker` for `defaultAnimation` setting + "None" clear. Pro mode: picker + duration/delay/easing defaults. Explanatory text: "Default entrance animation for all blocks. Override per block in the floating toolbar." Reads/writes via `updateSettings()`. TypeScript compiles.
- **Complexity:** low

### 10. Type check + test pass
- **Files:** any fixes surfaced
- **Depends on:** 4, 6, 7, 8, 9
- **Acceptance:** `npx tsc --noEmit` clean. `npx vitest run` — all tests pass. No regressions in existing test suites.
- **Complexity:** low

---

## Summary

| # | Task | Depends on | Complexity |
|---|------|-----------|------------|
| 1 | Schema + migration | none | low |
| 2 | Settings store slice | 1 | medium |
| 3 | Settings load + auto-save | 2 | medium |
| 4 | Animation popover in SectionToolbar | none | medium |
| 5 | Inspector shell — remove block gate | 2 | low |
| 6 | Layout tab — page-level | 2, 5 | medium |
| 7 | Content tab — page metadata | 2, 5 | medium |
| 8 | Style tab — page bg + kill switch | 2, 5 | medium |
| 9 | Motion tab — page default animation | 2, 5 | low |
| 10 | Type check + test pass | 4, 6–9 | low |

**Total:** 10 tasks — 0 high, 6 medium, 4 low.

---

## Parallelization

- **Wave 1** (tasks 1, 4): Schema + migration and animation popover — no mutual dependency
- **Wave 2** (tasks 2, 3): Settings slice then wiring — sequential
- **Wave 3** (task 5): Inspector shell update — quick, unblocks tabs
- **Wave 4** (tasks 6, 7, 8, 9): All four tab rewrites — parallel (each reads/writes settings independently)
- **Wave 5** (task 10): Final verification
