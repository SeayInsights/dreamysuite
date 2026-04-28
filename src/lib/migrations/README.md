# Data Migrations

This directory contains **data transformation functions** for migrating legacy data structures to current schemas.

## Purpose

Migrations are pure functions that transform data from one structure to another. They are:
- **Idempotent** - Safe to run multiple times
- **Pure** - No side effects, no database access
- **Testable** - Clear inputs and outputs
- **Documented** - Each migration explains its purpose

## When to Use Migrations

Use migrations for:
- Converting legacy block types to new consolidated types
- Updating data schemas when API contracts change
- Normalizing inconsistent data from external sources
- One-time data transformations during upgrades

Do NOT use migrations for:
- Runtime data transformations (use inline transforms)
- State updates (use Zustand stores)
- Rendering transformations (keep in components)
- Simple array filtering/mapping (standard JavaScript)

## Current Migrations

### Block Consolidation Migration

**File:** `blockConsolidation.ts`  
**Purpose:** Converts legacy block types to consolidated replacements  
**Task:** TR-018

**Transformations:**
- `video` + `youtube` → `media-video` (with provider flag)
- `images` + `photo-split` → `gallery` (with layout flag)
- `registry-card` + `hotel-card` → `info-card` (with variant flag)

**Usage:**
```typescript
import { migrateBlocksIfNeeded } from '@/lib/migrations';

const blocks = await db.query.blocks.findMany();
const migrated = migrateBlocksIfNeeded(blocks);
```

**Pattern:**
```typescript
function migrateBlockType(block: RawBlock): RawBlock {
  const cfg = parseConfig(block.config);
  return {
    ...block,
    type: "new-type",
    config: serializeConfig({ newField: "value", ...cfg }),
  };
}
```

## Data Transformation Patterns (Codebase-Wide)

### 1. Complex Migrations → This Directory

**When:** Converting legacy data, schema updates, one-time transformations

**Pattern:** Pure function modules
```typescript
// src/lib/migrations/myMigration.ts
export function migrateData(input: OldSchema): NewSchema {
  // Transform logic
  return transformed;
}
```

### 2. State Updates → Zustand Stores

**When:** Managing application state, tracking changes

**Pattern:** Store action methods
```typescript
// src/app/stores/slices/document.ts
updateBlock: (id, updates) =>
  set((state) => ({
    blocks: state.blocks.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    ),
  }))
```

**Common patterns in stores:**
- Update by ID: `items.map((item) => item.id === id ? { ...item, ...updates } : item)`
- Remove by ID: `items.filter((item) => item.id !== id)`
- Reorder: Array splice operations

### 3. Rendering Transforms → Component Logic

**When:** Component-specific data preparation, translations, derived state

**Pattern:** Inline or custom hooks
```typescript
// src/app/components/SiteRenderer.tsx
const visible = blocks.filter((b) => b.isVisible !== 0);
const sorted = visible.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
const translated = useTranslatedBlocks(sorted);
```

**Why inline?**
- Context-specific business logic
- Depends on component state/props
- Benefits from colocation (easier to understand)

### 4. Simple Array Methods → Standard JavaScript

**When:** Basic filtering, mapping, reducing

**Pattern:** Standard array methods
```typescript
const slugs = pages.map((p) => p.slug);
const active = items.filter((item) => item.isActive);
const total = values.reduce((sum, val) => sum + val, 0);
```

**Why not abstract?**
- One-liner predicates are self-documenting
- Creating utilities adds indirection
- Standard JavaScript patterns are widely understood

## Guidelines

### ✅ Create a Migration When:
- Converting data from old schema to new schema
- Migrating legacy types (like block consolidation)
- One-time data transformations during upgrades
- Complex multi-step transformations that are reused

### ❌ Don't Create a Migration For:
- Simple filtering or mapping (1-2 lines)
- Component-specific rendering logic
- State management updates (use stores)
- Context-dependent transformations

### Migration Checklist

When creating a new migration:

1. **Pure function** - No side effects, no external dependencies
2. **Idempotent** - Safe to run multiple times without changing output
3. **Type-safe** - Full TypeScript types for inputs and outputs
4. **Documented** - JSDoc with purpose, examples, and edge cases
5. **Tested** - Unit tests for happy path and edge cases
6. **Exported** - Added to `index.ts` barrel export

### Example Migration Structure

```typescript
/**
 * [Migration Name] — [Task ID]
 *
 * [Brief description of what this migration does]
 *
 * ## Why This Migration?
 * [Context on why the transformation is needed]
 *
 * ## Safety
 * - Idempotent: [Yes/No + explanation]
 * - Backward compatible: [Yes/No + explanation]
 * - Legacy support: [What happens to old data?]
 *
 * @example
 * const blocks = [{ id: "1", type: "video", config: {...} }];
 * const migrated = migrateBlocks(blocks);
 * // Result: [{ id: "1", type: "media-video", config: {...} }]
 */

interface RawBlock {
  id: string;
  type: string;
  config?: string | Record<string, unknown>;
  [key: string]: unknown;
}

export function migrateBlocks(blocks: RawBlock[]): RawBlock[] {
  return blocks.map((block) => {
    // Migration logic
    return transformed;
  });
}
```

## Related Documentation

- **State Management:** `src/app/stores/README.md` - Store transformation patterns
- **Animation Logic:** `.planning/ANIMATION-ARCHITECTURE.md` - Animation transforms
- **Type Definitions:** `src/types/` - Data structure schemas

## Future Migrations

**Potential candidates:**
- Config schema migrations (when block config structure changes)
- Theme data migrations (if theme system evolves)
- Translation format migrations (if translation structure changes)

**Adding a new migration:**
1. Create `src/lib/migrations/myMigration.ts`
2. Follow the migration structure template above
3. Export from `src/lib/migrations/index.ts`
4. Document in this README
5. Add unit tests
6. Update affected API routes or data loaders
