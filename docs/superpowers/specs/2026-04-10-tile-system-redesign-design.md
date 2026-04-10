# Tile System Redesign — Design Spec
**Date:** 2026-04-10  
**Project:** DreamySuite (pagebloom)  
**Status:** Approved, pending implementation

---

## Problem Statement

The tile/block editor has accumulated several interconnected issues:
- Layout displacement when native color pickers open inside a tile
- Preview requires multiple full iframe reloads to reflect changes
- Toggles feel broken because preview doesn't update until reload completes
- Countdown overlay on video block doesn't appear when toggled
- Countdown ticker script fails silently on empty/malformed dates
- RSVP button color and global accent color are disconnected
- Fun facts, schedule, Q&A, and travel blocks let users edit content inline in the tile instead of the Content tab
- Tile-to-tile inconsistency: different section layouts, heading styles, input styles, Save button placement varies

---

## Approach

**Option B — Live preview + tile refactor.** Build the postMessage live preview system and a shared tile section template simultaneously. Every tile gets the same header/section/footer anatomy. Fixes the root cause of all inconsistency while shipping bug fixes in one pass.

---

## Section 1 — postMessage Live Preview System

### Overview
Replace the current `previewKey` / full iframe remount approach with typed postMessage updates. Changes appear instantly in the preview with no page reload.

### Message Types

| Type | Payload | Renderer action |
|---|---|---|
| `block_config_update` | `{ blockId, config }` | Re-renders that block's DOM in-place via `applyConfig(node, cfg)` |
| `site_settings_update` | `{ delta }` | Updates CSS custom properties on `:root` instantly |
| `page_change` | `{ pageId }` | Already implemented — keep as-is |

### Renderer Changes (`$slug.tsx`)
- Add `window.addEventListener('message', handler)` on mount
- Each rendered block gets `data-block-id` attribute on its root element
- Per-block `applyConfig(node, cfg)` functions patch CSS variables, text content, visibility flags in-place
- For blocks needing full HTML re-render (schedule list, image grid): targeted `innerHTML` swap on the block container only
- `previewKey` / iframe remount retained as fallback for structural changes only (add/remove block, page navigation)

### Dashboard Changes (`_dashboard.sites.$id.tsx`)
- `setField(key, val)` fires `block_config_update` postMessage after updating local state — no delay
- Settings form changes fire `site_settings_update` postMessage on every input event
- Save button persists to API in the background; preview already reflects the change via postMessage

---

## Section 2 — Tile Component Standardization

### Standard Tile Anatomy

Every tile, without exception, follows this structure:

```
┌─────────────────────────────────────┐
│ [stripe] [icon] Block Name  [⚙ ×]  │  ← standard header
├─────────────────────────────────────┤
│ ⚠ No content yet — go to Content   │  ← empty-state banner (conditional)
├─────────────────────────────────────┤
│ LAYOUT                              │  ← section label: all-caps, muted
│  Alignment  [L] [C] [R]            │
│  Columns    [1][2][3][4]           │
│  Card style [Flat][Bordered][Raised]│
├─────────────────────────────────────┤
│ STYLE                               │
│  Title  [toggle — default ON]      │
│  Text color    [swatch ▾]          │
│  Background    [swatch ▾]          │
│  Border        [swatch ▾]          │
├─────────────────────────────────────┤
│ TYPOGRAPHY                          │
│  Font [dropdown]  Size [input]     │
├─────────────────────────────────────┤
│ ANIMATION                           │
│  [None][Fade][Slide][Zoom]         │
├─────────────────────────────────────┤
│ [BLOCK-SPECIFIC section if needed] │
├─────────────────────────────────────┤
│                        [Save  →]   │  ← always bottom-right
└─────────────────────────────────────┘
```

### Color Inputs
- All native `<input type="color">` replaced with a **custom swatch button**
- Clicking opens a small absolute-positioned popover: hex text input + preset swatches
- No browser native color dialog → no layout reflow, no displacement of surrounding elements
- Popover closes on outside click or Escape

### Save Button
- One Save button per tile, always at bottom-right
- On click: persists config to API AND fires `block_config_update` postMessage simultaneously
- Preview is already up to date (live via postMessage); Save is purely persistence

### RSVP Button Color
- In countdown block's block-specific section
- Three swatches: Background, Text, Border — each labeled **"overrides global accent"**
- A "Reset to global" link beside each swatch clears the override

### Block-Specific Sections

**Photo+Content block:**
- Photo library picker (selects from site photos library only, no upload)
- Width × Height inputs (px)
- Border radius, border width, border color swatches

**Images block:**
- Photo library picker (multi-select, from site photos library only)
- Width × Height inputs (px) — currently missing, adding parity with Photo+Content
- Layout grid selector (existing: grid/masonry/etc.)
- Border radius, border width, border color swatches

**Video/Hero block (when `showCountdown` is ON):**
- X offset (px, horizontal position of countdown overlay)
- Y offset (px, vertical position of countdown overlay)
- Stored as `countdownX` and `countdownY` in block config
- Applied as `--countdown-x` and `--countdown-y` CSS custom properties on the overlay container

**Schedule, Q&A, Fun Facts, Travel:**
- No block-specific section (all content editing lives in Content tab)
- Empty-state banner shown if no content rows exist for this block on this page

---

## Section 3 — Countdown System

### Fix 1 — Always use global wedding date
- Remove any date field from countdown block config
- Renderer reads `settings.eventDate` directly (already stored as ISO date in site settings)
- Single source of truth — no duplication or drift

### Fix 2 — Countdown ticker script
Current script fails silently when `eventDate` is empty or malformed. Fixed version:

```js
(function() {
  const raw = "{{eventDate}}T00:00:00"; // injected from settings at render time
  const target = new Date(raw);
  if (isNaN(target.getTime())) return; // guard: no date set
  
  const els = {
    days: document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    mins: document.getElementById('cd-mins'),
    secs: document.getElementById('cd-secs'),
  };
  
  function tick() {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) {
      Object.values(els).forEach(el => { if (el) el.textContent = '0'; });
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (els.days)  els.days.textContent  = d;
    if (els.hours) els.hours.textContent = h;
    if (els.mins)  els.mins.textContent  = m;
    if (els.secs)  els.secs.textContent  = s;
  }
  
  tick();
  setInterval(tick, 1000);
})();
```

- Countdown digit containers get stable `id` attributes (`cd-days`, `cd-hours`, `cd-mins`, `cd-secs`) in the rendered HTML
- "Today!" state: all digits show `0` when date is reached or passed

### Fix 3 — Countdown overlay on video block
- When `showCountdown` is enabled, countdown HTML is injected as `position: absolute` overlay inside the video container
- `countdownX` (px offset from horizontal center, default 0) and `countdownY` (px from bottom, default 120) are stored in block config
- Applied as `transform: translate(countdownX, -countdownY)` or equivalent CSS positioning
- Tile exposes X and Y number inputs in the block-specific section when `showCountdown` is ON

### Fix 4 — Toggle instant feedback
- `showCountdown` toggle fires `block_config_update` postMessage immediately on change
- Renderer `applyConfig` for video block shows/hides the overlay div in-place — no reload

---

## Section 4 — Content Separation

### Affected Blocks
Schedule, Q&A, Fun Facts, Travel

### Tile Panel (layout/style only)
- Standard tile anatomy as defined in Section 2
- Empty-state banner: **"No content yet — navigate to the Content tab to add items"** — shown when `site_content` has no rows for this block/page/lang
- No inline item editing, no Add button in the tile

### Content Tab Editors

Each block gets a dedicated editor in the Content tab:

| Block | Fields per row |
|---|---|
| Schedule | Name, date, time, location, description |
| Q&A | Question, answer |
| Fun Facts | Label, body |
| Travel | Heading, body, link label (optional), link URL (optional) |

Common UI pattern for all four:
- `+` button at bottom to add a new row
- Trash icon per row to delete
- Content stored in `site_content` table keyed by `(siteId, pageSlug, lang)`

### Data Migration
- On first save after deploy, if a block's `config` contains legacy inline items (`schedule.events`, `faq.questions`, etc.), those items are automatically written to `site_content` and removed from `config`
- Migration is idempotent — safe to run multiple times
- No data loss

### Add Button Location
- `+` button lives in the Content tab editor, not the tile
- Users can add as many sections/rows as they want from there

---

## Files Touched

| File | Changes |
|---|---|
| `app/routes/$slug.tsx` | postMessage listener, `data-block-id` attrs, `applyConfig` per block, countdown script fix, countdown overlay positioning |
| `app/routes/_dashboard.sites.$id.tsx` | Tile anatomy standardization, custom color swatch component, `setField` fires postMessage, Content tab editors for schedule/FAQ/tidbits/travel, data migration on save |

---

## Out of Scope
- Photo library upload (picker selects existing photos only)
- i18n for the new Content tab editors (existing lang toggle pattern applies)
- Any blocks not mentioned above
