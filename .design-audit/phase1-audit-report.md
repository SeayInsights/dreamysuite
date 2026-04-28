# DreamySuite Design Audit — Phase 1
**Date:** 2026-04-27  
**Design Philosophy:** Build (Contemporary Minimalism)  
**Auditor:** dream-studio:design

---

## Executive Summary

### Current State Assessment
DreamySuite has **solid design foundations** but suffers from **component architecture issues** that make debugging difficult. The cascading breakpoints feature (PR #139) is correctly implemented but **not visible in expected locations**.

### Key Findings
✅ **Design System Strengths:**
- Modern serif + sans pairing (Bodoni Moda + Figtree) — already Build-aligned
- Consistent brand tokens (warm gold #B8921A, cream surfaces)
- oklch() color format (perceptually uniform)
- Design tokens properly defined in CSS custom properties

❌ **Critical Issues:**
1. **Cascading Breakpoints Not Visible** — Feature exists but only works in Content tab for block-specific properties, NOT in Layout/Style tabs (which edit page-level settings)
2. **Inconsistent Input Components** — Three different input component patterns across tabs
3. **Component Boundary Confusion** — Block vs. Page settings not clearly separated

---

## Anti-Slop Audit Results

| Rule | Status | Evidence |
|------|--------|----------|
| No purple gradients | ⚠️ WARN | 39 files with purple/lavender colors in effects library |
| No centered-everything | ✅ PASS | Proper grid/flex layouts throughout |
| No uniform border-radius | ✅ PASS | Varied radius values (4px-12px) |
| No Inter-only typography | ✅ PASS | Bodoni Moda + Figtree pairing |
| No generic hero sections | ✅ PASS | Custom wedding-focused layouts |
| No drop shadows everywhere | ✅ PASS | Selective shadow usage |
| No low-contrast gray text | ⚠️ WARN | Some muted text at #8B7F76 (check contrast ratio) |

**Purple gradient locations:** Primarily in `lib/effects/` — decorative background effects (Plasma, LiquidEther, Beams, etc.). These are optional user-selectable effects, not core UI.

---

## Cascading Breakpoints: Why It's Not Visible

### Root Cause Analysis

**Expected behavior:** Orange dots (🟠) and reset buttons (⟲) should appear next to properties when editing on tablet/mobile breakpoints.

**Actual behavior:** Not visible in Layout or Style tabs.

**Why:**
1. **Layout Tab** edits **page-level settings** (`settings.marginTop`, `settings.sectionSpacing`) using custom `SettingsInput` component
2. **Style Tab** edits **page-level settings** (`settings.bgColor`, `settings.bgImage`) using direct inputs
3. **Content Tab** edits **block-level properties** (`block.config.height`, `block.config.url`) using `BlockContentPanel` → `PanelInputs`

**The cascading breakpoints feature ONLY applies to block-level properties**, not page-level settings.

### Component Architecture Problem

```
Inspector
├── ContentTab (Info)
│   ├── Page Settings Form (custom TextInput — NO cascade support)
│   └── BlockContentPanel (when block selected)
│       └── [BlockType]Editor (VideoEditor, GalleryEditor, etc.)
│           └── PanelInputs (✅ HAS cascade support)
│
├── LayoutTab
│   └── SettingsInput (custom component — NO cascade support)
│
└── StyleTab
    └── Direct inputs (— NO cascade support)
```

### User Experience Gap

Users expect cascading breakpoints to work everywhere, but the feature is **siloed** to Content tab → Block editors. This creates confusion:

- ❌ "Why don't my page margins cascade from desktop to tablet?"
- ❌ "Why doesn't background color have an orange dot override indicator?"

**Design Decision Required:** Should page-level settings ALSO support breakpoint overrides, or should we clarify that only block properties cascade?

---

## Visual Design Principles Audit

### Contrast ✅ GOOD
- Clear visual hierarchy through size/weight/color
- Gold accent (#B8921A) provides strong contrast against cream backgrounds

### Whitespace ⚠️ NEEDS IMPROVEMENT
- Inspector panels feel **cramped** (4px padding, tight line-height)
- Recommendation: Increase to 40-50% whitespace ratio per Build philosophy

### Alignment ✅ GOOD
- Grid-based layouts throughout
- Consistent use of Flexbox and CSS Grid

### Typography ✅ EXCELLENT
- Bodoni Moda (display serif) + Figtree (UI sans) — premium pairing
- Clear size scale, though could benefit from 1.25 ratio formalization

### Color ⚠️ NEEDS REFINEMENT
- Current: Gold accent + cream backgrounds + brown text (warm, luxurious)
- Build philosophy: Needs clearer 60/30/10 distribution
- Recommendation: Define primary (60%), secondary (30%), accent (10%) token allocation

---

## Component Clarity Issues (Debugging Obstacles)

### Issue 1: Three Input Component Patterns

| Component | Used In | Props | Cascade Support |
|-----------|---------|-------|-----------------|
| `PanelInputs` (PanelTextInput, etc.) | BlockContentPanel editors | block, breakpoint, propertyName, updateBlock | ✅ YES |
| Custom `SettingsInput` | LayoutTab | label, value, onChange, placeholder, unit | ❌ NO |
| Custom `TextInput`/`TextArea` | ContentTab page settings | label, value, onChange, placeholder, maxLength | ❌ NO |

**Problem:** Developers can't predict which input to use. No clear pattern.

**Solution:** Unify under a single input system with clear props API.

### Issue 2: Block vs. Page Settings Not Separated

ContentTab mixes page-level and block-level editing in the same component (401-line file). This creates:
- Harder to test (tangled concerns)
- Harder to debug (which state slice is this editing?)
- Inconsistent UX (some fields cascade, others don't)

**Solution:** Split into `PageSettingsPanel` and `BlockContentPanel` components.

### Issue 3: No Test Hooks

Components lack `data-testid` attributes or clear component boundaries for E2E testing. This makes verifying cascading breakpoints behavior difficult.

**Solution:** Add test identifiers to inspector panels and inputs.

---

## Recommended Actions — Phase 2

### Immediate Fixes (High Priority)
1. **Document Cascading Scope** — Add tooltip/help text explaining that cascading only applies to block properties, not page settings
2. **Visual Separation** — Clearly distinguish block vs. page settings in UI (borders, headers, icons)
3. **Unify Input Components** — Create single `FormInput` component that supports both page and block modes

### Design Refinement (Medium Priority)
4. **Increase Whitespace** — Expand inspector panel padding from 4px → 16px, line-height to 1.5
5. **Formalize 60/30/10 Color** — Define clear primary/secondary/accent token allocation
6. **Add Test Hooks** — data-testid attributes on all interactive elements

### Long-Term Improvements (Low Priority)
7. **Extend Cascading to Page Settings?** — Consider if page margins/backgrounds should also support breakpoint overrides
8. **Contrast Audit** — Verify all text meets WCAG AA (4.5:1) against backgrounds
9. **Remove Purple Effects** — Replace purple gradients in effects library with Build-aligned palettes

---

## Build Philosophy Alignment Score: 7.5/10

**Strong:**
- ✅ Serif + sans pairing (premium feel)
- ✅ Refined color palette (warm, luxury)
- ✅ Subtle details (easing, transitions)
- ✅ Modern technical foundation (oklch, CSS custom properties)

**Needs Improvement:**
- ❌ Whitespace ratio (currently 20-30%, should be 40-50%)
- ❌ Component clarity (inconsistent input patterns)
- ❌ Visual hierarchy in inspector (feels cramped)

**Blocking Issues:**
- ❌ Cascading breakpoints confusion (scope not clear to users)
- ❌ Component architecture (makes debugging hard)

---

## Next Steps → Phase 2

1. Create `brand-spec.md` with Build-inspired token system
2. Design unified input component system
3. Refactor inspector tabs for clarity
4. Add visual separators for block vs. page settings
5. Test cascading breakpoints with clear documentation

**Estimated Effort:** 2-3 days for Phase 2-4 refactor.
