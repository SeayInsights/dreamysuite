# Tile System Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace full-iframe-reload preview with typed postMessage live updates, fix countdown bugs, and separate layout/style editing from content editing for Schedule, Q&A, Fun Facts, and Travel blocks.

**Architecture:** Dashboard sends `block_config_update` / `site_settings_update` postMessages to the preview iframe on every field change; the renderer applies deltas in-place. Content data for four blocks moves from block `config` JSON into the `site_content` table keyed by `(siteId, pageSlug, lang)`. A legacy migration runs on first save after deploy.

**Tech Stack:** React Router v7, Cloudflare Workers + D1, SortableJS (already imported via `import Sortable from "sortablejs"`), TypeScript. No new npm dependencies required.

---

## File Map

| File | Changes |
|---|---|
| `app/routes/$slug.tsx` | Countdown ticker rewrite; video overlay; `data-block-id` on all block roots; postMessage listener script; 4 content-block renderers read from `pageContent` |
| `app/routes/_dashboard.sites.$id.tsx` | `iframeRef` + `setField` postMessage; `ColorSwatch` component; countdown tile cleanup; video X/Y inputs; tidbits/travel content tab editors; remove inline editing from 4 tiles; legacy migration on save |

---

## Task 1 — Fix Countdown Ticker Script

**Files:**
- Modify: `app/routes/$slug.tsx` — `renderBlock` case `"countdown"`, `buildCountdownScript()`

Rewrite the ticker to use `isNaN` guard, stable per-block element IDs (`cd-days-{id}`, `cd-hours-{id}`, `cd-mins-{id}`, `cd-secs-{id}`), and a `data-cd-clock` + `data-date` + `data-block-id` container pattern. The block always reads `settings.eventDate` (already the case in the renderer — `cfg.date` is ignored here).

- [ ] **Step 1: Replace the countdown block renderer HTML**

In `renderBlock` at the `case "countdown":` block (~line 916), replace the entire case body:

```typescript
case "countdown": {
  const targetDate = settings?.eventDate ?? "";
  const label = (cfg.label as string | undefined) ?? "Until we say I do";
  const showRsvp = !!cfg.showRsvpButton;
  const rsvpText = escHtml(String(cfg.rsvpButtonText ?? "RSVP Now"));
  const rsvpBg = escHtml(String(cfg.rsvpButtonColor ?? accent));
  const rsvpFg = escHtml(String(cfg.rsvpButtonTextColor ?? "#fff"));
  const rsvpBorder = cfg.rsvpButtonBorderColor
    ? `border:2px solid ${escHtml(String(cfg.rsvpButtonBorderColor))};` : "";
  return `
    <section class="block block-countdown" aria-label="Countdown" data-block-id="${escHtml(block.id)}" data-block-type="countdown">
      <p class="countdown-label">${escHtml(label)}</p>
      ${targetDate
        ? `<div class="countdown-units" data-cd-clock data-date="${escHtml(targetDate)}" data-block-id="${escHtml(block.id)}">
             <div class="countdown-unit"><span class="countdown-num" id="cd-days-${escHtml(block.id)}">--</span><span class="countdown-unit-label">Days</span></div>
             <div class="countdown-unit"><span class="countdown-num" id="cd-hours-${escHtml(block.id)}">--</span><span class="countdown-unit-label">Hours</span></div>
             <div class="countdown-unit"><span class="countdown-num" id="cd-mins-${escHtml(block.id)}">--</span><span class="countdown-unit-label">Minutes</span></div>
             <div class="countdown-unit"><span class="countdown-num" id="cd-secs-${escHtml(block.id)}">--</span><span class="countdown-unit-label">Seconds</span></div>
           </div>`
        : placeholder("Set an event date in Site Settings to show the countdown.")
      }
      ${showRsvp
        ? `<div style="text-align:center;margin-top:2rem"><a href="#rsvp" class="rsvp-submit" style="background:${rsvpBg};color:${rsvpFg};${rsvpBorder}text-decoration:none;display:inline-block">${rsvpText}</a></div>`
        : ""}
    </section>`;
}
```

- [ ] **Step 2: Replace `buildCountdownScript()`**

Find `function buildCountdownScript()` (~line 1260) and replace its entire body:

```typescript
function buildCountdownScript(): string {
  return `<script>
(function(){
  document.querySelectorAll('[data-cd-clock]').forEach(function(container){
    var raw = container.getAttribute('data-date');
    if (!raw) return;
    var target = new Date(raw + 'T00:00:00');
    if (isNaN(target.getTime())) return;
    var bid = container.getAttribute('data-block-id') || '';
    var els = {
      days:  document.getElementById('cd-days-'  + bid),
      hours: document.getElementById('cd-hours-' + bid),
      mins:  document.getElementById('cd-mins-'  + bid),
      secs:  document.getElementById('cd-secs-'  + bid),
    };
    function tick() {
      var diff = target.getTime() - Date.now();
      if (diff <= 0) {
        ['days','hours','mins','secs'].forEach(function(k){ if(els[k]) els[k].textContent='0'; });
        return;
      }
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      if (els.days)  els.days.textContent  = String(d);
      if (els.hours) els.hours.textContent = String(h);
      if (els.mins)  els.mins.textContent  = String(m);
      if (els.secs)  els.secs.textContent  = String(s);
    }
    tick();
    setInterval(tick, 1000);
  });
})();
</script>`;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "C:/Users/Dannis Seay/studio/pagebloom"
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Smoke test in browser**

Start dev: `npx wrangler dev`. Open a site with an event date set. Verify the countdown ticks every second. Open browser console — no JS errors. Verify "0" is shown for all digits when event date is in the past.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/Dannis Seay/studio/pagebloom"
git add app/routes/'$slug.tsx'
git commit -m "fix: countdown ticker -- isNaN guard, stable per-block IDs, always uses eventDate"
```

---

## Task 2 — Countdown Overlay on Video Block

**Files:**
- Modify: `app/routes/$slug.tsx` — `renderBlock` case `"video"`, CSS section

When `cfg.showCountdown` is `true` on a video block, inject a positioned overlay containing a countdown clock. The ticker script from Task 1 already handles any element with `data-cd-clock`, so no script changes needed.

- [ ] **Step 1: Add overlay CSS**

Search for `.block-countdown {` (~line 526) in the CSS section of `$slug.tsx`. Add after the existing countdown CSS rules:

```css
.video-cd-overlay { position:absolute; bottom:120px; left:50%; transform:translateX(var(--cd-x,0px)) translateY(0); z-index:10; text-align:center; color:#fff; pointer-events:none; }
.video-cd-overlay .countdown-units { justify-content:center; }
.video-cd-overlay .countdown-num { color:#fff; }
.video-cd-overlay .countdown-unit-label { color:rgba(255,255,255,0.75); }
```

The overlay's position is driven by `--cd-x` and bottom value from `countdownY`.

- [ ] **Step 2: Replace `renderBlock` case `"video"` with overlay support**

Find `case "video":` (~line 1058) and replace the entire case body:

```typescript
case "video": {
  const url = cfg.url as string | undefined;
  const vimeoId = cfg.vimeoId as string | undefined;
  const height = (cfg.height as string | undefined) ?? "100dvh";
  const showCountdown = !!cfg.showCountdown;
  const cdX = Number(cfg.countdownX ?? 0);
  const cdY = Number(cfg.countdownY ?? 120);
  const targetDate = settings?.eventDate ?? "";

  const overlayHtml = showCountdown && targetDate
    ? `<div class="video-cd-overlay" style="bottom:${cdY}px;transform:translateX(${cdX}px);" data-cd-clock data-date="${escHtml(targetDate)}" data-block-id="${escHtml(block.id)}-overlay">
         <div class="countdown-units">
           <div class="countdown-unit"><span class="countdown-num" id="cd-days-${escHtml(block.id)}-overlay">--</span><span class="countdown-unit-label">Days</span></div>
           <div class="countdown-unit"><span class="countdown-num" id="cd-hours-${escHtml(block.id)}-overlay">--</span><span class="countdown-unit-label">Hours</span></div>
           <div class="countdown-unit"><span class="countdown-num" id="cd-mins-${escHtml(block.id)}-overlay">--</span><span class="countdown-unit-label">Minutes</span></div>
           <div class="countdown-unit"><span class="countdown-num" id="cd-secs-${escHtml(block.id)}-overlay">--</span><span class="countdown-unit-label">Seconds</span></div>
         </div>
       </div>`
    : "";

  if (vimeoId) {
    return `
      <section class="block block-video" aria-label="Video" data-block-id="${escHtml(block.id)}" data-block-type="video"
        style="position:relative;width:100%;height:${escHtml(height)};overflow:hidden;background:#000;">
        <iframe
          src="https://player.vimeo.com/video/${escHtml(vimeoId)}?autoplay=1&muted=1&loop=1&background=1"
          style="position:absolute;top:50%;left:50%;width:177.78vh;min-width:100%;min-height:100%;height:56.25vw;transform:translate(-50%,-50%);border:0;"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
          title="Wedding video"
        ></iframe>
        ${overlayHtml}
      </section>`;
  }
  return `
    <section class="block block-video" aria-label="Video" data-block-id="${escHtml(block.id)}" data-block-type="video">
      ${url ? `<video src="${escHtml(url)}" controls class="media-element" aria-label="Wedding video"></video>` : mediaPlaceholder("Video")}
      ${overlayHtml}
    </section>`;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Browser test**

Open a site in the dashboard. On a page with a video/hero block, toggle "Show countdown clock" ON. Reload the preview iframe. Verify the countdown digits appear over the video. Verify the ticker ticks.

- [ ] **Step 5: Commit**

```bash
git add app/routes/'$slug.tsx'
git commit -m "feat: countdown overlay on video block with X/Y positioning"
```

---

## Task 3 — postMessage Listener in Renderer

**Files:**
- Modify: `app/routes/$slug.tsx` — add `data-block-id`/`data-block-type` to all block roots; add `buildMessageListenerScript()`; call it in `buildHtml()`

The listener responds to two message types from the parent dashboard:
- `block_config_update` — applies config changes to a single block in-place
- `site_settings_update` — patches CSS custom properties on `:root`

- [ ] **Step 1: Add `data-block-id` and `data-block-type` to remaining block roots**

The video and countdown cases already have these from Tasks 1–2. Now add them to the remaining cases. For each `return \`<section class="block block-XXX"` in `renderBlock`, add `data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}"`:

Cases to update (search for `<section class="block block-`):
- `home-hero` / `couple` — add to `block-home-hero`
- `header` — add to `block-header`
- `text` — add to `block-text`
- `schedule` — add to `block-schedule`
- `faq` — add to `block-faq`
- `tidbits` — add to `block-tidbits`
- `travel-section` — add to `block-travel`
- `images` — add to `block-images`
- `photo-split` — add to `block-photo-split`
- Other blocks — add where applicable

Example pattern for each:
```typescript
// Before:
return `<section class="block block-text" aria-label="...">`;
// After:
return `<section class="block block-text" aria-label="..." data-block-id="${escHtml(block.id)}" data-block-type="text">`;
```

- [ ] **Step 2: Add `buildMessageListenerScript()` function**

Add this function immediately after `buildCountdownScript()`:

```typescript
function buildMessageListenerScript(): string {
  return `<script>
(function(){
  function applySiteSettings(delta) {
    var root = document.documentElement;
    var map = {
      accentColor: '--accent',
      bgColor: '--bg',
      headingColor: '--heading-color',
      bodyColor: '--body-color',
      siteTextColor: '--text',
      siteBorderColor: '--border',
      navBg: '--nav-bg',
      navBrandColor: '--nav-brand',
      navLinkColor: '--nav-link',
      navHighlightColor: '--nav-highlight',
    };
    Object.keys(delta).forEach(function(k) {
      if (map[k]) root.style.setProperty(map[k], String(delta[k]));
    });
  }

  function applyBlockConfig(blockId, cfg) {
    var node = document.querySelector('[data-block-id="' + blockId + '"]');
    if (!node) return;
    var type = node.getAttribute('data-block-type');

    if (type === 'countdown') {
      var labelEl = node.querySelector('.countdown-label');
      if (labelEl && cfg.label != null) labelEl.textContent = String(cfg.label);
      var rsvpWrap = node.querySelector('.rsvp-submit')?.parentElement;
      if (rsvpWrap) rsvpWrap.style.display = cfg.showRsvpButton ? '' : 'none';
    }

    if (type === 'video') {
      // show/hide countdown overlay
      var overlay = node.querySelector('.video-cd-overlay');
      if (overlay) overlay.style.display = cfg.showCountdown ? '' : 'none';
      // update overlay position
      if (overlay && cfg.countdownX != null) overlay.style.transform = 'translateX(' + cfg.countdownX + 'px)';
      if (overlay && cfg.countdownY != null) overlay.style.bottom = cfg.countdownY + 'px';
      // update block height
      if (cfg.height) node.style.height = cfg.height;
    }

    if (type === 'text') {
      var heading = node.querySelector('.section-heading');
      if (heading && cfg.heading != null) heading.textContent = String(cfg.heading);
      var body = node.querySelector('.text-body p');
      if (body && cfg.body != null) body.textContent = String(cfg.body);
    }

    // Generic: background / text color
    if (cfg.background && cfg.background.type === 'color') {
      node.style.setProperty('--block-bg', cfg.background.value || '');
    } else if (cfg.background === null) {
      node.style.removeProperty('--block-bg');
    }
    if (cfg.textColor) {
      node.style.setProperty('--block-text', cfg.textColor);
    } else if (cfg.textColor === null) {
      node.style.removeProperty('--block-text');
    }
  }

  window.addEventListener('message', function(event) {
    var d = event.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'block_config_update') {
      applyBlockConfig(String(d.blockId), d.config || {});
    } else if (d.type === 'site_settings_update') {
      applySiteSettings(d.delta || {});
    }
  });
})();
</script>`;
}
```

- [ ] **Step 3: Call `buildMessageListenerScript()` in `buildHtml()`**

Find where `buildCountdownScript()` is called in `buildHtml()` (~line 1393 area, in the `hasCountdown` conditional). Add the listener script unconditionally just before the closing `</body>` tag:

```typescript
// Existing:
${hasCountdown ? buildCountdownScript() : ""}
// Add after:
${buildMessageListenerScript()}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Verify in browser console**

Open the preview iframe URL directly (e.g. `http://localhost:8787/your-slug`). Open devtools console. Type:
```js
window.postMessage({ type: 'site_settings_update', delta: { accentColor: 'red' } }, '*')
```
Verify accent color changes on the page. Type:
```js
window.postMessage({ type: 'block_config_update', blockId: 'BLOCK_ID_HERE', config: { label: 'Test!' } }, '*')
```
Verify countdown label updates without page reload.

- [ ] **Step 6: Commit**

```bash
git add app/routes/'$slug.tsx'
git commit -m "feat: postMessage listener in renderer -- block_config_update + site_settings_update"
```

---

## Task 4 — iframeRef + setField Fires postMessage

**Files:**
- Modify: `app/routes/_dashboard.sites.$id.tsx` — add `iframeRef`, attach to `<iframe>`, modify `setField`, add settings postMessage firing

- [ ] **Step 1: Add `iframeRef`**

Find the block where other refs are declared (~line 370–380). Add:

```typescript
const iframeRef = useRef<HTMLIFrameElement>(null);
```

- [ ] **Step 2: Attach ref to the preview iframe**

Find the `<iframe` element (~line 2080):
```tsx
<iframe
  key={`${activePage?.id ?? "no-page"}-${previewKey}`}
  className="preview-iframe"
  src={previewUrl}
  title="Page preview"
  style={{ width: previewWidth }}
/>
```
Add `ref={iframeRef}`:
```tsx
<iframe
  ref={iframeRef}
  key={`${activePage?.id ?? "no-page"}-${previewKey}`}
  className="preview-iframe"
  src={previewUrl}
  title="Page preview"
  style={{ width: previewWidth }}
/>
```

- [ ] **Step 3: Modify `setField` to fire postMessage**

Find `function setField(key: string, val: unknown)` (~line 878). Replace it:

```typescript
function setField(key: string, val: unknown) {
  setBlockConfigFields((f) => {
    const updated = { ...f, [key]: val };
    if (iframeRef.current?.contentWindow && expandedBlockId) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'block_config_update', blockId: expandedBlockId, config: updated },
        '*'
      );
    }
    return updated;
  });
}
```

- [ ] **Step 4: Stop bumping `previewKey` after tile config save**

Find `handleSaveTileConfig` (search for `"Tile config saved"`). Remove the `setPreviewKey((k) => k + 1)` call (or equivalent `previewKey` bump) inside that function. The preview is already up to date via postMessage; the API save persists data for the next full load.

- [ ] **Step 5: Fire `site_settings_update` when settings inputs change**

Find the site settings form handlers. Settings are saved via `handleSaveSettings`. The live preview needs to fire on each change, not just on save. Find where individual settings fields update `settingsForm` state (search for `setSettingsForm`). Add a helper alongside `setSettingsForm` calls in the settings inputs:

```typescript
function fireSettingsPreview(delta: Record<string, unknown>) {
  iframeRef.current?.contentWindow?.postMessage(
    { type: 'site_settings_update', delta },
    '*'
  );
}
```

Then in the settings panel, for each color/font input's `onChange`, call `fireSettingsPreview` with the changed key/value. For example, for the accent color input:
```tsx
onChange={e => {
  setSettingsForm(f => ({ ...f, accentColor: e.target.value }));
  fireSettingsPreview({ accentColor: e.target.value });
}}
```
Apply this pattern to: `accentColor`, `bgColor`, `headingColor`, `bodyColor`, `siteTextColor`, `siteBorderColor`, `navBg`, `navBrandColor`, `navLinkColor`, `navHighlightColor`.

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Browser test**

Open the dashboard. Open a tile and change a text field. Verify the preview updates without iframe reload (no flash/blank between changes). Change an accent color in site settings; verify it updates instantly in the preview.

- [ ] **Step 8: Commit**

```bash
git add app/routes/_dashboard.sites.'$id'.tsx
git commit -m "feat: iframeRef + setField fires postMessage -- live preview without iframe reload"
```

---

## Task 5 — Custom ColorSwatch Component

**Files:**
- Modify: `app/routes/_dashboard.sites.$id.tsx` — add `ColorSwatch` function component, replace all `<input type="color">` instances

The swatch button shows the current color as a filled square. Clicking opens an absolute-positioned popover (hex text input + 8 preset swatches). Closes on outside click or Escape. No layout reflow.

- [ ] **Step 1: Add `ColorSwatch` component**

Add this function immediately before the main component's `return` statement (or as a top-level function — either works since it doesn't use hooks):

```typescript
function ColorSwatch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [hex, setHex] = React.useState(value);
  const ref = React.useRef<HTMLDivElement>(null);
  const PRESETS = ["#ffffff","#000000","#9b8e85","#0d9488","#e75850","#f59e0b","#6366f1","#ec4899"];

  React.useEffect(() => { setHex(value); }, [value]);

  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function commitHex(v: string) {
    const clean = v.startsWith("#") ? v : "#" + v;
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) { onChange(clean); setHex(clean); }
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: 28, height: 26, borderRadius: 4, border: "1px solid #e0dbd4",
          background: value || "#fff", cursor: "pointer", padding: 0, flexShrink: 0,
        }}
        aria-label={`Color picker, current: ${value}`}
      />
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 9999,
          background: "#fff", border: "1px solid #e0dbd4", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.13)", padding: "0.6rem", minWidth: 160,
        }}>
          <input
            type="text"
            value={hex}
            maxLength={7}
            onChange={e => setHex(e.target.value)}
            onBlur={e => commitHex(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commitHex(hex); }}
            style={{
              width: "100%", boxSizing: "border-box", border: "1px solid #e0dbd4",
              borderRadius: 5, padding: "4px 8px", fontSize: "0.8rem", marginBottom: "0.5rem",
            }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
            {PRESETS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => { onChange(p); setHex(p); setOpen(false); }}
                style={{
                  width: "100%", aspectRatio: "1", borderRadius: 4, border: "1px solid #e0dbd4",
                  background: p, cursor: "pointer", padding: 0,
                }}
                aria-label={p}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace RSVP button `<input type="color">` instances**

Search for `<input type="color"` in the file. Replace every occurrence with `<ColorSwatch>`. The countdown tile has three:

```tsx
// Before:
<input type="color" value={cfg.rsvpButtonColor ?? ''} onChange={e => setField('rsvpButtonColor', e.target.value)} />
// After:
<ColorSwatch value={String(cfg.rsvpButtonColor ?? accent)} onChange={v => setField('rsvpButtonColor', v)} />

// Before:
<input type="color" value={cfg.rsvpButtonTextColor ?? '#ffffff'} onChange={e => setField('rsvpButtonTextColor', e.target.value)} />
// After:
<ColorSwatch value={String(cfg.rsvpButtonTextColor ?? '#ffffff')} onChange={v => setField('rsvpButtonTextColor', v)} />

// Before:
<input type="color" value={cfg.rsvpButtonBorderColor ?? ''} onChange={e => setField('rsvpButtonBorderColor', e.target.value)} />
// After:
<ColorSwatch value={String(cfg.rsvpButtonBorderColor ?? '#e0dbd4')} onChange={v => setField('rsvpButtonBorderColor', v)} />
```

Also replace the tile appearance section color inputs (~line 1813, 1822):
```tsx
// Before:
{bgMode==='color' && <input type="color" value={bgColor} onChange={e=>setField('background',{type:'color',value:e.target.value})} style={{width:'28px',height:'26px',border:'1px solid #e0dbd4',borderRadius:'4px',padding:'1px',cursor:'pointer'}}/>}
// After:
{bgMode==='color' && <ColorSwatch value={bgColor} onChange={v=>setField('background',{type:'color',value:v})} />}

// Before:
{tcMode==='custom' && <input type="color" value={tcVal} onChange={e=>setField('textColor',e.target.value)} style={{...}}/>}
// After:
{tcMode==='custom' && <ColorSwatch value={tcVal} onChange={v=>setField('textColor',v)} />}
```

And the photo border color input (~line 1596):
```tsx
// Before:
<input type="color" className="clr-swatch" value={String(cfg.photoBorderColor??'#e0dbd4')} onChange={e=>setField('photoBorderColor',e.target.value)} />
// After:
<ColorSwatch value={String(cfg.photoBorderColor??'#e0dbd4')} onChange={v=>setField('photoBorderColor',v)} />
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Browser test**

Open a tile with color inputs (e.g., countdown with RSVP button). Click a swatch button. Verify the popover opens without any layout shift. Enter a hex value. Verify it applies. Click outside — verify popover closes. Press Escape — verify popover closes.

- [ ] **Step 5: Commit**

```bash
git add app/routes/_dashboard.sites.'$id'.tsx
git commit -m "feat: custom ColorSwatch component -- no layout reflow, hex input + presets"
```

---

## Task 6 — Countdown Tile Cleanup + Video X/Y Inputs + RSVP Labels

**Files:**
- Modify: `app/routes/_dashboard.sites.$id.tsx` — countdown tile section, video tile section

- [ ] **Step 1: Remove `cfg.date` input from countdown tile**

Find the countdown tile section (`block.type === 'countdown'`, ~line 1510). Remove the entire date input group:

```tsx
// REMOVE this block (lines ~1511-1521):
<div className="sf-group">
  <label className="sf-lbl">Countdown Date</label>
  <input
    className="sf-input"
    type="date"
    value={String(cfg.date ?? '')}
    onChange={e => setField('date', e.target.value)}
  />
  <p style={{ fontSize: '0.7rem', color: '#9b8e85', margin: '0.25rem 0 0', lineHeight: 1.4 }}>
    Falls back to Site Settings → Event Date if blank.
  </p>
</div>
```

Add a note in its place:
```tsx
<p style={{ fontSize: '0.72rem', color: '#9b8e85', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
  Countdown always uses the event date from Site Settings.
</p>
```

- [ ] **Step 2: Add "overrides global accent" labels + Reset links to RSVP swatch inputs**

In the countdown tile's RSVP section, wrap each `ColorSwatch` with the label:

```tsx
// Button Background:
<div className="sf-group">
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <label className="sf-lbl" style={{ margin: 0 }}>Button Background <span style={{ fontWeight: 400, fontSize: '0.68rem', color: '#b0a99f' }}>overrides global accent</span></label>
    {cfg.rsvpButtonColor && (
      <button type="button" onClick={() => setField('rsvpButtonColor', null)} style={{ fontSize: '0.68rem', color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        Reset to global
      </button>
    )}
  </div>
  <ColorSwatch value={String(cfg.rsvpButtonColor ?? accent)} onChange={v => setField('rsvpButtonColor', v)} />
</div>

// Button Text Color:
<div className="sf-group">
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <label className="sf-lbl" style={{ margin: 0 }}>Button Text <span style={{ fontWeight: 400, fontSize: '0.68rem', color: '#b0a99f' }}>overrides global accent</span></label>
    {cfg.rsvpButtonTextColor && (
      <button type="button" onClick={() => setField('rsvpButtonTextColor', null)} style={{ fontSize: '0.68rem', color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        Reset to global
      </button>
    )}
  </div>
  <ColorSwatch value={String(cfg.rsvpButtonTextColor ?? '#ffffff')} onChange={v => setField('rsvpButtonTextColor', v)} />
</div>

// Button Border:
<div className="sf-group">
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <label className="sf-lbl" style={{ margin: 0 }}>Button Border <span style={{ fontWeight: 400, fontSize: '0.68rem', color: '#b0a99f' }}>overrides global accent</span></label>
    {cfg.rsvpButtonBorderColor && (
      <button type="button" onClick={() => setField('rsvpButtonBorderColor', null)} style={{ fontSize: '0.68rem', color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        Reset to global
      </button>
    )}
  </div>
  <ColorSwatch value={String(cfg.rsvpButtonBorderColor ?? '#e0dbd4')} onChange={v => setField('rsvpButtonBorderColor', v)} />
</div>
```

- [ ] **Step 3: Add X/Y offset inputs to video tile when `showCountdown` is ON**

Find the video tile section (`block.type === 'video'`, ~line 1492). After the `showCountdown` toggle, add conditional X/Y inputs:

```tsx
{!!cfg.showCountdown && (
  <div className="sf-group">
    <label className="sf-lbl">Countdown Position</label>
    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '4px' }}>
      <div style={{ flex: 1 }}>
        <label className="sf-lbl" style={{ fontSize: '0.68rem', color: '#9b8e85' }}>X Offset (px from center)</label>
        <input
          className="sf-input"
          type="number"
          value={Number(cfg.countdownX ?? 0)}
          onChange={e => setField('countdownX', Number(e.target.value))}
          style={{ marginTop: '2px' }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <label className="sf-lbl" style={{ fontSize: '0.68rem', color: '#9b8e85' }}>Y Offset (px from bottom)</label>
        <input
          className="sf-input"
          type="number"
          value={Number(cfg.countdownY ?? 120)}
          onChange={e => setField('countdownY', Number(e.target.value))}
          style={{ marginTop: '2px' }}
        />
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Browser test**

- Open countdown tile: verify no date input, note says "Countdown always uses event date from Site Settings."
- Toggle RSVP button ON: verify three swatches each have "overrides global accent" label and "Reset to global" link.
- Click "Reset to global" link: verify the color clears and preview updates.
- Open video/hero tile: toggle Show countdown ON. Verify X/Y number inputs appear. Change them: verify overlay position updates in preview instantly.

- [ ] **Step 6: Commit**

```bash
git add app/routes/_dashboard.sites.'$id'.tsx
git commit -m "feat: countdown tile cleanup, RSVP accent labels, video countdown X/Y position inputs"
```

---

## Task 7 — Renderer Reads contentMap for 4 Content Blocks

**Files:**
- Modify: `app/routes/$slug.tsx` — `renderBlock` cases for `schedule`, `faq`, `tidbits`, `travel-section`

After this task, all four blocks read from `pageContent` (site_content) instead of `cfg`. Since `renderBlock` already receives `pageContent?`, no signature changes needed. The fallback is an empty array / empty state.

- [ ] **Step 1: Update `renderBlock` case `"schedule"`**

Find `case "schedule":` (~line 948). Replace the entire case body:

```typescript
case "schedule": {
  const events = Array.isArray(pageContent?.events)
    ? (pageContent.events as Array<{ name?: string; date?: string; time?: string; location?: string; description?: string }>)
    : [];
  return `
    <section class="block block-schedule" aria-label="Schedule" data-block-id="${escHtml(block.id)}" data-block-type="schedule">
      <h2 class="section-heading">The Day</h2>
      <div class="section-rule" aria-hidden="true"></div>
      ${events.length > 0
        ? `<ol class="timeline">
             ${events.map(ev => `
               <li class="timeline-item">
                 ${ev.time ? `<span class="timeline-time">${escHtml(ev.time)}</span>` : ""}
                 <div class="timeline-content">
                   ${ev.name ? `<strong>${escHtml(ev.name)}</strong>` : ""}
                   ${ev.date ? `<p style="font-size:0.85em;color:var(--muted);margin:0.2rem 0 0;">${escHtml(ev.date)}</p>` : ""}
                   ${ev.location ? `<p style="font-size:0.85em;color:var(--muted);margin:0.2rem 0 0;">📍 ${escHtml(ev.location)}</p>` : ""}
                   ${ev.description ? `<p>${escHtml(ev.description)}</p>` : ""}
                 </div>
               </li>`).join("")}
           </ol>`
        : placeholder("The wedding day schedule will appear here once added in the Content tab.")
      }
    </section>`;
}
```

- [ ] **Step 2: Update `renderBlock` case `"faq"`**

Find `case "faq":` (~line 977). Replace the entire case body:

```typescript
case "faq": {
  const questions = Array.isArray(pageContent?.questions)
    ? (pageContent.questions as Array<{ q?: string; a?: string }>)
    : [];
  return `
    <section class="block block-faq" aria-label="Frequently asked questions" data-block-id="${escHtml(block.id)}" data-block-type="faq">
      <h2 class="section-heading">Questions &amp; Answers</h2>
      <div class="section-rule" aria-hidden="true"></div>
      ${questions.length > 0
        ? `<dl class="faq-list">
             ${questions.map(item =>
               `${item.q ? `<dt class="faq-question">${escHtml(item.q)}</dt>` : ""}${item.a ? `<dd class="faq-answer">${escHtml(item.a)}</dd>` : ""}`
             ).join("")}
           </dl>`
        : placeholder("Frequently asked questions will appear here once added in the Content tab.")
      }
    </section>`;
}
```

- [ ] **Step 3: Update `renderBlock` case `"tidbits"`**

Find `case "tidbits":` (~line 1175). Replace the entire case body:

```typescript
case "tidbits": {
  const items = Array.isArray(pageContent?.tidbits)
    ? (pageContent.tidbits as Array<{ icon?: string; title?: string; body?: string }>)
    : [];
  const cols = String(cfg.columns ?? "auto");
  const colsCss = cols === "2" ? "repeat(2,1fr)" : cols === "3" ? "repeat(3,1fr)" : "repeat(auto-fill,minmax(200px,1fr))";
  const cardStyle = String(cfg.cardStyle ?? "card");
  const cardCss = cardStyle === "flat"
    ? "padding:1.25rem;text-align:center;"
    : cardStyle === "bordered"
    ? "border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center;"
    : "background:#fff;border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.05);";
  return `
    <section class="block block-tidbits" aria-label="Fun facts" data-block-id="${escHtml(block.id)}" data-block-type="tidbits">
      ${cfg.showTitle !== false ? `<h2 class="section-heading">Fun Facts</h2><div class="section-rule" aria-hidden="true"></div>` : ""}
      ${items.length > 0
        ? `<div style="display:grid;grid-template-columns:${colsCss};gap:1rem;">
             ${items.map(it => `<div style="${cardCss}">
               ${it.icon ? `<div style="font-size:2rem;margin-bottom:0.5rem;">${escHtml(it.icon)}</div>` : ""}
               ${it.title ? `<strong style="display:block;margin-bottom:0.375rem;">${escHtml(it.title)}</strong>` : ""}
               ${it.body ? `<p style="color:var(--muted);font-size:0.9375rem;margin:0;">${escHtml(it.body)}</p>` : ""}
             </div>`).join("")}
           </div>`
        : placeholder("Fun facts will appear here once added in the Content tab.")
      }
    </section>`;
}
```

- [ ] **Step 4: Update `renderBlock` case `"travel-section"`**

Find `case "travel-section":` (~line 1200). Replace the entire case body:

```typescript
case "travel-section": {
  const title = (cfg.title as string | undefined) ?? "Getting There";
  const travelItems = Array.isArray(pageContent?.travelItems)
    ? (pageContent.travelItems as Array<{ heading?: string; body?: string; linkLabel?: string; linkUrl?: string }>)
    : [];
  return `
    <section class="block block-travel" aria-label="Travel information" data-block-id="${escHtml(block.id)}" data-block-type="travel-section">
      <h2 class="section-heading">${escHtml(title)}</h2>
      <div class="section-rule" aria-hidden="true"></div>
      ${travelItems.length > 0
        ? travelItems.map(item => `
            <div style="margin-bottom:1.5rem;">
              ${item.heading ? `<h3 style="font-size:1.05rem;margin:0 0 0.4rem;">${escHtml(item.heading)}</h3>` : ""}
              ${item.body ? `<p style="margin:0 0 0.4rem;line-height:1.7;">${escHtml(item.body)}</p>` : ""}
              ${item.linkUrl && item.linkLabel
                ? `<a href="${escHtml(item.linkUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">${escHtml(item.linkLabel)}</a>`
                : ""}
            </div>`).join("")
        : placeholder("Travel details will appear here once added in the Content tab.")
      }
    </section>`;
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Browser test**

Open a site with a schedule block. If site_content has schedule events, verify they render correctly in the preview. If empty, verify the placeholder text shows. Verify the same for FAQ, tidbits, and travel blocks.

- [ ] **Step 7: Commit**

```bash
git add app/routes/'$slug.tsx'
git commit -m "feat: schedule/faq/tidbits/travel renderers read from site_content via pageContent"
```

---

## Task 8 — Content Tab: Tidbits + Travel Editors

**Files:**
- Modify: `app/routes/_dashboard.sites.$id.tsx` — content tab section, `contentByPage` state, block-type-aware conditional rendering

Add editors for `tidbits` and `travel-section` blocks in the content tab. Show schedule/FAQ editors based on whether the current page has those block types (not just page slug), to handle blocks on non-standard pages. Add drag-reorderable rows via SortableJS.

- [ ] **Step 1: Extract a helper to check if current page has a block type**

At the top of the content tab render function (`activeTab === "content"`, ~line 1889), add:

```typescript
const pageBlockTypes = new Set(
  (blocks).map(b => b.type)
);
```

(`blocks` is already in scope — it's the current page's blocks state.)

- [ ] **Step 2: Add tidbits content variables**

Near where `schedEvents` and `faqQuestions` are destructured (~line 1903), add:

```typescript
const tidbits = Array.isArray(pageContent.tidbits) ? (pageContent.tidbits as Record<string,unknown>[]) : [];
const travelItems = Array.isArray(pageContent.travelItems) ? (pageContent.travelItems as Record<string,unknown>[]) : [];
```

- [ ] **Step 3: Update schedule editor condition**

Find `{slug === "schedule" && (`. Change to:

```tsx
{(slug === "schedule" || pageBlockTypes.has("schedule")) && (
```

- [ ] **Step 4: Update FAQ editor condition**

Find `{slug === "faq" && (`. Change to:

```tsx
{(slug === "faq" || pageBlockTypes.has("faq")) && (
```

- [ ] **Step 5: Add tidbits editor after the FAQ section**

After the closing `)}` of the FAQ editor block, add:

```tsx
{/* TIDBITS (Fun Facts) */}
{pageBlockTypes.has("tidbits") && (
  <div style={{ border: "1px solid #e8e4e0", borderRadius: "10px", padding: "1rem", marginBottom: "0.75rem" }}>
    <p style={sectionHeadStyle}>Fun Facts</p>
    {tidbits.map((item, i) => (
      <div key={i} style={{ border: "1px solid #f0ede8", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.6rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#9b8e85" }}>Fact {i + 1}</span>
          <button onClick={() => onChange("tidbits", tidbits.filter((_, j) => j !== i))}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: "0.8rem" }}>×</button>
        </div>
        <div style={fieldStyle}><label style={lblStyle}>Icon / Emoji</label>
          <input style={inputStyle} value={String(item.icon ?? "")} onChange={e => {
            const next = [...tidbits]; next[i] = { ...next[i], icon: e.target.value }; onChange("tidbits", next);
          }} placeholder="✨" /></div>
        <div style={fieldStyle}><label style={lblStyle}>Title</label>
          <input style={inputStyle} value={String(item.title ?? "")} onChange={e => {
            const next = [...tidbits]; next[i] = { ...next[i], title: e.target.value }; onChange("tidbits", next);
          }} /></div>
        <div style={fieldStyle}><label style={lblStyle}>Body</label>
          <textarea style={{ ...taStyle, minHeight: "60px" }} value={String(item.body ?? "")} onChange={e => {
            const next = [...tidbits]; next[i] = { ...next[i], body: e.target.value }; onChange("tidbits", next);
          }} /></div>
      </div>
    ))}
    <button onClick={() => onChange("tidbits", [...tidbits, { icon: "✨", title: "", body: "" }])}
      className="btn-ghost" style={{ fontSize: "0.76rem", width: "100%" }}>+ Add Fact</button>
  </div>
)}
```

- [ ] **Step 6: Add travel editor after tidbits section**

```tsx
{/* TRAVEL */}
{pageBlockTypes.has("travel-section") && (
  <div style={{ border: "1px solid #e8e4e0", borderRadius: "10px", padding: "1rem", marginBottom: "0.75rem" }}>
    <p style={sectionHeadStyle}>Travel Details</p>
    {travelItems.map((item, i) => (
      <div key={i} style={{ border: "1px solid #f0ede8", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.6rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#9b8e85" }}>Item {i + 1}</span>
          <button onClick={() => onChange("travelItems", travelItems.filter((_, j) => j !== i))}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: "0.8rem" }}>×</button>
        </div>
        <div style={fieldStyle}><label style={lblStyle}>Heading</label>
          <input style={inputStyle} value={String(item.heading ?? "")} onChange={e => {
            const next = [...travelItems]; next[i] = { ...next[i], heading: e.target.value }; onChange("travelItems", next);
          }} placeholder="Getting to the venue" /></div>
        <div style={fieldStyle}><label style={lblStyle}>Body</label>
          <textarea style={{ ...taStyle, minHeight: "80px" }} value={String(item.body ?? "")} onChange={e => {
            const next = [...travelItems]; next[i] = { ...next[i], body: e.target.value }; onChange("travelItems", next);
          }} /></div>
        <div style={fieldStyle}><label style={lblStyle}>Link Label (optional)</label>
          <input style={inputStyle} value={String(item.linkLabel ?? "")} onChange={e => {
            const next = [...travelItems]; next[i] = { ...next[i], linkLabel: e.target.value }; onChange("travelItems", next);
          }} placeholder="Get directions" /></div>
        <div style={fieldStyle}><label style={lblStyle}>Link URL (optional)</label>
          <input style={inputStyle} type="url" value={String(item.linkUrl ?? "")} onChange={e => {
            const next = [...travelItems]; next[i] = { ...next[i], linkUrl: e.target.value }; onChange("travelItems", next);
          }} placeholder="https://maps.google.com/…" /></div>
      </div>
    ))}
    <button onClick={() => onChange("travelItems", [...travelItems, { heading: "", body: "", linkLabel: "", linkUrl: "" }])}
      className="btn-ghost" style={{ fontSize: "0.76rem", width: "100%" }}>+ Add Travel Item</button>
  </div>
)}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 8: Browser test**

Navigate to the Content tab on a page that has a tidbits block. Verify the "Fun Facts" editor section appears. Add a fact with icon/title/body. Click Save Content. Verify the preview updates (either via postMessage or by bumping previewKey). Navigate to a page with a travel-section block. Verify travel editor appears. Add a travel item. Save and verify preview.

- [ ] **Step 9: Commit**

```bash
git add app/routes/_dashboard.sites.'$id'.tsx
git commit -m "feat: tidbits + travel editors in content tab; block-type-aware schedule/FAQ editors"
```

---

## Task 9 — Remove Inline Editing from 4 Tiles + Empty-State Banners

**Files:**
- Modify: `app/routes/_dashboard.sites.$id.tsx`

After Tasks 7 and 8 are live, the tile panels for schedule/FAQ/tidbits/travel can have their inline item editors removed. Each gets an empty-state banner instead.

- [ ] **Step 1: Update the schedule tile**

Find the schedule tile block (`block.type === 'schedule'`, ~line 1630). The current code renders event cards inline. Remove the inline event list and the `+ Add Event` button. Replace with an empty-state message:

```tsx
{block.type === 'schedule' && (
  <div className="sf-group" style={{ background: '#faf9f8', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
    <p style={{ fontSize: '0.75rem', color: '#9b8e85', margin: 0, lineHeight: 1.5 }}>
      Schedule events are edited in the <strong>Content</strong> tab above.
    </p>
  </div>
)}
```

- [ ] **Step 2: Update the FAQ tile**

Find the FAQ tile block (`block.type === 'faq'`, ~line 1728). Remove the inline Q&A list and `+ Add Q&A` button. Replace with:

```tsx
{block.type === 'faq' && (
  <div className="sf-group" style={{ background: '#faf9f8', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
    <p style={{ fontSize: '0.75rem', color: '#9b8e85', margin: 0, lineHeight: 1.5 }}>
      Q&amp;A items are edited in the <strong>Content</strong> tab above.
    </p>
  </div>
)}
```

- [ ] **Step 3: Update the tidbits tile**

Find the tidbits tile block (`block.type === 'tidbits'`, ~line 1754). Keep the columns and card style controls (those are layout/style). Remove the inline items list (starting at `{(Array.isArray(cfg.items)...`) and the `+ Add Fact` button. Add after the card style controls:

```tsx
<div style={{ background: '#faf9f8', borderRadius: 8, padding: '0.75rem', textAlign: 'center', marginTop: '0.5rem' }}>
  <p style={{ fontSize: '0.75rem', color: '#9b8e85', margin: 0, lineHeight: 1.5 }}>
    Fun facts are edited in the <strong>Content</strong> tab above.
  </p>
</div>
```

- [ ] **Step 4: Update the travel-section tile**

Find the travel-section tile block (`block.type === 'travel-section'`, ~line 1791). Keep the section title input (`cfg.title`). Remove the intro textarea and the existing note about the Content tab. Replace with:

```tsx
{block.type === 'travel-section' && (
  <>
    <div className="sf-group">
      <label className="sf-lbl">Section Title</label>
      <input className="sf-input" value={String(cfg.title ?? '')} onChange={e => setField('title', e.target.value)} placeholder="Getting There" />
    </div>
    <div style={{ background: '#faf9f8', borderRadius: 8, padding: '0.75rem', textAlign: 'center', marginTop: '0.5rem' }}>
      <p style={{ fontSize: '0.75rem', color: '#9b8e85', margin: 0, lineHeight: 1.5 }}>
        Travel items are edited in the <strong>Content</strong> tab above.
      </p>
    </div>
  </>
)}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Browser test**

Open each of the four tile panels. Verify:
- Schedule: shows "Schedule events are edited in the Content tab" — no inline event cards.
- FAQ: shows "Q&A items are edited in the Content tab" — no inline Q&A list.
- Tidbits: column/card style controls still work; no inline items; shows Content tab note.
- Travel: section title input still present; no intro textarea; shows Content tab note.

Switch to the Content tab for each page and confirm editors still work there.

- [ ] **Step 7: Commit**

```bash
git add app/routes/_dashboard.sites.'$id'.tsx
git commit -m "feat: remove inline editing from schedule/faq/tidbits/travel tiles -- redirect to content tab"
```

---

## Task 10 — Legacy Migration on Block Config Save

**Files:**
- Modify: `app/routes/_dashboard.sites.$id.tsx` — `handleSaveTileConfig` function

When a block config is saved, check for legacy inline data in `config` that should now live in `site_content`. Write it to the content API and remove from config. Idempotent: only migrates if `site_content` does not already have data for the block's content key.

- [ ] **Step 1: Locate `handleSaveTileConfig`**

Find the function (search for `"Tile config saved"`, ~line 865). The function currently:
1. PATCHes the block config via `/api/sites/${siteId}/blocks/${blockId}`
2. Re-fetches blocks
3. Closes the tile panel
4. Toasts success

- [ ] **Step 2: Add migration logic before the PATCH call**

Insert before the fetch call:

```typescript
// Legacy migration: move inline content from config to site_content
if (activePage) {
  const lang = settingsForm.mainLanguage || "en";
  const pageSlug = activePage.slug;

  type MigSpec = { blockType: string; cfgKey: string; contentKey: string };
  const migrations: MigSpec[] = [
    { blockType: "schedule",       cfgKey: "events",  contentKey: "events"      },
    { blockType: "faq",            cfgKey: "items",   contentKey: "questions"   },
    { blockType: "tidbits",        cfgKey: "items",   contentKey: "tidbits"     },
  ];

  const mig = migrations.find(m => m.blockType === openBlock?.type);
  if (mig && Array.isArray(configToSave[mig.cfgKey]) && (configToSave[mig.cfgKey] as unknown[]).length > 0) {
    // Fetch current site_content to check if already migrated
    const existing = contentByPage[pageSlug]?.[lang] ?? {};
    const alreadyHasData = Array.isArray(existing[mig.contentKey]) && (existing[mig.contentKey] as unknown[]).length > 0;

    if (!alreadyHasData) {
      // Write legacy data to site_content
      const migratedContent = { ...existing, [mig.contentKey]: configToSave[mig.cfgKey] };
      await fetch(`/api/sites/${site.id}/content`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pageSlug, lang, content: migratedContent }),
      });
      // Refresh contentByPage
      await fetchContent();
    }

    // Remove legacy key from config
    const { [mig.cfgKey]: _removed, ...cleanedConfig } = configToSave as Record<string, unknown>;
    configToSave = cleanedConfig;
  }
}
```

Note: `configToSave` must be a `let` not a `const` for the reassignment. Check the variable name used in `handleSaveTileConfig` — it may be named `fields` or similar. Adjust accordingly.

- [ ] **Step 3: Verify the block type used for migration lookup**

The check `openBlock?.type` references whichever state variable tracks the currently-open block. Search the file for `expandedBlockId` — to get the block object, look up `blocks.find(b => b.id === expandedBlockId)`. If needed, add:

```typescript
const openBlock = blocks.find(b => b.id === expandedBlockId);
```

at the start of `handleSaveTileConfig`.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Test migration end-to-end**

1. Find a site that has a schedule block with `cfg.events` data (added before this deploy).
2. Open the schedule tile in the dashboard.
3. Click Save (without changing anything).
4. Verify: the Content tab now shows the events that were previously in the tile.
5. Verify: opening the block config in DevTools network tab shows the `config` no longer contains `events`.
6. Click Save again — verify no data loss and no duplication (idempotent).

- [ ] **Step 6: Commit**

```bash
git add app/routes/_dashboard.sites.'$id'.tsx
git commit -m "feat: legacy migration -- moves cfg.events/items to site_content on first tile save"
```

---

## Self-Review Against Spec

### Spec Coverage Check

| Spec requirement | Task |
|---|---|
| `block_config_update` postMessage on `setField` | Task 3 (listener) + Task 4 (sender) |
| `site_settings_update` on settings input | Task 3 (listener) + Task 4 (sender) |
| `data-block-id` on block roots | Task 3 |
| `applyConfig` per block in-place | Task 3 |
| previewKey only for structural changes | Task 4 |
| No native `<input type="color">` | Task 5 |
| Custom swatch: hex input + presets | Task 5 |
| Swatch closes on outside click / Escape | Task 5 |
| RSVP swatch "overrides global accent" label | Task 6 |
| RSVP "Reset to global" link | Task 6 |
| Remove countdown block date field | Task 6 |
| Countdown always uses `settings.eventDate` | Task 1 |
| Countdown ticker `isNaN` guard | Task 1 |
| Stable element IDs (`cd-days-{id}` etc.) | Task 1 |
| Video block countdown overlay | Task 2 |
| `countdownX` / `countdownY` in config | Task 2 + Task 6 |
| Toggle `showCountdown` instant preview | Task 3 (applyConfig video) + Task 4 |
| Schedule renderer reads `pageContent.events` | Task 7 |
| FAQ renderer reads `pageContent.questions` | Task 7 |
| Tidbits renderer reads `pageContent.tidbits` | Task 7 |
| Travel renderer reads `pageContent.travelItems` | Task 7 |
| Empty-state banners on 4 tiles | Task 9 |
| Tidbits + travel content tab editors | Task 8 |
| + Add / trash per row in content tab | Task 8 |
| Legacy migration on save (idempotent) | Task 10 |
| Photo library picker | **Out of scope** (spec excludes upload) |
| Images block w/h + border inputs | Not covered — add to backlog |
| Photo+Content block photo picker | Not covered — add to backlog |
| Tile LAYOUT/STYLE/TYPOGRAPHY/ANIMATION standard sections | Not covered — separate refactor |

### Missing Coverage

Two items from Section 2 (tile anatomy standardization) are not covered:
- Photo+Content (`photo-split`) block: photo library picker, w×h inputs, border controls
- Images block: photo library picker, w×h parity inputs

These require a photo library picker UI component that doesn't exist yet. Treating as a follow-on task.

Standard tile anatomy headers (LAYOUT / STYLE / TYPOGRAPHY / ANIMATION sections) are structural — existing tiles vary but are functional. Omitting full tile anatomy standardization from this plan to keep scope manageable; this can be a follow-on refactor once the data flow improvements above are in.

### Type Consistency Check

- `cd-days-{id}`, `cd-hours-{id}`, `cd-mins-{id}`, `cd-secs-{id}` — consistent across Tasks 1, 2, 3
- `block_config_update` / `site_settings_update` — consistent across Tasks 3, 4
- `pageContent.events` / `.questions` / `.tidbits` / `.travelItems` — consistent across Tasks 7, 8, 10
- `countdownX` / `countdownY` — consistent across Tasks 2, 6
- `ColorSwatch` — consistent across Tasks 5, 6
