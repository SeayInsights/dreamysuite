# Phase 3: Systematic Refactor Plan
**Target:** Apply Build philosophy tokens and fix cascading breakpoints UX  
**Estimated Duration:** 2-3 days  
**Priority:** High (blocks user debugging)

---

## Problem Statement

The cascading breakpoints feature (PR #139) is **correctly implemented** but suffers from:
1. **Scope confusion** — Users expect it everywhere, but it only works for block properties
2. **Component inconsistency** — Three different input patterns across tabs
3. **Poor debuggability** — Tangled concerns, no test hooks, cramped UI

**Root Cause:** Component architecture prioritized rapid feature addition over systematic design.

---

## Refactor Goals

###1. **Clarify cascading scope** — Users understand what cascades and what doesn't
2. **Unify input components** — Single, predictable input API
3. **Improve debuggability** — Clear boundaries, test hooks, better spacing
4. **Apply Build tokens** — Consistent design language throughout

---

## Tasks Breakdown

### Task 1: Create Unified Input System (3-4 hours)

**File:** `src/app/(dashboard)/sites/[id]/editor-v2/inspector/FormInput.tsx`

Create single input component that supports:
- **Mode:** `"block"` (cascading) or `"page"` (global)
- **Type:** `"text"`, `"textarea"`, `"select"`, `"date"`, `"time"`, `"color"`, `"range"`
- **Cascade props:** `block`, `breakpoint`, `propertyName`, `updateBlock` (optional, only for block mode)

```tsx
interface FormInputProps {
  mode: "block" | "page"
  type: "text" | "textarea" | "select" | "date" | "time"
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  
  // Block mode only (for cascading)
  block?: Block
  breakpoint?: "desktop" | "tablet" | "mobile"
  propertyName?: string
  updateBlock?: (id: string, updates: Partial<Block>) => void
  
  // Optional
  options?: { value: string; label: string }[]  // For select
  maxLength?: number
  disabled?: boolean
}
```

**Benefits:**
- Single source of truth for input styling
- Cascading support baked in
- Easy to test
- Consistent spacing/typography

---

### Task 2: Refactor ContentTab (2-3 hours)

**Files:**
- `src/app/(dashboard)/sites/[id]/editor-v2/inspector/ContentTab.tsx`
- `src/app/(dashboard)/sites/[id]/editor-v2/inspector/PageSettingsPanel.tsx` (new)

**Split into two clear components:**

#### PageSettingsPanel.tsx
```tsx
export function PageSettingsPanel() {
  // All page-level settings (event name, date, location, etc.)
  // Uses FormInput with mode="page"
  // NO cascading support (global settings)
}
```

#### BlockContentPanel.tsx (already exists, keep as-is)
```tsx
export function BlockContentPanel({ block, updateBlock }) {
  // Block-specific editors
  // Uses FormInput with mode="block"
  // HAS cascading support
}
```

#### ContentTab.tsx (orchestrator)
```tsx
export function ContentTab() {
  const selectedBlock = ...
  
  if (selectedBlock) {
    return (
      <div>
        <BackButton />
        <BlockContentPanel block={selectedBlock} updateBlock={updateBlock} />
      </div>
    )
  }
  
  return <PageSettingsPanel />
}
```

**Benefits:**
- Clear separation of concerns
- Easier to test each panel independently
- Users understand: "Page settings don't cascade, block settings do"

---

### Task 3: Update Block Editors to Use FormInput (3-4 hours)

**Files:** All files in `src/app/(dashboard)/sites/[id]/editor-v2/inspector/editors/`
- VideoEditor.tsx
- GalleryEditor.tsx
- CountdownEditor.tsx
- ScheduleEditor.tsx
- ContentCardEditor.tsx
- VenueMapEditor.tsx
- RegistryEditor.tsx

**Changes:**
Replace `PanelTextInput`, `PanelSelectInput` with new `FormInput`:

```tsx
// Before
<PanelTextInput
  label="Height"
  value={height}
  onChange={(v) => updateConfig({ height: v })}
  block={block}
  breakpoint={breakpoint}
  propertyName="height"
  updateBlock={updateBlock}
/>

// After
<FormInput
  mode="block"
  type="text"
  label="Height"
  value={height}
  onChange={(v) => updateConfig({ height: v })}
  block={block}
  breakpoint={breakpoint}
  propertyName="height"
  updateBlock={updateBlock}
/>
```

**Benefits:**
- Consistent API
- Future-proof (all editors use same component)
- Easy to add new input types (color picker, range slider, etc.)

---

### Task 4: Update LayoutTab to Use FormInput (1-2 hours)

**File:** `src/app/(dashboard)/sites/[id]/editor-v2/inspector/LayoutTab.tsx`

Replace custom `SettingsInput` with `FormInput`:

```tsx
// Before
<SettingsInput
  label="Top"
  value={settings.marginTop}
  onChange={(v) => updateSettings({ marginTop: v })}
/>

// After
<FormInput
  mode="page"
  type="text"
  label="Top Margin"
  value={settings.marginTop ?? ""}
  onChange={(v) => updateSettings({ marginTop: v || null })}
  placeholder="auto"
  unit="px"
/>
```

**Add help text:**
```tsx
<p className="text-xs text-muted-foreground mt-1">
  Page margins apply globally and do not cascade between breakpoints.
</p>
```

---

### Task 5: Update StyleTab to Use FormInput (1-2 hours)

**File:** `src/app/(dashboard)/sites/[id]/editor-v2/inspector/StyleTab.tsx`

Replace direct inputs with `FormInput`. Add help text explaining that page-level styles are global.

---

### Task 6: Apply Build Tokens — Spacing (2-3 hours)

**Files:** All inspector components

**Changes:**
- Increase inspector panel padding: `p-2` → `p-4` (8px → 16px)
- Increase vertical spacing: `space-y-2` → `space-y-4` (8px → 16px)
- Increase input spacing: `gap-2` → `gap-3` (8px → 12px)
- Add section dividers with proper margin: `border-t border-border pt-6`

**Before:**
```tsx
<div className="space-y-2 p-2">
  <FormInput label="Height" ... />
  <FormInput label="Width" ... />
</div>
```

**After:**
```tsx
<div className="space-y-4 p-4">
  <FormInput label="Height" ... />
  <FormInput label="Width" ... />
</div>
```

**Target:** 40-50% whitespace ratio (Build philosophy)

---

### Task 7: Apply Build Tokens — Typography (1-2 hours)

**Files:** All labels, headings in inspector

**Changes:**
- Label font size: `text-[10px]` → `text-xs` (10.24px → 12px)
- Label letter-spacing: `tracking-wider` → `tracking-wide` (reduce from 0.1em to 0.05em)
- Add line-height: `leading-normal` (1.5) for better readability

```css
/* Before */
.label {
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* After */
.label {
  font-size: 12px;  /* var(--brand-text-xs) */
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1.5;
}
```

---

### Task 8: Add Test Hooks (1 hour)

**Files:** All interactive elements

Add `data-testid` attributes:

```tsx
<FormInput
  data-testid="block-height-input"
  label="Height"
  ...
/>

<button
  data-testid="reset-cascade-button"
  onClick={handleReset}
>
  ⟲
</button>

<div data-testid="override-indicator" className="...">
  🟠
</div>
```

**Benefits:**
- E2E testing becomes straightforward
- Can verify cascading breakpoints behavior programmatically
- Debugging: easy to identify elements in DevTools

---

### Task 9: Visual Separation — Block vs. Page Settings (1 hour)

**Files:** ContentTab, LayoutTab, StyleTab

Add clear visual indicators:

```tsx
// Page Settings Section
<div className="border-l-4 border-blue-500 pl-4 bg-blue-50/50 p-4 rounded-lg">
  <div className="flex items-center gap-2 mb-2">
    <Globe className="h-4 w-4 text-blue-600" />
    <h3 className="text-sm font-semibold">Page Settings</h3>
  </div>
  <p className="text-xs text-muted-foreground mb-4">
    Global settings that apply to the entire page (no breakpoint cascading)
  </p>
  <PageSettingsPanel />
</div>

// Block Settings Section
<div className="border-l-4 border-accent pl-4 bg-accent-light/50 p-4 rounded-lg">
  <div className="flex items-center gap-2 mb-2">
    <Box className="h-4 w-4 text-accent" />
    <h3 className="text-sm font-semibold">Block Settings</h3>
  </div>
  <p className="text-xs text-muted-foreground mb-4">
    Block-specific settings with breakpoint cascading support
  </p>
  <BlockContentPanel />
</div>
```

**Icons:**
- 🌐 Globe = Page-level (global)
- 📦 Box = Block-level (cascading)
- 🟠 Orange dot = Override indicator

---

### Task 10: Documentation & Help Text (1 hour)

Add tooltips and help text throughout:

```tsx
<FormInput
  label="Height"
  helpText="CSS value (e.g., 100dvh, 600px). Desktop → tablet → mobile cascading."
  ...
/>

<Tooltip content="This property cascades from desktop to tablet/mobile unless explicitly overridden">
  <InfoIcon className="h-3 w-3 text-muted-foreground" />
</Tooltip>

{isOverridden && (
  <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
    <span>🟠</span>
    <span>Overridden from {breakpoint === "mobile" ? "tablet/desktop" : "desktop"}</span>
    <button className="underline" onClick={handleReset}>Reset</button>
  </div>
)}
```

---

## Testing Plan

### Manual Testing Checklist

**Cascading Breakpoints:**
- [ ] Select video block on desktop, set height to "80vh"
- [ ] Switch to tablet, verify height shows "80vh" (cascaded)
- [ ] On tablet, change height to "60vh"
- [ ] Verify orange dot 🟠 appears next to "Height" label
- [ ] Hover orange dot, verify tooltip shows "Overridden from desktop"
- [ ] Click reset button ⟲
- [ ] Verify height reverts to "80vh" and orange dot disappears
- [ ] Switch to desktop, change height to "100dvh"
- [ ] Switch back to tablet, verify height now shows "100dvh" (cascade updated)

**Page Settings:**
- [ ] Go to Layout tab
- [ ] Change "Top Margin" to "20px"
- [ ] Switch breakpoints (desktop → tablet → mobile)
- [ ] Verify margin value does NOT change (no cascading)
- [ ] Verify NO orange dots appear (expected behavior)

**Visual Spacing:**
- [ ] Measure inspector padding (should be 16px)
- [ ] Measure input vertical spacing (should be 16px)
- [ ] Estimate whitespace ratio (should feel ~40-50%)

### Automated Testing (Future)

```tsx
describe("Cascading Breakpoints", () => {
  it("shows override indicator on tablet when value differs from desktop", () => {
    // Select block, set desktop height to "80vh"
    // Switch to tablet, set height to "60vh"
    // Assert: data-testid="override-indicator" is visible
  })
  
  it("resets to cascaded value when reset button clicked", () => {
    // Setup: tablet override exists
    // Click: data-testid="reset-cascade-button"
    // Assert: value reverts to desktop value
    // Assert: override indicator disappears
  })
})
```

---

## Rollback Plan

If refactor causes regressions:

1. **Revert commit:** `git revert <commit-sha>`
2. **Isolate failure:** Identify which task caused the issue
3. **Fix forward:** Address specific problem, don't abandon entire refactor
4. **Test in isolation:** Use feature branch, test each task independently

---

## Success Metrics

### User Experience
- ✅ Users understand cascading scope (block vs. page)
- ✅ Orange dots and reset buttons work consistently
- ✅ Inspector feels more spacious, less cramped
- ✅ Debugging is easier (clear component boundaries)

### Code Quality
- ✅ Single input component (DRY principle)
- ✅ Separation of concerns (page vs. block panels)
- ✅ Test hooks present (data-testid)
- ✅ Build tokens applied consistently

### Design
- ✅ 40-50% whitespace ratio achieved
- ✅ Typography scale (1.25 ratio) applied
- ✅ Contrast ratios meet WCAG AA
- ✅ Micro-interactions smooth (transitions, hover states)

---

## Timeline

### Day 1
- Task 1: Create FormInput component (4 hours)
- Task 2: Refactor ContentTab (3 hours)
- Task 3: Update 2-3 block editors (1 hour)

### Day 2
- Task 3: Finish remaining block editors (3 hours)
- Task 4: Update LayoutTab (2 hours)
- Task 5: Update StyleTab (2 hours)
- Task 8: Add test hooks (1 hour)

### Day 3
- Task 6: Apply spacing tokens (3 hours)
- Task 7: Apply typography tokens (2 hours)
- Task 9: Visual separation (1 hour)
- Task 10: Documentation (1 hour)
- Manual testing (1 hour)

**Total:** ~24 hours (~3 days)

---

## Dependencies

- None — can start immediately
- All changes are frontend-only (no API or database changes)
- No breaking changes to user data

---

## Next Phase: Phase 4 (Polish & Verification)

After refactor complete:
1. Full regression testing
2. Contrast audit (WCAG compliance)
3. Performance check (no layout thrashing)
4. Purple gradient removal (optional effects library)
5. User acceptance testing
