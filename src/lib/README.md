# Library Organization

Single source of truth for all shared utilities, validation, schemas, and helpers.

## Structure

```
src/lib/
├── index.ts                    ← Main barrel export (convenience)
├── validation.ts               ← Validation SSOT (Domain 1)
│
├── api/                        ← API & Auth utilities
│   ├── index.ts
│   ├── get-session.ts
│   └── site-auth.ts
│
├── crypto/                     ← Cryptographic functions
│   ├── index.ts
│   └── guestPassword.ts
│
├── effects/                    ← Effects system (backgrounds, animations, etc.)
│   ├── index.ts
│   ├── loader.ts
│   ├── performance.ts
│   ├── presets.ts
│   ├── registry.ts
│   ├── types.ts
│   └── components/             ← Effect components (100+ files)
│
├── migrations/                 ← Data migrations
│   ├── index.ts
│   └── blockConsolidation.ts
│
├── schemas/                    ← Zod schemas (DO NOT import directly)
│   ├── index.ts                   Use @/lib/validation instead!
│   ├── blocks.ts
│   ├── contact.ts
│   ├── settings.ts
│   ├── site-type-settings.ts
│   └── submission.ts
│
├── telemetry/                  ← Analytics & tracking
│   ├── index.ts
│   └── editor.ts
│
├── testing/                    ← Test utilities
│   ├── index.ts
│   └── factories.ts
│
└── [root utilities]            ← Single-purpose modules
    ├── auth-session.ts         ← Session management
    ├── blockPositioning.ts     ← Block layout (Domain 1 SSOT example)
    ├── cloudflare.ts           ← Cloudflare Workers env
    ├── color.ts                ← Color conversion
    ├── cssSanitize.ts          ← CSS sanitization
    ├── editableField.ts        ← Editable field helpers
    ├── flags.ts                ← Feature flags
    ├── languages.ts            ← Language constants
    ├── motion.ts               ← Motion/animation utilities
    ├── rateLimit.ts            ← Rate limiting
    ├── responsiveScale.ts      ← Responsive scaling
    ├── translations.ts         ← i18n helpers
    └── utils.ts                ← Tailwind class merging
```

## Usage Guidelines

### Prefer Specific Imports

**Good:**
```typescript
import { cn } from '@/lib/utils';
import { hexToRgb } from '@/lib/color';
import { parseBlockConfig } from '@/lib/validation';
```

**Also OK (convenience):**
```typescript
import { cn, hexToRgb, parseBlockConfig } from '@/lib';
```

### Validation Pattern

**Always use validation module:**
```typescript
// ✅ CORRECT
import { parseBlockConfig, safeJsonParse } from '@/lib/validation';

// ❌ WRONG - Do not import schemas directly for validation
import { parseBlockConfig } from '@/lib/schemas/blocks';
```

**Why?** The `validation` module is the single source of truth (Domain 1 refactor).

### Barrel Exports

Each subdirectory has an `index.ts` barrel export:

```typescript
// Import from subdirectory barrel
import { requireSiteOwnership, apiError } from '@/lib/api';

// Or import specific file
import { requireSiteOwnership } from '@/lib/api/site-auth';
```

## Architecture Decisions

### Single-Purpose Modules

Each root-level utility file has **one job**:
- `color.ts` → Color conversion only
- `utils.ts` → Tailwind class merging only
- `rateLimit.ts` → Rate limiting only

**Why?** Easy to find, test, and maintain. No bloated "utils.ts" with 50 unrelated functions.

### Subdirectory Organization

Grouped by domain when there are **3+ related files**:
- `api/` → 2 auth-related files
- `effects/` → 5 core files + 100+ components
- `schemas/` → 5 Zod schema files

**Why?** Prevents root lib directory from having 50+ files. Logical grouping.

### No Duplicates

**Rule:** Every utility function lives in **exactly one place**.

Enforced via Domain 2 audit (2026-04-27). Zero duplicates found.

## Adding New Utilities

### 1. Determine Location

**Root level** if:
- Single-purpose utility (one file, one concern)
- Used across multiple domains

**Subdirectory** if:
- Part of existing group (add to `/api`, `/crypto`, etc.)
- New domain with 3+ related files (create new subdirectory)

### 2. Follow Naming Convention

```typescript
// Root utilities: descriptive names
color.ts          → hexToRgb, rgbToHex
cssSanitize.ts    → sanitizeCss
rateLimit.ts      → isRateLimited

// Subdirectory files: domain context in name
api/site-auth.ts  → requireSiteOwnership, apiError
crypto/guestPassword.ts → hashGuestPassword, verifyGuestPassword
```

### 3. Add Documentation

```typescript
/**
 * Brief description of what this does.
 *
 * @param input - Description
 * @returns Description
 *
 * @example
 * const result = myFunction(input);
 */
export function myFunction(input: string): string {
  // ...
}
```

### 4. Update Barrel Exports

If adding to subdirectory:
```typescript
// src/lib/subdirectory/index.ts
export * from './yourNewFile';
```

If commonly used, add to main barrel:
```typescript
// src/lib/index.ts
export { yourFunction } from './yourNewFile';
```

### 5. Add Tests (if complex)

```typescript
// src/lib/yourUtil.test.ts
import { describe, it, expect } from 'vitest';
import { yourFunction } from './yourUtil';

describe('yourFunction', () => {
  it('should do the thing', () => {
    expect(yourFunction('input')).toBe('output');
  });
});
```

## Refactor Status

**Domain 1 (Validation):** ✅ Complete (2026-04-27)
- Created `validation.ts` as SSOT for all validation
- Moved inline functions to centralized module
- Updated imports across codebase

**Domain 2 (Library Utilities):** ✅ Complete (2026-04-27)
- Audited for duplicates (none found)
- Added barrel exports to all subdirectories
- Created main library index
- Documented structure (this file)

**Part of:** Architecture Refactor - Single Source of Truth Pattern  
**See:** `.planning/architecture-refactor-audit.md`

## Common Patterns

### Safe JSON Parsing

```typescript
import { safeJsonParse } from '@/lib/validation';

const data = safeJsonParse(row.content, {});
const items = safeJsonParse(config.items, []);
```

### Color Conversion

```typescript
import { hexToRgb, rgbToHex } from '@/lib/color';

const [r, g, b] = hexToRgb('#FF5733');
const hex = rgbToHex(255, 87, 51);
```

### Block Validation

```typescript
import { parseBlockConfig } from '@/lib/validation';

const result = parseBlockConfig(block.type, rawConfig);
if (!result.ok) {
  return apiError('VALIDATION_ERROR', result.error, 400);
}
```

### Tailwind Class Merging

```typescript
import { cn } from '@/lib/utils';

<div className={cn('base-class', isActive && 'active-class')} />
```

### Feature Flags

```typescript
import { flags } from '@/lib/flags';

if (flags.editorV2) {
  // ...
}
```

---

**Last updated:** 2026-04-27  
**Maintained by:** Architecture refactor (Domain 2)
