# Plan: Custom Premium Nav Styles
Spec: `.planning/nav-styles-spec.md`
Date: 2026-04-18

## Tasks

### 1. Define shared NavStyleProps type + update NavPreview.tsx
- Files: `src/lib/effects/types.ts`, `src/app/(dashboard)/sites/[id]/editor-v2/NavPreview.tsx`
- Depends on: none
- Acceptance: NavStyleProps interface exported from types.ts. NavPreview passes full props object (items with isActive, accent, bg, textColor, brandColor, headingFont, bodyFont, brandName, logo, logoAlt) to the nav-style effect component. Existing default nav rendering unchanged.

### 2. Build GlassDropdown component
- Files: `src/lib/effects/components/nav/GlassDropdown.tsx`
- Depends on: 1
- Acceptance: Brand/logo left, hamburger right. Hovering hamburger opens frosted glass dropdown with staggered item reveals. Hamburger morphs to X when open. Mouse-leave closes. Uses motion for spring animations. Accepts NavStyleProps.

### 3. Build GlassSlide component
- Files: `src/lib/effects/components/nav/GlassSlide.tsx`
- Depends on: 1
- Acceptance: Brand left, items inline. Frosted glass bar. Pill indicator with layoutId springs between active/hovered items. Pill snaps back to active on mouse leave. Accepts NavStyleProps.

### 4. Build GlassMorph component
- Files: `src/lib/effects/components/nav/GlassMorph.tsx`
- Depends on: 1
- Acceptance: Centered pill container. Multi-layered glass shadows. Animated gradient border shimmer via CSS keyframes. Active item shows accent color + subtle glow. Accepts NavStyleProps.

### 5. Build GlowNav component
- Files: `src/lib/effects/components/nav/GlowNav.tsx`
- Depends on: 1
- Acceptance: Brand left, items inline, dark base. Soft blurred glow orb (accent color, 40% opacity) behind active item. Glow follows hover with spring via layoutId. Accepts NavStyleProps.

### 6. Build MagneticHover component
- Files: `src/lib/effects/components/nav/MagneticHover.tsx`
- Depends on: 1
- Acceptance: Brand left, items inline, clean/minimal. Items spring-scale to 1.08x on hover. Active item has translateY -2px + shadow + accent underline. No glass/glow effects. Accepts NavStyleProps.

### 7. Build MinimalFade component
- Files: `src/lib/effects/components/nav/MinimalFade.tsx`
- Depends on: 1
- Acceptance: Brand left, items inline, max whitespace. Hairline bottom border. Active item bold + accent. Items cross-fade with stagger on page switch. Ultra-clean typography. Accepts NavStyleProps.

### 8. Update registry + delete old components
- Files: `src/lib/effects/registry.ts`, delete 9 ReactBits nav files
- Depends on: 2, 3, 4, 5, 6, 7
- Acceptance: Registry has 6 nav-style entries pointing to new component names (GlassDropdown, GlassSlide, GlassMorph, GlowNav, MagneticHover, MinimalFade). Old files deleted (BubbleMenu, CardNav, Dock, FlowingMenu, GlassIcons, GooeyNav, InfiniteMenu, PillNav, StaggeredMenu). Non-nav files (Counter, ElasticSlider, Lanyard, ModelViewer, Stepper) untouched. presets.ts updated if it references old nav-style IDs.

### 9. Verify in editor
- Files: none (testing only)
- Depends on: 8
- Acceptance: Dev server runs. Each nav style renders in editor canvas when selected. No console errors. Switching between styles works. Items are clickable and switch pages.

## Parallel Opportunities
- Tasks 2-7 (all 6 components) can run in parallel after task 1
- Task 8 runs after all components are built
- Task 9 is the final gate

## Summary
| # | Task | Depends on | Complexity |
|---|------|-----------|------------|
| 1 | NavStyleProps type + NavPreview update | none | low |
| 2 | GlassDropdown | 1 | high |
| 3 | GlassSlide | 1 | medium |
| 4 | GlassMorph | 1 | medium |
| 5 | GlowNav | 1 | medium |
| 6 | MagneticHover | 1 | low |
| 7 | MinimalFade | 1 | low |
| 8 | Registry update + cleanup | 2-7 | low |
| 9 | Verify in editor | 8 | low |
