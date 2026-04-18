# Plan: Effect System

Spec: `.planning/effect-system-spec.md`
Date: 2026-04-17
Branch: `feat/editor-overhaul` (continue) or `feat/effect-system` (new branch from current)

---

## Phase 1 — Foundation (data + infrastructure)

### Task 1. Install ReactBits package
- Files: `package.json`
- Depends on: none
- Complexity: low
- Acceptance: `npm ls react-bits` shows installed; `npx tsc --noEmit` passes

### Task 2. Types + registry data file
- Files: `src/lib/effects/types.ts`, `src/lib/effects/registry.ts`
- Depends on: none
- Complexity: high (130+ entries to catalog)
- Work:
  - Define `EffectEntry`, `EffectCategory`, `Mood`, `EventType` types in `types.ts`
  - Create `EFFECT_REGISTRY: EffectEntry[]` with all 130+ components, each tagged with category, mood[], eventTypes, intensity, description
  - Export lookup helpers: `getEffectsByCategory(cat)`, `getRecommended(cat, eventType)`, `getEffectById(id)`
- Acceptance: import from another file compiles; `getRecommended("background", "wedding")` returns Silk, SoftAurora, Threads, Iridescence; every entry has all required fields

### Task 3. Preset bundles data file
- Files: `src/lib/effects/presets.ts`
- Depends on: 2
- Complexity: medium
- Work:
  - Define `EffectPreset` type
  - Create 12-18 presets (2-3 per event type), each referencing effect IDs from the registry
  - Export `EFFECT_PRESETS`, `getPresetsForEventType(eventType)`
  - Presets: Romantic Silk (wedding), Ethereal Aurora (wedding), Classic Elegance (wedding/anniversary), Golden Nostalgia (anniversary), Intimate Glow (vow-renewal), Gentle Ceremony (vow-renewal), Party Spark (engagement), Modern Edge (engagement), Adventure Night (elopement), Cinematic Drift (elopement), Bold Celebration (celebration), Neon Energy (celebration), plus 4-6 universal ones
- Acceptance: `getPresetsForEventType("wedding")` returns 3+ presets; every preset's effect IDs exist in the registry

### Task 4. Dynamic import wrapper layer
- Files: `src/lib/effects/loader.ts`
- Depends on: 1, 2
- Complexity: medium
- Work:
  - Create `loadEffect(id: string): Promise<React.ComponentType<any>>` that dynamically imports the correct ReactBits/21st component
  - Map effect IDs to their import paths (e.g., `"silk"` -> `() => import("react-bits/backgrounds/Silk")`)
  - Return a placeholder/fallback if import fails
  - Export `EffectRenderer` wrapper component: takes `effectId` + `props`, handles suspense/loading
- Acceptance: `<EffectRenderer effectId="silk" />` renders the Silk component; unknown IDs render nothing; no static imports of ReactBits in the bundle

### Task 5. Settings schema + migration for active effects
- Files: `src/lib/schemas/settings.ts`, `migrations/0031_effect_settings.sql`, `src/app/[slug]/route.ts` (SiteSettingRow type)
- Depends on: 2
- Complexity: low
- Work:
  - Add to settings schema: `effectPreset` (string|null), `effectBg` (string|null), `effectNav` (string|null), `effectText` (string|null), `effectCard` (string|null), `effectTransition` (string|null), `effectCursor` (string|null), `effectDecoration` (string|null)
  - Migration: ALTER TABLE site_setting ADD COLUMN for each
  - Add fields to SiteSettingRow interface in public route
- Acceptance: migration file exists with all 8 columns; schema validates; tsc passes

---

## Phase 2 — Picker UI components

### Task 6. EffectPicker component (reusable)
- Files: `src/app/(dashboard)/sites/[id]/editor-v2/EffectPicker.tsx`
- Depends on: 2
- Complexity: medium
- Work:
  - Props: `category`, `value` (current effect ID or null), `onChange`, `eventType`
  - Layout: "Recommended" row (3-5 thumbnails from `getRecommended`), expandable "Browse all" grouped by mood, "None" button
  - Each thumbnail: effect name, mood badge, intensity dot
  - Selected state: ring highlight
  - Hover: show description tooltip
- Acceptance: renders recommended effects for the given category + event type; clicking an effect calls onChange with its ID; clicking "None" calls onChange(null); "Browse all" shows remaining effects grouped by mood

### Task 7. EffectPresetPicker component
- Files: `src/app/(dashboard)/sites/[id]/editor-v2/EffectPresetPicker.tsx`
- Depends on: 3, 6
- Complexity: medium
- Work:
  - Props: `eventType`, `activePresetId`, `onApply`
  - Shows recommended presets for event type as cards (thumbnail + name + mood + description)
  - "Browse all" shows full list grouped by mood
  - Clicking a preset calls onApply with the preset's full effects map
  - "Custom" badge if individual effects differ from any preset
- Acceptance: shows 3+ presets for a given event type; clicking one calls onApply with correct effect IDs; browse all shows remaining presets

### Task 8. Mobile performance guard
- Files: `src/lib/effects/performance.ts`
- Depends on: none
- Complexity: low
- Work:
  - `shouldEnableEffects()`: check `navigator.hardwareConcurrency`, `navigator.deviceMemory`, screen width, and `prefers-reduced-motion` media query
  - Returns `{ backgrounds: boolean, animations: boolean, cursor: boolean }`
  - Export `useEffectsEnabled()` hook that memoizes the result
- Acceptance: returns `{ backgrounds: false, animations: false, cursor: false }` when `prefers-reduced-motion: reduce` is set; returns all true on a desktop with 8+ cores

---

## Phase 3 — Editor integration

### Task 9. Effects tray (preset browser)
- Files: `src/app/(dashboard)/sites/[id]/editor-v2/trays/EffectsTray.tsx`, update `editorShell.ts` Section type, update sidebar to include Effects tray button
- Depends on: 5, 7
- Complexity: medium
- Work:
  - Add "effects" to Section union type
  - Create EffectsTray with EffectPresetPicker at top + per-category EffectPicker sections below
  - Reads/writes effect settings via updateSettings
  - Add sparkles/wand icon button to sidebar
- Acceptance: Effects tray opens from sidebar; selecting a preset writes all effect fields to settings; individual pickers override specific categories; tray reads current values from settings

### Task 10. Wire EffectPicker into StyleTab (background effects)
- Files: `src/app/(dashboard)/sites/[id]/editor-v2/inspector/StyleTab.tsx`
- Depends on: 5, 6
- Complexity: low
- Work:
  - Add EffectPicker with `category="background"` below the existing background image section
  - Reads `settings.effectBg`, writes via updateSettings
- Acceptance: background effect picker appears in StyleTab; selecting an effect writes `effectBg` to settings; "None" clears it

### Task 11. Wire EffectPicker into NavigationTray (nav effects)
- Files: `src/app/(dashboard)/sites/[id]/editor-v2/trays/NavigationTray.tsx`
- Depends on: 5, 6
- Complexity: low
- Work:
  - Add EffectPicker with `category="nav"` after the Material section
  - Reads `settings.effectNav`, writes via updateSettings
- Acceptance: nav effect picker appears in NavigationTray below Material; selecting an effect writes `effectNav`

### Task 12. Wire EffectPicker into SectionToolbar (text + card effects)
- Files: `src/app/(dashboard)/sites/[id]/editor-v2/editing/SectionToolbar.tsx`
- Depends on: 5, 6
- Complexity: medium
- Work:
  - Add EffectPicker for "text" and "card" categories in the block-level toolbar popover
  - These are per-block settings — store in block config, not site settings
  - Need to add `effectText` and `effectCard` fields to block config schema
- Acceptance: text/card effect pickers appear in section toolbar for applicable block types; selection persists in block config

---

## Phase 4 — Render effects in canvas + public site

### Task 13. Render background effects in editor canvas
- Files: `src/app/(dashboard)/sites/[id]/editor-v2/BreakpointFrame.tsx`
- Depends on: 4, 5
- Complexity: medium
- Work:
  - Read `settings.effectBg` from store
  - If set, render `<EffectRenderer effectId={effectBg} />` as a positioned layer behind content
  - Respect `useEffectsEnabled()` — skip if disabled
  - Layer behind NavPreview + EditorOverlay (z-index management)
- Acceptance: selecting a background effect in StyleTab shows the animated background in the canvas; deselecting removes it; performance guard disables it when appropriate

### Task 14. Render background effects on public site
- Files: `src/app/[slug]/route.ts`
- Depends on: 4, 5
- Complexity: high
- Work:
  - Public route is server-rendered HTML — cannot use React components directly
  - Option A: embed a small client-side script that mounts the ReactBits component into a container div
  - Option B: for CSS-only effects (glass, gradients), inline the CSS; for JS-heavy ones, inject a `<script>` tag
  - Add a `<div id="effect-bg"></div>` layer at the top of the page body
  - Inject a `<script type="module">` that dynamically imports and mounts the effect
  - Respect `prefers-reduced-motion` in the client script
- Acceptance: public site shows the selected background effect; `prefers-reduced-motion` disables it; no effect = no extra script/div injected

### Task 15. Render text/card effects in editor canvas
- Files: `src/app/(dashboard)/sites/[id]/editor-v2/Canvas.tsx` or `SiteRenderer` wrapper
- Depends on: 4, 12
- Complexity: medium
- Work:
  - Wrap block content with EffectRenderer when `effectText` or `effectCard` is set in block config
  - Text effects wrap the text content; card effects wrap the block container
- Acceptance: blocks with text/card effects show the animation in the canvas; blocks without them render normally

### Task 16. Render text/card effects on public site
- Files: `src/app/[slug]/route.ts`
- Depends on: 14 (same injection pattern)
- Complexity: high
- Work:
  - For each block with an effect, add a data attribute `data-effect-text` or `data-effect-card`
  - Client script finds elements with these attributes and mounts the appropriate effect wrapper
- Acceptance: blocks with effects animate on the public site; blocks without are unaffected

---

## Phase 5 — Install actual effect components (batched by category)

### Task 17. Install + verify background effects (14 components)
- Files: effect wrapper files per component
- Depends on: 4, 13
- Complexity: high (volume)
- Work:
  - Wire dynamic imports for: Silk, SoftAurora, Aurora, Iridescence, Particles, LiquidEther, LineWaves, Waves, Threads, FloatingLines, Galaxy, Beams, LightPillar, Grainient
  - Each needs: correct import path, default props, verified rendering in canvas
- Acceptance: each of the 14 background effects renders in the editor canvas when selected; no console errors; bundle size doesn't increase by more than 5KB per effect (dynamic imports)

### Task 18. Install + verify text animation effects (8 components)
- Files: effect wrapper files per component
- Depends on: 4, 15
- Complexity: high (volume)
- Work:
  - Wire: BlurText, SplitText, GradientText, ShinyText, ScrollReveal, RotatingText, TextType, CountUp
  - Each wraps text content and animates it
- Acceptance: each text effect animates text in the editor canvas; scroll-based ones work in the preview

### Task 19. Install + verify card/UI effects (6 components)
- Files: effect wrapper files per component
- Depends on: 4, 15
- Complexity: medium
- Work:
  - Wire: GlassSurface, SpotlightCard, TiltedCard, BounceCards, ProfileCard, MagicBento
  - Each wraps a block container
- Acceptance: each card effect applies to blocks in the editor canvas

### Task 20. Install + verify transition effects (4 components)
- Files: effect wrapper files per component
- Depends on: 4
- Complexity: low
- Work:
  - Wire: AnimatedContent, FadeContent, GradualBlur, PixelTransition
  - Section entrance animations triggered on scroll into view
- Acceptance: blocks with transition effects animate on scroll in the editor canvas

### Task 21. Install + verify decoration + cursor effects (6 components)
- Files: effect wrapper files per component
- Depends on: 4
- Complexity: low
- Work:
  - Wire: StarBorder, Ribbons, ClickSpark, BlobCursor, ImageTrail, Magnet
  - Decorations attach to elements; cursors are site-wide
- Acceptance: decoration effects render on target elements; cursor effects change the site cursor

---

## Phase 6 — Polish + remaining components

### Task 22. Generate preview thumbnails for all effects
- Files: `public/effects/thumbnails/` directory
- Depends on: 17-21
- Complexity: medium (repetitive)
- Work:
  - Screenshot or record 3-second loops of each effect
  - Save as WebP thumbnails at 200x150px
  - Update registry entries with thumbnail paths
- Acceptance: every effect in the registry has a thumbnail; EffectPicker shows thumbnails

### Task 23. Install remaining background effects (batch 2 — 28 components)
- Files: effect wrapper files
- Depends on: 17
- Complexity: high (volume)
- Work: Ballpit, Beams, ColorBends, DarkVeil, Dither, DotField, FloatingLines, GradientBlinds, GridDistortion, GridMotion, Hyperspeed, LetterGlitch, LightRays, Lightning, LiquidChrome, Orb, Particles, PixelBlast, PixelSnow, Plasma, PlasmaWave, Prism, PrismaticBurst, RippleGrid, ShapeGrid, Silk
- Acceptance: all render correctly in canvas

### Task 24. Install remaining text effects (batch 2 — 15 components)
- Files: effect wrapper files
- Depends on: 18
- Complexity: high (volume)
- Work: ASCIIText, CircularText, CurvedLoop, DecryptedText, FallingText, FuzzyText, GlitchText, ScrambledText, ScrollFloat, ScrollVelocity, Shuffle, TextCursor, TextPressure, TrueFocus, VariableProximity
- Acceptance: all render correctly wrapping text

### Task 25. Install remaining UI + interaction effects (batch 2 — ~20 components)
- Files: effect wrapper files
- Depends on: 19, 20, 21
- Complexity: high (volume)
- Work: AnimatedList, BorderGlow, CardSwap, Carousel, CircularGallery, Dock, ElasticSlider, FlowingMenu, FluidGlass, FlyingPosters, GooeyNav, Lanyard, Masonry, ReflectiveCard, ScrollStack, Stack, Stepper, StickerPeel, etc.
- Acceptance: all render correctly in their respective contexts

---

## Summary

| # | Task | Depends on | Complexity | Phase |
|---|------|-----------|------------|-------|
| 1 | Install ReactBits package | none | low | 1 |
| 2 | Types + registry data file (130+ entries) | none | high | 1 |
| 3 | Preset bundles (12-18 presets) | 2 | medium | 1 |
| 4 | Dynamic import wrapper layer | 1, 2 | medium | 1 |
| 5 | Settings schema + migration | 2 | low | 1 |
| 6 | EffectPicker component | 2 | medium | 2 |
| 7 | EffectPresetPicker component | 3, 6 | medium | 2 |
| 8 | Mobile performance guard | none | low | 2 |
| 9 | Effects tray (sidebar) | 5, 7 | medium | 3 |
| 10 | Wire into StyleTab (bg) | 5, 6 | low | 3 |
| 11 | Wire into NavigationTray (nav) | 5, 6 | low | 3 |
| 12 | Wire into SectionToolbar (text/card) | 5, 6 | medium | 3 |
| 13 | Render bg effects in canvas | 4, 5 | medium | 4 |
| 14 | Render bg effects on public site | 4, 5 | high | 4 |
| 15 | Render text/card effects in canvas | 4, 12 | medium | 4 |
| 16 | Render text/card effects on public site | 14 | high | 4 |
| 17 | Install bg effects batch 1 (14) | 4, 13 | high | 5 |
| 18 | Install text effects batch 1 (8) | 4, 15 | high | 5 |
| 19 | Install card/UI effects (6) | 4, 15 | medium | 5 |
| 20 | Install transition effects (4) | 4 | low | 5 |
| 21 | Install decoration + cursor effects (6) | 4 | low | 5 |
| 22 | Generate preview thumbnails | 17-21 | medium | 6 |
| 23 | Install bg effects batch 2 (28) | 17 | high | 6 |
| 24 | Install text effects batch 2 (15) | 18 | high | 6 |
| 25 | Install UI/interaction batch 2 (~20) | 19-21 | high | 6 |

## Parallel opportunities
- Tasks 1, 2, 8 can all run in parallel (no dependencies)
- Tasks 10, 11, 12 can run in parallel (all depend on 5 + 6)
- Tasks 17, 18, 19, 20, 21 can run in parallel (all depend on 4 + their canvas renderer)
- Tasks 23, 24, 25 can run in parallel (batch 2 installs)

## Estimated scope
- **Phase 1** (foundation): ~1 session — registry is the big lift
- **Phase 2** (picker UI): ~1 session
- **Phase 3** (editor wiring): ~0.5 session
- **Phase 4** (rendering): ~1-2 sessions — public site injection is the tricky part
- **Phase 5** (batch 1 installs): ~1-2 sessions
- **Phase 6** (polish + batch 2): ~2-3 sessions
- **Total**: ~7-10 sessions
