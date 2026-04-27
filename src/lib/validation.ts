/**
 * Validation - Single Source of Truth
 *
 * All validation logic lives here. No scattered validation functions.
 *
 * ## Architecture Decision
 *
 * This module is the centralized barrel export for all validation logic in the application.
 * It consolidates:
 * - Zod schema validation from `/lib/schemas`
 * - Safe JSON parsing utilities
 * - Domain-specific validation functions
 *
 * ## Why This Pattern?
 *
 * **Before:** Validation scattered across 50+ files
 * - Inline `JSON.parse()` without error handling
 * - Validation functions duplicated in routes
 * - No single place to find validation logic
 *
 * **After:** Single import path for all validation
 * - `import { parseBlockConfig, safeJsonParse } from '@/lib/validation'`
 * - Consistent error handling
 * - Easy to audit and maintain
 *
 * ## Usage Guidelines
 *
 * ### For API Routes
 * ```typescript
 * import { parseBlockConfig, safeJsonParse } from '@/lib/validation';
 *
 * // Parse block configs
 * const configResult = parseBlockConfig(block.type, rawConfig);
 * if (!configResult.ok) {
 *   return apiError('VALIDATION_ERROR', configResult.error, 400);
 * }
 *
 * // Safe JSON parsing
 * const data = safeJsonParse(row.data, {});
 * ```
 *
 * ### For Components
 * ```typescript
 * import { safeBlockConfig } from '@/lib/validation';
 *
 * const config = safeBlockConfig(block);
 * ```
 *
 * ## Adding New Validation
 *
 * 1. For Zod schemas: Add to `/lib/schemas/<domain>.ts`
 * 2. For validation functions: Add here with JSDoc
 * 3. Export from this module
 * 4. Update imports across codebase
 *
 * ## Refactor Status
 *
 * ✅ Domain 1 complete (2026-04-27)
 * - Created validation barrel export
 * - Moved inline functions (parseDomain)
 * - Replaced critical bare JSON.parse calls
 * - Updated imports to use barrel
 *
 * Part of: Architecture Refactor - Single Source of Truth Pattern
 * See: `.planning/architecture-refactor-audit.md`
 */

// Re-export block validation
export { parseBlockConfig, safeBlockConfig } from "./schemas/blocks";

// Re-export submission validation
export { parseSubmissionData } from "./schemas/submission";

/**
 * Safe JSON parsing with fallback.
 * Use this at API boundaries instead of bare JSON.parse().
 *
 * @param raw - JSON string to parse
 * @param fallback - Value to return if parsing fails
 * @returns Parsed value or fallback
 *
 * @example
 * const data = safeJsonParse(req.body, {});
 * const items = safeJsonParse(config.items, []);
 */
export function safeJsonParse<T = unknown>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Parse and validate a domain name.
 * Returns null if domain is invalid.
 *
 * @param input - Domain string (with or without protocol/path)
 * @returns Parsed domain object or null
 *
 * @example
 * parseDomain("example.com") // { name: "example.com", tld: "com" }
 * parseDomain("https://example.com/path") // { name: "example.com", tld: "com" }
 * parseDomain("invalid") // null
 */
export function parseDomain(input: string): { name: string; tld: string } | null {
  const clean = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const parts = clean.split(".");
  if (parts.length < 2) return null;
  const tld = parts[parts.length - 1];
  if (!/^[a-z]{2,}$/.test(tld)) return null;
  if (parts.some((p) => !/^[a-z0-9-]+$/.test(p) || p.startsWith("-") || p.endsWith("-"))) return null;
  return { name: clean, tld };
}
