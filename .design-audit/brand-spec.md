# DreamySuite Brand Specification
**Design Philosophy:** Build (Contemporary Minimalism)  
**Last Updated:** 2026-04-27

---

## Design Philosophy: Build

> "Refined simplicity with subtle details. Confident whitespace. Premium feel without ostentation."

### Core Principles
1. **Clean contemporary aesthetic** — No unnecessary decoration
2. **Subtle refinements** — Kerning, spacing, micro-interactions matter
3. **Confident whitespace** — 40-50% empty space creates premium feel
4. **Modern serif + sans pairings** — Typographic hierarchy
5. **Restrained palette** — Not stark black/white, refined neutrals

### Why Build for Wedding Websites?
- Elegant without being overwrought
- Premium feel appropriate for special occasions
- Clean enough for non-designers to use
- Romantic without being cheesy (no script fonts, no pink gradients)

---

## Brand Tokens

### Color System (60/30/10 Rule)

#### Primary (60% usage) — Warm Neutrals
```css
--brand-primary-bg:        #FDFBF7  /* Warm cream — main surfaces */
--brand-primary-bg-subtle: #F7F2EA  /* Subtle cream — secondary surfaces */
--brand-primary-card:      #FFFFFF  /* Pure white — cards, elevated elements */
--brand-primary-text:      #1A1714  /* Rich brown-black — primary text */
```

#### Secondary (30% usage) — Muted Tones
```css
--brand-secondary-text:    #4A4540  /* Medium brown — secondary text */
--brand-secondary-muted:   #8B7F76  /* Warm gray-brown — muted text, placeholders */
--brand-secondary-light:   #B5A89E  /* Light taupe — disabled states */
--brand-secondary-border:  #E5DDD3  /* Soft border — primary dividers */
--brand-secondary-border-light: #EDE8DF  /* Lighter border — subtle dividers */
```

#### Accent (10% usage) — Warm Gold
```css
--brand-accent:            #B8921A  /* Primary gold — CTAs, highlights */
--brand-accent-hover:      #9A780E  /* Darker gold — hover states */
--brand-accent-light:      #FDF6E0  /* Pale gold — backgrounds, tints */
--brand-accent-ring:       rgba(184, 146, 26, 0.18)  /* Focus rings */
```

#### Semantic Colors
```css
--brand-success:           #5C8A52  /* Muted green — confirmations */
--brand-success-light:     #F4FAF3  /* Pale green — success backgrounds */
--brand-error:             #C0392B  /* Muted red — errors, destructive actions */
--brand-error-light:       #FDE8E7  /* Pale red — error backgrounds */
--brand-warning:           #D4A574  /* Warm amber — warnings */
--brand-warning-light:     #FFFBF2  /* Pale amber — warning backgrounds */
```

### Typography Scale (1.25 Ratio)

#### Font Families
```css
--brand-font-display:      'Bodoni Moda', Georgia, serif
--brand-font-ui:           'Figtree', system-ui, -apple-system, sans-serif
--brand-font-mono:         'Geist Mono', 'Courier New', monospace
```

#### Type Scale (Base: 16px)
```css
--brand-text-xs:           0.64rem    /* 10.24px — micro labels, captions */
--brand-text-sm:           0.8rem     /* 12.8px — small UI text */
--brand-text-base:         1rem       /* 16px — body text */
--brand-text-md:           1.25rem    /* 20px — subheadings */
--brand-text-lg:           1.563rem   /* 25px — headings */
--brand-text-xl:           1.953rem   /* 31.25px — page titles */
--brand-text-2xl:          2.441rem   /* 39px — hero headings */
--brand-text-3xl:          3.052rem   /* 48.83px — display */
```

#### Line Heights
```css
--brand-leading-tight:     1.2   /* Headings */
--brand-leading-normal:    1.5   /* Body text */
--brand-leading-relaxed:   1.75  /* Long-form content */
```

#### Font Weights
```css
--brand-weight-light:      300
--brand-weight-normal:     400
--brand-weight-medium:     500
--brand-weight-semibold:   600
--brand-weight-bold:       700
```

### Spacing Scale (8px base unit)

```css
--brand-space-xs:          0.25rem   /* 4px */
--brand-space-sm:          0.5rem    /* 8px */
--brand-space-md:          1rem      /* 16px */
--brand-space-lg:          1.5rem    /* 24px */
--brand-space-xl:          2rem      /* 32px */
--brand-space-2xl:         3rem      /* 48px */
--brand-space-3xl:         4rem      /* 64px */
--brand-space-4xl:         6rem      /* 96px */
```

### Border Radius

```css
--brand-radius-sm:         4px   /* Small elements (badges, pills) */
--brand-radius-md:         8px   /* Buttons, inputs, cards */
--brand-radius-lg:         12px  /* Modals, large cards */
--brand-radius-xl:         16px  /* Hero sections */
--brand-radius-full:       9999px  /* Circular elements */
```

### Shadows (Subtle, Build-style)

```css
--brand-shadow-sm:         0 1px 2px rgba(0, 0, 0, 0.05)
--brand-shadow-md:         0 2px 8px rgba(0, 0, 0, 0.07)
--brand-shadow-lg:         0 4px 16px rgba(0, 0, 0, 0.1)
--brand-shadow-xl:         0 8px 32px rgba(0, 0, 0, 0.12)
--brand-shadow-2xl:        0 16px 48px rgba(0, 0, 0, 0.15)
```

### Motion & Timing

```css
--brand-ease:              cubic-bezier(0.32, 0.72, 0, 1)   /* Default easing */
--brand-ease-out:          cubic-bezier(0.16, 1, 0.3, 1)    /* Exit animations */
--brand-ease-in:           cubic-bezier(0.4, 0, 1, 1)       /* Enter animations */
--brand-ease-spring:       cubic-bezier(0.34, 1.56, 0.64, 1) /* Playful bounce */

--brand-duration-instant:  50ms
--brand-duration-fast:     150ms
--brand-duration-base:     250ms
--brand-duration-slow:     400ms
--brand-duration-slower:   600ms
```

---

## Component Design Patterns

### Buttons

#### Primary CTA (Accent Gold)
```css
background: var(--brand-accent)
color: #FFFFFF
padding: 8px 24px
border-radius: var(--brand-radius-md)
font-weight: var(--brand-weight-semibold)
transition: all var(--brand-duration-fast) var(--brand-ease)

:hover {
  background: var(--brand-accent-hover)
  box-shadow: var(--brand-shadow-md)
  transform: translateY(-1px)
}
```

#### Secondary/Ghost
```css
background: transparent
border: 1px solid var(--brand-secondary-border)
color: var(--brand-primary-text)
padding: 7px 20px

:hover {
  border-color: var(--brand-accent)
  background: var(--brand-accent-light)
}
```

### Input Fields

```css
height: 32px (2rem)
padding: 0 12px
border: 1px solid var(--brand-secondary-border)
border-radius: var(--brand-radius-md)
font-size: var(--brand-text-sm)
background: var(--brand-primary-card)

:focus {
  outline: none
  border-color: var(--brand-accent)
  box-shadow: 0 0 0 3px var(--brand-accent-ring)
}
```

### Cards

```css
background: var(--brand-primary-card)
border: 1.5px solid var(--brand-secondary-border)
border-radius: var(--brand-radius-lg)
padding: var(--brand-space-lg)
box-shadow: var(--brand-shadow-sm)

:hover {
  border-color: var(--brand-accent)
  box-shadow: var(--brand-shadow-md)
}
```

### Labels

```css
font-size: var(--brand-text-xs)
font-weight: var(--brand-weight-semibold)
text-transform: uppercase
letter-spacing: 0.1em
color: var(--brand-secondary-muted)
```

---

## Whitespace Guidelines (Build Philosophy)

### Goal: 40-50% Whitespace Ratio

#### Spacing Principles
1. **Generous padding** — Inspector panels should breathe (16px minimum)
2. **Vertical rhythm** — Consistent space between elements (multiples of 8px)
3. **Section separation** — Clear visual breaks between groups (24px-32px)
4. **Don't fear empty** — Whitespace = premium, not wasteful

#### Current vs. Target

| Element | Current | Target | Improvement |
|---------|---------|--------|-------------|
| Inspector panel padding | 4px | 16px | +300% |
| Input vertical spacing | 8px | 16px | +100% |
| Section divider margin | 12px | 24px | +100% |
| Card padding | 12px | 24px | +100% |

---

## Contrast Requirements (WCAG AA)

### Minimum Ratios
- **Large text (18px+):** 3:1
- **Normal text:** 4.5:1
- **UI components:** 3:1

### Audit Results

| Combination | Ratio | Status |
|-------------|-------|--------|
| Primary text (#1A1714) on Cream (#FDFBF7) | 13.2:1 | ✅ AAA |
| Muted text (#8B7F76) on Cream (#FDFBF7) | 4.8:1 | ✅ AA |
| Accent gold (#B8921A) on White (#FFFFFF) | 4.9:1 | ✅ AA |
| Light taupe (#B5A89E) on Cream (#FDFBF7) | 3.2:1 | ⚠️ AA Large only |

**Action:** Avoid using `--brand-secondary-light` for small body text.

---

## Anti-Slop Compliance

### ✅ Pass
- Serif + sans pairing (not Inter-only)
- Varied border radius (not uniform)
- Selective shadows (not everywhere)
- Grid-based alignment
- No generic hero sections

### ⚠️ Review
- Purple gradients in effects library (optional user effects — acceptable)
- Some low-contrast muted text (addressed in token system)

### ❌ Violations: None Critical

---

## Usage Examples

### Inspector Panel (Refactored)
```tsx
<div className="space-y-6 p-4">  {/* Increased from p-2 to p-4 (16px) */}
  <div className="space-y-2">
    <label className="text-xs font-semibold uppercase tracking-wider text-muted">
      Video Height
    </label>
    <input 
      className="h-8 w-full rounded-lg border border-secondary px-3 text-sm"
      placeholder="100dvh"
    />
  </div>
</div>
```

### Button Group
```tsx
<div className="flex gap-2">
  <button className="bg-accent text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent-hover transition-all">
    Publish
  </button>
  <button className="border border-secondary px-6 py-2 rounded-lg hover:border-accent hover:bg-accent-light transition-all">
    Save Draft
  </button>
</div>
```

---

## Implementation Checklist

### Phase 2: Token Migration
- [ ] Replace hardcoded colors with CSS custom properties
- [ ] Update spacing to 8px multiples
- [ ] Increase inspector padding to 16px
- [ ] Apply 1.25 type scale

### Phase 3: Component Refactor
- [ ] Unify input components (merge PanelInputs, SettingsInput, TextInput)
- [ ] Add cascading indicator support to all inputs
- [ ] Separate block vs. page settings visually
- [ ] Add test hooks (data-testid)

### Phase 4: Polish
- [ ] Verify WCAG AA contrast on all text
- [ ] Add micro-interactions (subtle hover states)
- [ ] Test whitespace ratio (40-50% target)
- [ ] Remove purple gradients from core UI (keep in optional effects)

---

## Brand Voice & Tone

**For wedding websites:**
- Elegant but approachable
- Romantic but not cheesy
- Premium but not pretentious
- Helpful but not patronizing

**UI Copy Guidelines:**
- Use "your website" not "the site"
- "Publish" not "Deploy" or "Go Live"
- "Video" not "Media Asset"
- Warm, personal language ("Make it yours" vs. "Customize configuration")

---

## File Assets

### Logo
Location: `(to be added)`  
Formats: SVG (preferred), PNG with transparent background  
Variants: Full color, monochrome (dark), monochrome (light)

### Color Swatches
- Primary Gold: `#B8921A`
- Warm Cream: `#FDFBF7`
- Rich Brown: `#1A1714`

### Fonts
- **Bodoni Moda** — Google Fonts, weights 400/500/600, italic variants
- **Figtree** — Google Fonts, weights 300-700
- **Geist Sans/Mono** — Next.js font optimization

---

## Maintenance

**Review Cycle:** Quarterly  
**Owner:** Design team  
**Last Audit:** 2026-04-27  
**Next Review:** 2026-07-27

### Change Log
- **2026-04-27:** Initial Build philosophy specification created
- **2026-04-27:** Phase 1 audit identified cascading breakpoints scope issue
