# Spec: SectionToolbar Animation Popover + Inspector Page-Level Refactor

**Date:** 2026-04-17
**Branch:** `feat/editor-overhaul`
**Status:** PENDING APPROVAL

---

## Problem Statement

Two issues with the current editor V2:

1. **SectionToolbar animation is a stub.** The floating block toolbar shows "Coming in Phase 6" for the Animation button, but Phase 6 is done. Block-level animation editing has no inline entry point — it only exists in the Inspector's MotionTab.

2. **Inspector is block-scoped, should be page-scoped.** The right-panel Inspector (Layout, Content, Style, Motion, AI tabs) currently requires a selected block and edits block config. The user wants it to control page-level settings instead, with all block editing handled by the floating toolbar + inline editing.

---

## Approach A: Inline Animation Popover + Inspector Rewire (Recommended)

**Animation popover:** Replace `AnimationStub` in SectionToolbar with a real popover matching the Background/Padding/Size pattern. Reuse `AnimationPresetPicker` and the Pro mode controls from `MotionTab` in a compact popover layout.

**Inspector rewire:** Rewrite all five Inspector tabs to read/write from site settings (via `GET/PUT /api/sites/[id]/settings`) instead of `block.config`. Add a settings slice to the Zustand store to hold the loaded settings and track dirty state. Remove the `selectedBlockId` gate in Inspector.

**Pros:**
- Minimal new infrastructure — settings API and schema already exist with most needed fields
- Reuses existing `AnimationPresetPicker` component
- Clean separation: floating toolbar = block, Inspector = page

**Cons:**
- Inspector tabs need full rewrites (not just prop changes)
- Need a new store slice + settings fetch/save wiring

---

## Approach B: Dual-Mode Inspector (Block + Page)

Keep the Inspector capable of both block-level and page-level editing. When a block is selected, show block tabs; when nothing is selected, show page tabs.

**Pros:** More flexible, block editing gets both toolbar + panel

**Cons:** Confusing UX (panel changes based on selection state), more complex state management, contradicts user's stated direction

---

## Approach C: Settings in Left Tray Only

Move all page settings into the existing left-rail trays (Settings tray, Theme tray) and remove the Inspector entirely.

**Pros:** Simpler — one editing surface per concern

**Cons:** Loses the persistent right-panel for quick tweaks, Theme tray already handles some of this creating overlap, user explicitly wants the Inspector to become page-level (not removed)

---

## Chosen Approach: A

The user's direction is clear: floating toolbar owns block editing, Inspector owns page editing. Approach A implements this with the least complexity.

---

## Scope

### In Scope

**SectionToolbar animation popover:**
- Replace `AnimationStub` with `AnimationPopover` using `FloatingPopover`
- Simple mode: `AnimationPresetPicker` grid (10 presets) + "None" option
- Pro mode: preset picker + duration (ms), delay (ms), easing dropdown (24 options), trigger selector (on-view / on-hover / on-scroll-scrub)
- Reads/writes `block.config.animation` via `updateBlock()`
- Live preview on preset select (same pattern as current MotionTab)

**New settings store slice:**
- `settingsSlice.ts`: holds loaded `Settings` object, `settingsLoaded` flag, `settingsDirty` flag
- `loadSettings(siteId)` — fetches from API
- `updateSettings(patch)` — merges partial update, marks dirty
- `saveSettings(siteId)` — PUTs to API, marks clean
- NOT tracked by Zundo (settings changes don't undo via Cmd+Z — they auto-save)

**New schema fields** (add to `SettingsSchema` + D1 migration):
- `sectionSpacing` (string, nullable, default null) — px gap between sections
- `pageTemplate` (string, nullable, default null) — template ID placeholder
- `seoTitle` (string, nullable, default null) — page title override
- `seoDescription` (string, nullable, default null) — meta description
- `ogImage` (string, nullable, default null) — social sharing image URL
- `animationsDisabled` (intBool, default 0) — site-wide kill switch
- `defaultAnimation` (string, nullable, default null) — default preset ID for all blocks

**Inspector tab rewrites:**

| Tab | Fields from settings | Notes |
|-----|---------------------|-------|
| **Layout** | `siteMaxWidth`, `marginTop/Right/Bottom/Left`, `sectionSpacing`, `pageTemplate` | Template picker is placeholder (button with "Coming soon") |
| **Content** | `eventName`, `seoTitle`, `seoDescription`, `ogImage` | OG image uses media picker or URL input |
| **Style** | `bgColor`, `bgImage`, `bgImageLayer`, `bgImageOpacity`, theme token display (read from `themeTokens` in shell slice), `animationsDisabled` toggle | Gradient support via existing bgColor. Background image with opacity slider + layer toggle (behind/overlay). Animation kill switch at bottom. |
| **Motion** | `defaultAnimation` (preset picker), `animation` (legacy field — migrate to defaultAnimation) | Simple: preset picker only. Pro: preset + duration/delay/easing defaults |
| **AI** | — | "Coming soon" unchanged |

**Settings loading:**
- `EditorShell` mount effect fetches settings alongside existing block fetch
- Settings auto-save on change (debounced 1.5s) similar to how blocks will eventually auto-save

### Out of Scope
- Page template research/implementation (placeholder only)
- Per-page settings (all settings are site-wide via `site_setting` table)
- Moving theme editing from left tray to Inspector (theme tray stays)
- Block autosave wiring (separate task)
- Legacy editor (`editor.tsx`) changes

---

## Dependencies
- Animation preset registry (done — Task 27)
- `AnimationPresetPicker` component (done — Task 28)
- SectionToolbar popover pattern (done — Task 16)
- Settings API + schema (exists)
- `useStyledValue` hook (done — Task 29, but NOT used for page-level settings since those aren't breakpoint-scoped)

---

## Risk Flags

1. **Settings schema migration** — Adding 7 new columns to `site_setting`. Low risk since it's all nullable additions, no data loss.
2. **Inspector rewrites** — All 4 meaningful tabs get rewritten. Medium risk — functional regression if any tab reads stale state. Mitigated by loading settings into store on mount.
3. **Animation popover size** — 10-preset grid + Pro controls in a popover may feel cramped. May need wider popover (280px vs 224px) or scrollable area.
4. **Auto-save race conditions** — Debounced settings saves could conflict with publish. Mitigated by awaiting any pending save before publish.

---

## File Changes Summary

| Action | File |
|--------|------|
| NEW | `src/app/stores/slices/settings.ts` |
| NEW | `migrations/0025_page_settings.sql` |
| MODIFY | `src/lib/schemas/settings.ts` (add 7 fields) |
| MODIFY | `src/app/stores/editorStore.ts` (compose settings slice) |
| REWRITE | `editor-v2/inspector/LayoutTab.tsx` |
| REWRITE | `editor-v2/inspector/ContentTab.tsx` |
| REWRITE | `editor-v2/inspector/StyleTab.tsx` |
| REWRITE | `editor-v2/inspector/MotionTab.tsx` |
| MODIFY | `editor-v2/Inspector.tsx` (remove selectedBlockId gate, load settings) |
| MODIFY | `editor-v2/EditorShell.tsx` (trigger settings load) |
| MODIFY | `editor-v2/editing/SectionToolbar.tsx` (replace AnimationStub) |
