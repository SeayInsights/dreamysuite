# DreamySuite — Entrance Animation Redesign Spec
**Status:** Ready to implement | **Session:** Start fresh with this doc

---

## Codebase quick facts

| Item | Value |
|---|---|
| Repo | `https://github.com/SeayInsights/dreamysuite.git` |
| Local path | `C:\Users\Dannis Seay\studio\builds\dreamysuite` |
| Primary file | `app/routes/$slug.tsx` (public renderer — ~36KB, read fully before touching) |
| Builder file | `app/routes/_dashboard.sites.$id.tsx` |
| Settings API | `app/routes/api.sites.$id.settings.ts` |
| CSS | All animation CSS is inlined inside `$slug.tsx` in the `siteCss` string |
| JS | All animation JS is inlined in `$slug.tsx` as the `introScript` string |
| Animation lib | GSAP 3.12.5 loaded from CDN — only present when animation !== "none" |
| DB | Cloudflare D1 — `dreamysuite-db` |

### Key functions in $slug.tsx
- `buildIntroHtml(animation, eventTitle, eventDate, envelopeColor, sealInitials, cardColor, cardImage, popupBundle, popupTitle, popupGreeting)` — around line 1624. Generates the static HTML for the intro overlay.
- `openIntro` JS function — around line 2020. Triggered on click, runs the GSAP timeline.
- `window._replayIntro` JS function — around line 1973. Resets state and re-runs.
- `window._closeIntro` — around line 2013.

### Animation types
`animation` column in `site_setting`: `"envelope"` | `"doors"` | `"storybook"` | `"none"`

### bgImage status (MUST CHECK at session start)
- `bgImage` column EXISTS in D1 `site_setting` table (added in Phase 4 migration)
- `bgImage` is in `SiteSettingRow` interface in `$slug.tsx`
- **NOT currently passed to `buildIntroHtml`** — needs to be added as a param for storybook
- Check `api.sites.$id.settings.ts` ALLOWED_FIELDS to confirm `bgImage` saves correctly
- Check `_dashboard.sites.$id.tsx` to confirm builder UI has a bgImage upload field for storybook

---

## Global animation direction

**Tone:** Cinematic + modern. Slow reveals, weighted movement, film feel. Gold tones. Not old-fashioned luxury — clean and breathtaking.

**Shared elements to keep:** Film grain, vignette, dust motes, cinematic letterbox bars.

**Replay:** `.intro-replay-btn` class exists — keep wired up.

**Mobile:** Simplify if needed, don't remove unnecessarily.

---

## Animation 1 — Envelope

### Director's brief
- "Like watching someone open an envelope on film"
- "Breathtaking, cinematic"
- Modernize the envelope look — currently feels old/dated
- Seal currently looks cartoonish/simplistic — make it realistic

### Pre-click (idle state)
Currently: static envelope + pulsing seal.

**New idle state:**
1. On page load, envelope starts slightly off-screen or scaled down
2. Drifts in slowly to center (ease in, 1.5–2s) — commands attention
3. Letterbox bars animate in as envelope arrives
4. Subtle light shift across the envelope surface (slow shimmer, 1 cycle)
5. Seal pulses with warm glow (keep current pulse, improve visually)

**Bug fix:** Flap currently appears open before animation. Fix: add CSS `opacity:0` or `transform:translateY(-100%)` to `.envfs-card` before GSAP initializes — don't rely only on the JS set.

### Seal redesign (static)
Currently: smooth circular gradient with initials — looks like a cartoon badge.

**New design:**
- **Shape:** Still circular but with organic slightly-uneven SVG edge (wax drip texture effect via SVG path or CSS radial with noise)
- **Texture:** Multi-layer radial gradients to simulate pressed wax — matte center, slight specular highlight top-left, dark deep shadow bottom-right
- **Rose motif:** SVG rose behind the initials — delicate line art, semi-transparent (~30% opacity) so initials read on top
- **Initials:** Keep user's initials, bump font size slightly, embossed text-shadow (light top, dark bottom)
- **Border:** Multiple concentric rings at different opacities (signet stamp look)
- **Edge:** Irregular CSS clip-path or box-shadow to simulate wax drip/pooled edges

### On click — seal peel
Currently: seal flings upward fast (too fast, too cartoonish).

**New behavior:**
1. A thin dark object (letter opener / thumbnail blade) slides in from the bottom-left edge of the seal (~0.4s, ease-out)
2. The object's edge catches under the seal
3. Seal begins to peel/lift from one side — GSAP `rotateX` on the seal (tilt back) + slight `translateY` upward, as if being levered up (~0.8s)
4. Seal cracks off and slides away slowly (not a fling) — `translateY(-120%) rotateX(60deg)`, duration ~1.0s, ease: `power2.inOut`
5. Object fades out as seal lifts

Implementation: Create a `.envfs-opener` element (thin 2px tall, dark bar, 40px wide) positioned under the seal. Animate it in, then animate seal lift, then fade both.

### On click — flap open
Currently: flap rotates quickly.

**New behavior:**
- Much slower and more weighted: `rotateX:-200deg` over `2.2s` with `ease:'power3.inOut'`
- Add slight `perspective:1200px` to the envelope container so the 3D rotation looks real
- As flap opens past 90°, reveal the back face (already dark gradient — keep)
- Intimate warm light floods in simultaneously (not a burst — ease: `power1.in`, 1.8s)

### On click — card reveal
Currently: card rises from below.

**Keep this but:**
- Slow it down slightly (from 1.65s to 2.0s)
- Add a very subtle `blur(4px) → blur(0)` on the card as it rises (like focus pulling in)
- Card settles with a gentle breath animation after arriving (scale 1→1.02→1 over 1.2s)

### Full sequence timing (rough)
```
0.0s  — cue text fades
0.0s  — opener blade slides in
0.4s  — seal begins lifting
1.2s  — seal peels off / fades away, opener fades
1.4s  — letterbox bars retract (height→0, 1.2s)
1.6s  — flap begins opening (2.2s)
2.4s  — warm glow rises (1.8s)
3.8s  — card rises from below (2.0s), with blur→focus
5.8s  — card breath pulse
6.5s  — settle, hold 1.5s
8.0s  — fade out overlay
```

---

## Animation 2 — Doors

### Director's brief
- Doors look good, need more realism
- Smoke/ground fog rolls from underneath BEFORE click
- On click: doors open, smoke + warm light flood toward the viewer
- With popup: mist fills space, bundle card rises from center mist

### Idle state (before click)
**Add: smoke/fog layer**
- A `div.door-smoke` positioned at the bottom of the overlay, `height:35%`
- CSS animated smoke using layered radial gradients + `@keyframes` translate + opacity cycles
- Smoke uses 4–6 individual cloud elements (`.door-smoke-cloud`) with staggered animation timing
- Colors: very dark warm gray (`rgba(40,20,8,0.55)`) fading to transparent at top
- Clouds drift: slight left/right translateX (~20px), slow (8–14s per cycle)
- Smoke should feel grounded — rolls along the floor, wisps upward

**Door texture improvements:**
- Add a CSS repeating wood grain pattern overlay using `repeating-linear-gradient` at ~3deg with 2px stripes, very low opacity (~0.06)
- Add a horizontal panel line at 30% and 65% height (`::before`/`::after` on `.door` with 1px rgba lines)
- Deepen the door shadow: `box-shadow: inset -60px 0 120px rgba(0,0,0,0.8)` on `.door-l` (and mirrored for right)

### On click — doors open
**Current:** Doors swing open, glow blooms, done.

**New sequence:**
1. Smoke at base SURGES — scale up Y + translate toward viewer (z-axis effect via scaleY + opacity up briefly)
2. Glow blooms wider (keep current behavior, increase intensity)
3. Doors swing open (keep rotateY:-122 / 122, keep timing)
4. As doors open: warm light floods outward — `div.door-light-flood`: radial gradient centered, expands from center outward, `scaleX(1→6) scaleY(1→4)`, opacity `0.85 → 0`, duration 1.2s
5. Smoke follows the light outward — `translateY(-30%) scaleX(2)` as doors fully open

**With popup bundle:**
- After doors open, smoke fills the revealed area (transition to lighter warm mist)
- Bundle card `.intro-bundle-card` rises from center of mist with scale `0.85→1` + `opacity 0→1`
- Mist color shifts from dark smoke to warm golden haze as card appears

### Implementation notes
- Smoke clouds: pure CSS + GSAP for the surge on click — no canvas needed
- Light flood: new `div.door-light-flood` element, positioned absolute, centered, z-index between doors and text

---

## Animation 3 — Storybook

### Director's brief
- Feel: Disney classic era (Beauty and the Beast, Sleeping Beauty)
- Leather must look REAL — aged, heavy, tactile
- On click: flip through several pages before settling on the final page
- Final page: reveals user's uploaded venue/wedding-location photo
- No photo uploaded: old parchment default with subtle wedding animations
- Popup (if configured): floats centered over the revealed scene

### Book cover redesign
Currently: flat dark gradient with triple gold border lines.

**New:**
- Leather simulation via layered CSS: base warm brown + `repeating-linear-gradient` grain at 45deg (~1px stripes, opacity 0.03) + SVG turbulence filter for organic leather bump
- Corner detail: CSS-drawn ornate corner flourishes (simple CSS border-image or SVG clip inset)
- Gold title border: more ornate — double line with small diamond/cross marks at corners (SVG or CSS)
- Add aged crease marks: 2–3 faint `::before`/`::after` lines across the cover at slight angles
- Book spine: improve depth — add subtle highlight line on the binding edge, slight warm ambient

### Page-flip sequence (NEW — key feature)
When user clicks, before revealing the final page:

1. Lift the cover open (rotateY: 0 → -60deg, 0.8s, ease: `power2.inOut`)
2. First interior page peels visible from behind — `.book-page-1` (cream colored)
3. Page 1 flips over (rotateY: 0 → -160deg, 0.6s, ease: `power3.inOut`)  — quick flick
4. Page 2 peels + flips over (stagger 0.1s after page 1 lands, same speed)
5. Page 3 peels + flips (optional — 2 or 3 page flips total feels right)
6. Final page settles — reveals the venue photo or parchment default
7. If popup: bundle card fades/rises from center of the revealed page

**Implementation approach:**
- Each page is a `div.book-page-N` element with `transform-origin: left center`
- Pages are stacked behind the cover in the DOM
- Use GSAP staggered timeline: cover opens, then pages flip in rapid succession
- Final page is the "reveal" — `div.book-final-page` — contains `bgImage` as background or parchment default

### Venue photo reveal (bgImage)
```
wiring needed:
1. Add bgImage param to buildIntroHtml() signature
2. Pass settings.bgImage from buildHtml() when calling buildIntroHtml()
3. In storybook HTML: .book-final-page { background-image: url(bgImage); background-size: cover; background-position: center; }
4. Check ALLOWED_FIELDS in api.sites.$id.settings.ts includes bgImage
5. Check builder UI has bgImage upload in Site Setup → Animation section
```

### Default parchment (no bgImage)
When no venue photo uploaded:

- `.book-final-page` background: `radial-gradient(ellipse at 40% 40%, #fdf6e3 0%, #f0e0b0 60%, #dcc890 100%)`
- Aged edges: dark vignette + slight sepia tone
- Subtle wedding animations (DO NOT distract from popup):
  - 3–4 falling rose petals (CSS `@keyframes` — drift side to side + rotate, 8–12s each, staggered, opacity max 0.45)
  - 2 small sparkle glints (CSS `@keyframes` scale 0→1→0 + opacity, positioned near corners, 4–6s cycle)
  - NO text, NO flowers, NO busy patterns

### Popup float
If bundle configured — after final page settles:
- `.intro-bundle-card` starts at `scale(0.92) opacity(0) translateY(20px)`
- Rises to `scale(1) opacity(1) translateY(0)`, `ease: back.out(1.1)`, 0.55s
- Feels like the card is resting on the open book page

---

## Files to read at session start (in order)

1. Read full `app/routes/$slug.tsx` — split into sections if needed (it's ~36KB)
2. Grep for `bgImage` in `api.sites.$id.settings.ts` to confirm it's in ALLOWED_FIELDS
3. Grep for `bgImage` or `animation` in `_dashboard.sites.$id.tsx` to check builder UI
4. Check git log for any recent animation commits since `71626f3`

---

## Handoff prompt for new session

Paste this at the start of a new Claude Code session from `C:\Users\Dannis Seay\studio\builds\dreamysuite`:

---

```
I need to implement a full redesign of all three entrance animations in DreamySuite. 
The spec is at docs/ANIMATION_REDESIGN.md — read that first, then read the full 
$slug.tsx file before writing any code.

All animation CSS and JS live inline inside app/routes/$slug.tsx in the siteCss 
and introScript template strings. GSAP 3.12.5 is loaded from CDN.

Before coding:
1. Read docs/ANIMATION_REDESIGN.md completely
2. Read app/routes/$slug.tsx in full (use offset/limit — it's large)
3. Grep bgImage in app/routes/api.sites.$id.settings.ts to verify ALLOWED_FIELDS
4. Grep bgImage in app/routes/_dashboard.sites.$id.tsx to check builder UI

Implement all three animations per the spec. Work through them one at a time 
(envelope → doors → storybook). Commit each animation as a separate commit 
before moving to the next. Push to GitHub when all three are done.

Key constraint: deploy is GitHub push only — CI handles Cloudflare Pages deploy. 
Never run wrangler deploy directly.
```

---

## Known issues to check at session start

1. Settings API may still not save `animation`/`bgImage` — check commit `3719f62` is deployed
2. Builder UI animation dropdown help text still describes old auto-play behavior (not click-to-open gate) — update if spotted
3. Preview iframe doesn't reload after Save Settings — known, not blocking
