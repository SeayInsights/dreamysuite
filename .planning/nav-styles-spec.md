# Custom Premium Nav Styles — Spec

## Problem
The ReactBits nav-style components (PillNav, GooeyNav, Dock, BubbleMenu, etc.) don't render in the editor canvas. They have incompatible APIs, inject conflicting CSS, and require container contexts the editor doesn't provide. The user finds them low-quality compared to the rest of the site.

## Chosen Approach
Build 6 custom nav-style components using inline styles + `motion` v12 (already installed). Each component is a self-contained `.tsx` file in `src/lib/effects/components/nav/`. Spring physics, layout morphing, and staggered animations via motion. Dynamic theming via inline styles using editor theme tokens.

## Shared API (all 6 components)

```ts
interface NavStyleProps {
  items: Array<{
    label: string;
    href: string;
    icon: string;        // first letter uppercase
    onClick?: (e?: React.MouseEvent) => void;
    color: string;       // accent color
    isActive?: boolean;  // set by NavPreview for current page
  }>;
  logo: string;          // SVG data URI (initials circle)
  logoAlt: string;       // initials text
  accent: string;        // navHighlightColor or theme primary
  bg: string;            // navBg
  textColor: string;     // navLinkColor
  brandColor: string;    // navBrandColor
  headingFont: string;   // theme heading font
  bodyFont: string;      // theme body font
  brandName: string;     // eventName
}
```

NavPreview.tsx will be updated to pass this full props object instead of the current minimal `items` + `logo` + `logoAlt`.

## The 6 Styles

### 1. Glass Dropdown (`glass-dropdown`)
- Layout: Brand/logo LEFT, hamburger icon RIGHT
- Interaction: Hover hamburger → frosted glass panel slides down with staggered item reveals
- Glass: `backdrop-filter: blur(16px) saturate(1.4)`, translucent white bg, layered inset shadows, subtle border
- Hamburger: 3-line icon that morphs to X when open (motion spring)
- Dropdown: `AnimatePresence` with staggered `motion.div` per item, slide from y:-10 to y:0
- Close: mouse leaves the dropdown area

### 2. Glass Slide (`glass-slide`)
- Layout: Brand left, items inline right-of-brand
- Key feature: Animated pill indicator behind active/hovered item
- Implementation: `motion.div` with `layoutId="nav-indicator"` for the pill — springs between positions automatically
- Glass: Frosted bar with blur, the pill indicator is a slightly brighter glass surface
- Hover: Pill follows hovered item; snaps back to active on mouse leave

### 3. Glass Morph (`glass-morph`)
- Layout: Centered nav container (pill shape)
- Key feature: Chromatic edge shimmer via animated gradient border
- Glass: Multi-layered box shadows (outer soft + inset bright), high saturation backdrop-filter
- Shimmer: CSS `@keyframes` gradient rotation on a pseudo-border (done via wrapper div + background gradient)
- Active item: Text color shifts to accent, subtle text-shadow glow

### 4. Glow Nav (`glow-nav`)
- Layout: Brand left, items inline
- Key feature: Soft luminous glow orb behind active item
- Implementation: `motion.div` with absolute positioning, `layoutId="glow"`, gaussian blur via `filter: blur(20px)`, accent color at 40% opacity
- Background: Dark base (`navBg` or dark fallback)
- Hover: Glow follows cursor to hovered item with spring

### 5. Magnetic Hover (`magnetic-hover`)
- Layout: Brand left, items inline, clean and minimal
- Key feature: Items scale up (1.08x) on hover with spring, active item has subtle lift (translateY -2px + shadow)
- Implementation: Each item is `motion.button` with `whileHover={{ scale: 1.08 }}` and spring transition
- Active: Permanent slight elevation + accent underline
- Clean: No glass, no glow — pure typography and motion

### 6. Minimal Fade (`minimal-fade`)
- Layout: Brand left, items inline, maximum whitespace
- Key feature: On page switch, items cross-fade with staggered timing
- Implementation: `AnimatePresence` mode="wait" with opacity transition, 50ms stagger delay per item
- Style: Hairline bottom border, active item bold + accent color, everything else fades to muted
- Ultra-clean: No background effects, just elegant typography

## Scope

### In
- 6 new nav-style components
- Updated NavPreview.tsx to pass full props
- Updated registry.ts to point to new component names
- Remove ReactBits nav-style component files (BubbleMenu, CardNav, Dock, FlowingMenu, GlassIcons, GooeyNav, InfiniteMenu, PillNav, StaggeredMenu)
- Keep non-nav components in nav/ dir (Counter, ElasticSlider, Lanyard, ModelViewer, Stepper — these are "decoration" category)

### Out
- Public site nav-style rendering (separate task — route.ts loader)
- EffectPicker dropdown width bug (separate fix)
- New nav settings UI in NavigationTray

## Dependencies
- `motion` v12 (already installed)
- Existing theme tokens from editorStore
- Existing loader.ts + registry.ts infrastructure

## Risk Flags
- Glass Dropdown hover-to-open needs careful UX — must not close when moving mouse from hamburger to dropdown panel (use a shared hover zone or delay)
- Glass Morph chromatic shimmer may need fallback for Safari (test backdrop-filter support)
- layoutId animations require items to be in same motion tree — verify the shared layout context works inside NavPreview's wrapper div

## File Map
```
src/lib/effects/components/nav/
  GlassDropdown.tsx    (new)
  GlassSlide.tsx       (new)
  GlassMorph.tsx       (new)
  GlowNav.tsx          (new)
  MagneticHover.tsx    (new)
  MinimalFade.tsx      (new)
  Counter.tsx          (keep — decoration)
  ElasticSlider.tsx    (keep — decoration)
  Lanyard.tsx          (keep — decoration)
  ModelViewer.tsx      (keep — decoration)
  Stepper.tsx          (keep — decoration)
  BubbleMenu.tsx       (delete)
  CardNav.tsx          (delete)
  Dock.tsx             (delete)
  FlowingMenu.tsx      (delete)
  GlassIcons.tsx       (delete)
  GooeyNav.tsx         (delete)
  InfiniteMenu.tsx     (delete)
  PillNav.tsx          (delete)
  StaggeredMenu.tsx    (delete)
```
