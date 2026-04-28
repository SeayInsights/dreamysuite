# Editor State Management

Comprehensive state management for DreamySuite editor using Zustand with sliced composition.

---

## Architecture Overview

### Single Store, Multiple Slices

```typescript
useEditorStore = create()(
  temporal(  // Zundo middleware for undo/redo
    (...a) => ({
      ...createDocumentSlice(...a),      // Blocks, pages [TRACKED]
      ...createEditorShellSlice(...a),   // UI state [NOT TRACKED]
      ...createTransientSlice(...a),     // Drag/hover [NOT TRACKED]
      ...createSettingsSlice(...a),      // Site settings [TRACKED]
      ...createTranslationSlice(...a),   // i18n [NOT TRACKED]
      ...createThemeSlice(...a),         // Theme tokens [NOT TRACKED]
    }),
    {
      partialize: (state) => ({ blocks: state.blocks, settings: state.settings }),
      equality: (past, current) => past.blocks === current.blocks && past.settings === current.settings,
    },
  ),
);
```

###Benefits

**Centralized State:**
- Single source of truth for editor
- All state accessible from one store
- Eliminates prop drilling

**Sliced for Maintainability:**
- Each slice handles one concern
- Easy to find/modify state logic
- Clear separation of responsibilities

**Selective Undo/Redo:**
- Only document + settings tracked by Zundo
- UI state changes (panel open/close) don't create history entries
- Undo rolls back content, not UI state

**Page-Scoped History:**
- Each page has independent undo/redo stack
- Switching pages swaps history
- No accidental cross-page undo

---

## Slices

### 1. Document Slice [TRACKED by Zundo]

**File:** `slices/document.ts`  
**Purpose:** Core document data (blocks, pages)  
**Tracked:** ✅ Yes (undo/redo enabled)

#### State

```typescript
interface DocumentSlice {
  // Data
  blocks: Block[];
  pages: Page[];
  currentPageId: string | null;
  
  // Flags
  isDirty: boolean;  // Unsaved changes
  
  // Actions
  setBlocks: (blocks: Block[]) => void;
  addBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  reorderBlocks: (blockIds: string[]) => void;
  
  setPages: (pages: Page[]) => void;
  setCurrentPageId: (id: string | null) => void;
  
  markDirty: () => void;
  markClean: () => void;
}
```

#### Usage

```typescript
import { useEditorStore } from "@/app/stores/editorStore";

function BlockEditor() {
  // Subscribe to specific state (efficient)
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  
  // Update block (creates undo history entry)
  const handleChange = (id: string, newConfig: any) => {
    updateBlock(id, { config: newConfig });
  };
  
  return <div>{/* ... */}</div>;
}
```

#### When to Use
- ✅ Modifying blocks/pages
- ✅ Reordering content
- ✅ Managing document structure
- ✅ Triggering save indicators

---

### 2. Editor Shell Slice [NOT TRACKED]

**File:** `slices/editorShell.ts`  
**Purpose:** Editor UI state (selection, breakpoint, mode, panels)  
**Tracked:** ❌ No (UI state shouldn't create undo entries)

#### State

```typescript
interface EditorShellSlice {
  // Selection
  selectedBlockId: string | null;
  selectedSection: Section | null;
  
  // View
  breakpoint: Breakpoint;  // mobile, tablet, desktop
  mode: EditorMode;        // edit, preview
  
  // Panels
  inspectorOpen: boolean;
  layersOpen: boolean;
  // ... other panel states
  
  // Actions
  selectBlock: (id: string | null) => void;
  selectSection: (section: Section | null) => void;
  setBreakpoint: (bp: Breakpoint) => void;
  setMode: (mode: EditorMode) => void;
  toggleInspector: () => void;
  // ...
}
```

#### Usage

```typescript
import { useEditorStore } from "@/app/stores/editorStore";

function BlockList() {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  
  return (
    <div>
      {blocks.map((block) => (
        <div
          key={block.id}
          onClick={() => selectBlock(block.id)}
          className={selectedBlockId === block.id ? "selected" : ""}
        >
          {block.type}
        </div>
      ))}
    </div>
  );
}
```

#### When to Use
- ✅ Selecting blocks/sections
- ✅ Toggling panels (inspector, layers)
- ✅ Switching breakpoints
- ✅ Changing editor mode

---

### 3. Transient Slice [NOT TRACKED]

**File:** `slices/transient.ts`  
**Purpose:** Ephemeral UI state (drag, hover, temporary overlays)  
**Tracked:** ❌ No (transient state never persisted)

#### State

```typescript
interface TransientSlice {
  // Drag state
  dragState: DragState | null;
  
  // Hover
  hoveredBlockId: string | null;
  
  // Actions
  setDragState: (state: DragState | null) => void;
  setHoveredBlockId: (id: string | null) => void;
}
```

#### Usage

```typescript
import { useEditorStore } from "@/app/stores/editorStore";

function DraggableBlock({ blockId }: { blockId: string }) {
  const setDragState = useEditorStore((s) => s.setDragState);
  
  const handleDragStart = (e: React.DragEvent) => {
    setDragState({
      blockId,
      startX: e.clientX,
      startY: e.clientY,
    });
  };
  
  return <div draggable onDragStart={handleDragStart}>...</div>;
}
```

#### When to Use
- ✅ Drag-and-drop state
- ✅ Hover effects (when shared across components)
- ✅ Temporary overlays
- ✅ Resize handles

---

### 4. Settings Slice [TRACKED by Zundo]

**File:** `slices/settings.ts`  
**Purpose:** Site settings (event name, date, colors, etc.)  
**Tracked:** ✅ Yes (undo/redo enabled)

#### State

```typescript
interface SettingsSlice {
  settings: SiteSettings;
  
  // Actions
  setSettings: (settings: Partial<SiteSettings>) => void;
  updateSetting: <K extends keyof SiteSettings>(
    key: K,
    value: SiteSettings[K]
  ) => void;
}
```

#### Usage

```typescript
import { useEditorStore } from "@/app/stores/editorStore";

function SettingsPanel() {
  const settings = useEditorStore((s) => s.settings);
  const updateSetting = useEditorStore((s) => s.updateSetting);
  
  return (
    <input
      value={settings.eventName || ""}
      onChange={(e) => updateSetting("eventName", e.target.value)}
    />
  );
}
```

#### When to Use
- ✅ Modifying site settings
- ✅ Changing event details
- ✅ Updating privacy settings
- ✅ Configuring domain/publishing

---

### 5. Translation Slice [NOT TRACKED]

**File:** `slices/translation.ts`  
**Purpose:** i18n state (active language, translations)  
**Tracked:** ❌ No (UI preference, not document content)

#### State

```typescript
interface TranslationSlice {
  activeLanguage: string | null;
  translations: Record<string, Record<string, string>>;
  
  // Actions
  setActiveLanguage: (lang: string | null) => void;
  setTranslations: (translations: Record<string, Record<string, string>>) => void;
}
```

#### When to Use
- ✅ Switching active language
- ✅ Managing translations
- ✅ i18n UI state

---

### 6. Theme Slice [NOT TRACKED]

**File:** `slices/theme.ts`  
**Purpose:** Theme tokens (colors, typography, spacing)  
**Tracked:** ❌ No (derived from settings, not primary data)

#### State

```typescript
interface ThemeSlice {
  themeTokens: ThemeTokens;
  
  // Actions
  setThemeTokens: (tokens: Partial<ThemeTokens>) => void;
  applyPresetTheme: (preset: string) => void;
}
```

#### When to Use
- ✅ Applying theme presets
- ✅ Customizing colors/typography
- ✅ Live theme preview

---

## When to Use Zustand vs useState

### Decision Tree

```
┌─ Need state? ─────────────────────────────────────┐
│                                                    │
├─ Shared across multiple components?               │
│  └─→ YES → Use Zustand (editorStore)             │
│      - Add to existing slice or create new        │
│      - Decide if should be tracked by Zundo       │
│                                                    │
├─ Persisted across page navigation?                │
│  └─→ YES → Use Zustand (editorStore)             │
│      - Consider document or settings slice        │
│                                                    │
├─ Needs undo/redo?                                 │
│  └─→ YES → Use Zustand (document or settings)    │
│      - Must be tracked by Zundo                   │
│                                                    │
├─ Drives layout/rendering globally?                │
│  └─→ YES → Use Zustand (editorShell)             │
│      - breakpoint, mode, panel state              │
│                                                    │
├─ Local to single component?                       │
│  └─→ YES → Use useState                           │
│      - Modal open/close                           │
│      - Form inputs (unless multi-step)            │
│      - Hover/focus states                         │
│      - Animation triggers                         │
│                                                    │
└─ Still unsure?                                    │
   └─→ Default to useState                          │
       - Lift to Zustand only when needed           │
       - Premature global state hurts performance   │
```

### Use Zustand When:
✅ State shared across 3+ components  
✅ State persisted across navigation  
✅ State needs undo/redo  
✅ State synced with backend  
✅ State drives global layout

### Use useState When:
✅ State local to component  
✅ State ephemeral (hover, focus)  
✅ State drives animations  
✅ Form inputs (single-component forms)  
✅ Modal open/close (unless global modal manager)

---

## Performance Best Practices

### 1. Use Selectors (Selective Subscription)

**❌ Bad (subscribes to entire store):**
```typescript
const state = useEditorStore();
const blocks = state.blocks;  // Re-renders on ANY store change
```

**✅ Good (subscribes to specific slice):**
```typescript
const blocks = useEditorStore((s) => s.blocks);  // Re-renders only when blocks change
```

### 2. Avoid Whole-Store Subscriptions

**❌ Bad:**
```typescript
const { blocks, selectedBlockId, breakpoint } = useEditorStore();
// Re-renders when ANY of these change
```

**✅ Good:**
```typescript
const blocks = useEditorStore((s) => s.blocks);
const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
// Two separate subscriptions, re-renders only when specific slice changes
```

### 3. Use Equality Functions for Deep Comparisons

**For complex objects:**
```typescript
import { shallow } from "zustand/shallow";

const settings = useEditorStore((s) => s.settings, shallow);
// Uses shallow equality instead of reference equality
```

### 4. Split Large Slices if Needed

**If a slice grows too large:**
- Consider splitting into sub-slices
- Keep related state together
- Avoid over-fragmentation

---

## Undo/Redo Architecture

### Zundo Integration

**Tracked State:**
- `blocks` (document content)
- `settings` (site configuration)

**Not Tracked:**
- UI state (editorShell, transient)
- Derived state (theme, translations)

**Why Selective Tracking?**
- Undo should roll back content, not UI
- Opening a panel shouldn't create undo entry
- Keeps history focused on user edits

### Page-Scoped History

**How it Works:**
1. User edits Page A → history entry created
2. User switches to Page B → Page A history saved
3. User edits Page B → new history for Page B
4. User switches back to Page A → Page A history restored
5. Undo on Page A → rolls back Page A changes only

**Implementation:**
```typescript
// pageHistoryCache stores past/future states per page
const pageHistoryCache = new Map<string, PageHistory>();

useEditorStore.subscribe((state) => {
  if (state.currentPageId !== prevPageId) {
    // Save outgoing page history
    pageHistoryCache.set(prevPageId, {
      pastStates: history.pastStates,
      futureStates: history.futureStates,
    });
    
    // Restore incoming page history
    const incoming = pageHistoryCache.get(state.currentPageId);
    useEditorStore.temporal.getState().clear();
    // ... restore past/future states
  }
});
```

---

## Testing

### Unit Testing Slices

```typescript
import { renderHook, act } from "@testing-library/react";
import { useEditorStore } from "./editorStore";

test("addBlock adds block to store", () => {
  const { result } = renderHook(() => useEditorStore());
  
  act(() => {
    result.current.addBlock({
      id: "block-1",
      type: "text",
      config: {},
      sortOrder: 0,
    });
  });
  
  expect(result.current.blocks).toHaveLength(1);
  expect(result.current.blocks[0].id).toBe("block-1");
});
```

### Integration Testing Undo/Redo

```typescript
test("undo/redo works correctly", () => {
  const { result } = renderHook(() => useEditorStore());
  
  // Make changes
  act(() => {
    result.current.addBlock({ id: "1", ... });
    result.current.addBlock({ id: "2", ... });
  });
  
  expect(result.current.blocks).toHaveLength(2);
  
  // Undo
  act(() => {
    useEditorStore.temporal.getState().undo();
  });
  
  expect(result.current.blocks).toHaveLength(1);
  
  // Redo
  act(() => {
    useEditorStore.temporal.getState().redo();
  });
  
  expect(result.current.blocks).toHaveLength(2);
});
```

---

## Common Patterns

### Pattern: Computed Values

**Use selectors for derived state:**
```typescript
const blockCount = useEditorStore((s) => s.blocks.length);
const hasBlocks = useEditorStore((s) => s.blocks.length > 0);
```

### Pattern: Batched Updates

**Multiple related updates:**
```typescript
const updateMultiple = useEditorStore((s) => s.updateMultiple);

// Batched (creates one undo entry)
updateMultiple([
  { id: "1", updates: { ... } },
  { id: "2", updates: { ... } },
]);
```

### Pattern: Optimistic Updates

**Update UI immediately, sync later:**
```typescript
const updateBlock = useEditorStore((s) => s.updateBlock);

// Update store (optimistic)
updateBlock(blockId, newConfig);

// Sync to backend
await fetch(`/api/blocks/${blockId}`, {
  method: "PATCH",
  body: JSON.stringify(newConfig),
});

// On error, revert (use undo)
if (!response.ok) {
  useEditorStore.temporal.getState().undo();
}
```

---

## Resources

- **Zustand Docs:** https://docs.pmnd.rs/zustand/getting-started/introduction
- **Zundo Docs:** https://github.com/charkour/zundo
- **Slice Files:** `src/app/stores/slices/`
- **Tests:** `src/app/stores/slices/*.test.ts`

---

**Last Updated:** 2026-04-27  
**Maintained by:** DreamySuite Team  
**Slices:** 6 (document, editorShell, transient, settings, translation, theme)
