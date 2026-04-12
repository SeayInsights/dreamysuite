# Editor Token Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every hardcoded teal value (`#0d9488`, `#0f766e`, `#f0fdfa`, `rgba(13,148,136,…)`) in the editor CSS and dashboard JSX with the gold design tokens already defined in `site-editor.css`, so the full editor experience — topbar, tile panel, block cards, tabs, guest list, site setup, analytics — matches the redesigned sidebar.

**Architecture:** The root variables in `site-editor.css` were already updated to gold (`--accent: #B8921A`, `--accent-hover: #9A780E`, `--accent-light: #FDF6E0`, `--accent-ring: rgba(184,146,26,0.18)`) but 28 rules in the CSS still hardcode teal, and 66 inline-style occurrences in the dashboard TSX also hardcode teal. This is a pure token-swap — no markup changes, no new features.

**Tech Stack:** CSS custom properties, React inline styles, TypeScript. No new dependencies.

---

## File Map

| File | What changes |
|---|---|
| `app/styles/site-editor.css` | Replace 28 hardcoded teal values with CSS variables |
| `app/routes/_dashboard.sites.$id.tsx` | Replace 66 inline-style teal values with CSS variable strings |

---

## Task 1 — Fix site-editor.css: teal → CSS variables

**Files:**
- Modify: `app/styles/site-editor.css`

Every hardcoded teal value in this file should use one of the four existing variables:

| Hardcoded value | Replace with |
|---|---|
| `#0d9488` | `var(--accent)` |
| `#0f766e` | `var(--accent-hover)` |
| `#f0fdfa` | `var(--accent-light)` |
| `rgba(13,148,136,0.07)` | `rgba(184,146,26,0.07)` → use `var(--accent-ring)` |
| `rgba(13,148,136,0.1)` | `var(--accent-ring)` |
| `rgba(13,148,136,0.12)` | `var(--accent-ring)` |
| `rgba(13,148,136,0.25)` | `rgba(184,146,26,0.25)` |
| `rgba(13,148,136,0.3)` | `rgba(184,146,26,0.3)` |

- [ ] **Step 1: Replace `.btn-primary-sm` background**

Find:
```css
.btn-primary-sm { background:#0d9488; color:#fff; border:none; padding:8px 18px; font-size:0.8rem; font-weight:500; letter-spacing:0.01em; cursor:pointer; border-radius:8px; white-space:nowrap; transition:background 0.15s, transform 0.15s, box-shadow 0.15s; }
.btn-primary-sm:hover:not(:disabled) { background:var(--accent-hover); box-shadow:0 3px 10px rgba(13,148,136,0.25); }
```
Replace with:
```css
.btn-primary-sm { background:var(--accent); color:#fff; border:none; padding:8px 18px; font-size:0.8rem; font-weight:500; letter-spacing:0.01em; cursor:pointer; border-radius:8px; white-space:nowrap; transition:background 0.15s, transform 0.15s, box-shadow 0.15s; }
.btn-primary-sm:hover:not(:disabled) { background:var(--accent-hover); box-shadow:0 3px 10px rgba(184,146,26,0.25); }
```

- [ ] **Step 2: Replace `.btn-publish`**

Find:
```css
.btn-publish { background: #0d9488; color: #fff; border: none; padding: 7px 20px; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.02em; cursor: pointer; border-radius: 8px; white-space: nowrap; transition: background 0.15s, box-shadow 0.15s, transform 0.1s; }
.btn-publish:hover:not(:disabled) { background: #0f766e; box-shadow: 0 3px 12px rgba(13,148,136,0.3); transform: translateY(-1px); }
```
Replace with:
```css
.btn-publish { background: var(--accent); color: #fff; border: none; padding: 7px 20px; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.02em; cursor: pointer; border-radius: 8px; white-space: nowrap; transition: background 0.15s, box-shadow 0.15s, transform 0.1s; }
.btn-publish:hover:not(:disabled) { background: var(--accent-hover); box-shadow: 0 3px 12px rgba(184,146,26,0.3); transform: translateY(-1px); }
```

- [ ] **Step 3: Replace block card active + drag states**

Find:
```css
.bl-drag-ghost { opacity:0.45; background:#f0fdfa !important; border:1.5px dashed #0d9488 !important; }
.bl-card.active { border-color:#0d9488; box-shadow:0 0 0 3px rgba(13,148,136,0.07); background:#f0fdfa; }
```
Replace with:
```css
.bl-drag-ghost { opacity:0.45; background:var(--accent-light) !important; border:1.5px dashed var(--accent) !important; }
.bl-card.active { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-ring); background:var(--accent-light); }
```

- [ ] **Step 4: Replace `.bl-sortable-ghost`**

Find:
```css
.bl-sortable-ghost { opacity:0.3; border-color:#0d9488 !important; background:#f0fdfa !important; }
```
Replace with:
```css
.bl-sortable-ghost { opacity:0.3; border-color:var(--accent) !important; background:var(--accent-light) !important; }
```

- [ ] **Step 5: Replace add-block and block-type-tile hover states**

Find:
```css
.add-block-btn:hover { border-color:#0d9488; color:#0d9488; background:#f0fdfa; }
.block-type-tile:hover { border-color:#0d9488; background:#f0fdfa; }
```
Replace with:
```css
.add-block-btn:hover { border-color:var(--accent); color:var(--accent); background:var(--accent-light); }
.block-type-tile:hover { border-color:var(--accent); background:var(--accent-light); }
```

- [ ] **Step 6: Replace page selector and page-row active states**

Find:
```css
.page-selector-btn.open { border-color:var(--accent); box-shadow:0 2px 8px rgba(13,148,136,0.12); }
.page-sel-row.active { background:#f0fdfa; color:#0d9488; font-weight:500; }
.page-row.active { border-color:#0d9488; background:#f0fdfa; }
.page-row-icon { width:34px; height:34px; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:#0d9488; }
.page-row:hover .page-row-chevron { color:#0d9488; }
```
Replace with:
```css
.page-selector-btn.open { border-color:var(--accent); box-shadow:0 2px 8px var(--accent-ring); }
.page-sel-row.active { background:var(--accent-light); color:var(--accent); font-weight:500; }
.page-row.active { border-color:var(--accent); background:var(--accent-light); }
.page-row-icon { width:34px; height:34px; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; background:var(--accent); }
.page-row:hover .page-row-chevron { color:var(--accent); }
```

- [ ] **Step 7: Replace checkbox toggle, upload zone, library hover**

Find:
```css
.style-toggle input[type="checkbox"]:checked { background:#0d9488; }
.upload-zone:hover { border-color:#0d9488; background:#f0fdfa; }
.lib-item:hover { border-color:#0d9488; }
```
Replace with:
```css
.style-toggle input[type="checkbox"]:checked { background:var(--accent); }
.upload-zone:hover { border-color:var(--accent); background:var(--accent-light); }
.lib-item:hover { border-color:var(--accent); }
```

- [ ] **Step 8: Replace guest list add button**

Find:
```css
.gl-add-btn { background:#0d9488; border-color:#0d9488; color:#fff; font-weight:600; }
.gl-add-btn:hover:not(:disabled) { background:#0f766e; border-color:#0f766e; }
```
Replace with:
```css
.gl-add-btn { background:var(--accent); border-color:var(--accent); color:#fff; font-weight:600; }
.gl-add-btn:hover:not(:disabled) { background:var(--accent-hover); border-color:var(--accent-hover); }
```

- [ ] **Step 9: Replace analytics views count color**

Find:
```css
.analytics-views-count { text-align:right; font-weight:600; color:#0d9488; }
```
Replace with:
```css
.analytics-views-count { text-align:right; font-weight:600; color:var(--accent); }
```

- [ ] **Step 10: Replace site setup type card active state**

Find:
```css
.setup-type-card.active { border-color:#0d9488; background:#f0fdfa; box-shadow:0 0 0 3px rgba(13,148,136,0.08); }
.setup-type-card.active .setup-type-name { color:#0d9488; font-weight:600; }
```
Replace with:
```css
.setup-type-card.active { border-color:var(--accent); background:var(--accent-light); box-shadow:0 0 0 3px var(--accent-ring); }
.setup-type-card.active .setup-type-name { color:var(--accent); font-weight:600; }
```

- [ ] **Step 11: Replace hub-tile hover, hub-view-site, layout-tile, clr-pill, bsel-btn**

Find:
```css
.hub-tile:hover { border-color:var(--accent); background:var(--accent-light); box-shadow:0 4px 14px rgba(13,148,136,0.1); }
.hub-view-site:hover { color:#0d9488; }
.layout-tile.active { border-color:#0d9488; background:#f0fdfa; }
.clr-pill.active { border-color:#0d9488; color:#0d9488; background:#f0fdfa; font-weight:600; }
.bsel-btn.active { border-color:#0d9488; background:#f0fdfa; color:#0d9488; font-weight:600; }
```
Replace with:
```css
.hub-tile:hover { border-color:var(--accent); background:var(--accent-light); box-shadow:0 4px 14px var(--accent-ring); }
.hub-view-site:hover { color:var(--accent); }
.layout-tile.active { border-color:var(--accent); background:var(--accent-light); }
.clr-pill.active { border-color:var(--accent); color:var(--accent); background:var(--accent-light); font-weight:600; }
.bsel-btn.active { border-color:var(--accent); background:var(--accent-light); color:var(--accent); font-weight:600; }
```

- [ ] **Step 12: Verify no teal remains**

```bash
grep -n "#0d9488\|#0f766e\|#f0fdfa\|rgba(13,148" app/styles/site-editor.css
```
Expected: no output (zero matches).

- [ ] **Step 13: Commit**

```bash
git add app/styles/site-editor.css
git commit -m "fix: replace hardcoded teal with CSS variables in site-editor.css"
```

---

## Task 2 — Fix inline styles in _dashboard.sites.$id.tsx

**Files:**
- Modify: `app/routes/_dashboard.sites.$id.tsx`

There are 66 occurrences of inline-style teal in the JSX. These are all `style={{ ... }}` props. The mapping is the same:

| Inline value | Replace with |
|---|---|
| `'#0d9488'` | `'var(--accent)'` |
| `'#0f766e'` | `'var(--accent-hover)'` |
| `'#f0fdfa'` | `'var(--accent-light)'` |
| `'#ccfbf1'` | `'var(--accent-light)'` |
| `rgba(13,148,136,…)` | `'var(--accent-ring)'` or `'rgba(184,146,26,…)'` |

The two hotspots are `TextStyleRow` (active button toggle states) and scattered active/selected indicators throughout settings panels.

- [ ] **Step 1: Fix TextStyleRow active button colors**

Find the `TextStyleRow` function (~line 1821). It has two button arrays with hardcoded teal for active state. Replace:

```tsx
// Alignment buttons (L/C/R):
borderColor: c[ak]===a ? '#0d9488' : '#e0dbd4',
background:  c[ak]===a ? '#0d9488' : '#fff',
color:       c[ak]===a ? '#fff'    : '#6b5e56',
```
With:
```tsx
borderColor: c[ak]===a ? 'var(--accent)' : '#e0dbd4',
background:  c[ak]===a ? 'var(--accent)' : '#fff',
color:       c[ak]===a ? '#fff'           : '#6b5e56',
```

And the B/I/U format buttons:
```tsx
// Before:
borderColor: c[key] ? '#0d9488' : '#e0dbd4',
background:  c[key] ? '#0d9488' : '#fff',
color:       c[key] ? '#fff'    : '#6b5e56',
// After:
borderColor: c[key] ? 'var(--accent)' : '#e0dbd4',
background:  c[key] ? 'var(--accent)' : '#fff',
color:       c[key] ? '#fff'           : '#6b5e56',
```

- [ ] **Step 2: Global replace remaining teal inline values**

Run a targeted replace for all remaining inline-style teal strings. In VS Code or with sed, replace all occurrences of these exact string values **only inside `style={{...}}` props** (safe to do globally since these values don't appear in other contexts in this file):

```bash
# Verify counts before replacing:
grep -c "'#0d9488'" app/routes/_dashboard.sites.\$id.tsx
grep -c '"#0d9488"' app/routes/_dashboard.sites.\$id.tsx
```

Then make the following string replacements (replace_all):

| Find | Replace |
|---|---|
| `'#0d9488'` | `'var(--accent)'` |
| `"#0d9488"` | `"var(--accent)"` |
| `'#0f766e'` | `'var(--accent-hover)'` |
| `"#0f766e"` | `"var(--accent-hover)"` |
| `'#f0fdfa'` | `'var(--accent-light)'` |
| `"#f0fdfa"` | `"var(--accent-light)"` |
| `'#ccfbf1'` | `'var(--accent-light)'` |
| `background: "#0d9488"` | `background: "var(--accent)"` |

- [ ] **Step 3: Verify no teal inline styles remain**

```bash
grep -n "#0d9488\|#0f766e\|#f0fdfa\|#ccfbf1\|rgba(13,148" app/routes/_dashboard.sites.\$id.tsx
```
Expected: zero matches.

- [ ] **Step 4: TypeScript check**

```bash
cd "C:/Users/Dannis Seay/studio/builds/dreamysuite"
npx tsc --noEmit 2>&1
```
Expected: same 4 pre-existing errors only (lines 2157, 2369, 4288 in `_dashboard.sites.$id.tsx` and line 28 in `api.canva.connect.ts`). No new errors.

- [ ] **Step 5: Smoke test in browser**

```bash
npx react-router dev --port 5173
```

Open `http://localhost:5173` and log in. Check each section:
- **Website tab** — topbar Save Layout button = gold. Active tile card border = gold. "+ Add Tile" hover = gold. Page selector open state = gold. Undo/redo, Settings, Preview, Template buttons = same neutral ghost style.
- **Guest List tab** — "Add Guest" button = gold.
- **Media tab** — upload zone hover border = gold. Library item hover = gold.
- **Templates tab** — no teal visible.
- **Site Setup tab** — Event type card selected state = gold border/bg. Analytics views count = gold.
- **Analytics tab** — page view counts = gold.

- [ ] **Step 6: Commit and push**

```bash
git add app/routes/_dashboard.sites.\$id.tsx
git commit -m "fix: replace hardcoded teal with CSS variables in dashboard inline styles"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ Editor topbar (Save Layout, Publish buttons) — Task 1 Steps 1–2
- ✅ Tile panel (block card active, drag ghost, sortable ghost) — Task 1 Steps 3–4
- ✅ Add Tile button hover — Task 1 Step 5
- ✅ Page selector / page row active states — Task 1 Step 6
- ✅ Checkbox toggles, upload zone, library — Task 1 Step 7
- ✅ Guest List add button — Task 1 Step 8
- ✅ Analytics count — Task 1 Step 9
- ✅ Site Setup type cards — Task 1 Step 10
- ✅ Hub tiles, clr-pill, bsel-btn, layout-tile — Task 1 Step 11
- ✅ TextStyleRow B/I/U toggles — Task 2 Step 1
- ✅ All remaining inline teal — Task 2 Step 2

**No placeholders:** All steps have exact find/replace strings.

**Type consistency:** No type changes — only string value swaps in style props and CSS rules.
