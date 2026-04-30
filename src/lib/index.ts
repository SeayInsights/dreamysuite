/**
 * Library - Main Barrel Export
 *
 * Convenience re-exports for commonly used utilities across the application.
 * Organized by category for easy discovery.
 *
 * ## Usage
 *
 * Import from specific modules for tree-shaking:
 * ```typescript
 * import { cn } from '@/lib/utils';
 * import { hexToRgb } from '@/lib/color';
 * ```
 *
 * Or use this barrel for convenience:
 * ```typescript
 * import { cn, hexToRgb, parseBlockConfig } from '@/lib';
 * ```
 */

// ── Style & CSS Utilities ─────────────────────────────────────────────────────

export { cn } from "./utils";
export { hexToRgb, rgbToHex } from "./color";
export { sanitizeCss, type SanitizeResult } from "./cssSanitize";

// ── Validation & Parsing ──────────────────────────────────────────────────────

export {
  parseBlockConfig,
  safeBlockConfig,
  parseSubmissionData,
  parseDomain,
  safeJsonParse,
} from "./validation";

// ── Error Handling ────────────────────────────────────────────────────────────

export {
  AppError,
  ValidationError,
  DatabaseError,
  NetworkError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
  getErrorMessage,
} from "./errors";

// ── Custom Hooks ──────────────────────────────────────────────────────────────

export * from "./hooks";

// ── Inspector Registry ────────────────────────────────────────────────────────
export { BLOCK_INSPECTOR_CONFIG, DEFAULT_INSPECTOR_CONFIG, getInspectorConfig, getAnimationPresetFilter, type BlockInspectorConfig } from "./inspectorRegistry";

// ── Block & Layout ────────────────────────────────────────────────────────────

export {
  getBlockStyle,
  getCenteredPosition,
  hasPositioning,
} from "./blockPositioning";

export {
  editableProps,
  parseCfg,
  styleFromField,
  blockSectionStyle,
  cropClipPath,
  resolveBreakpointConfig,
} from "./editableField";

export {
  detectDesignedAtWidth,
  isDecorativeOffscreen,
  DEFAULT_DESIGNED_AT_WIDTH,
} from "./responsiveScale";

// ── Motion & Animation ────────────────────────────────────────────────────────

export { duration, prefersReducedMotion, type MotionDuration, EASING } from "./motion";
export { TRANSITIONS, transition, customTransition, type TransitionKey } from "./transitions";

// ── Internationalization ──────────────────────────────────────────────────────

export { LANGUAGES, LANG_FLAGS, LANG_NATIVE } from "./languages";
export { TRANSLATABLE_FIELDS } from "./translations";

// ── Environment & Config ──────────────────────────────────────────────────────

export { getEnv } from "./cloudflare";
export { flags, type FeatureFlags } from "./flags";
export { getAuthSession } from "./auth-session";

// ── Rate Limiting ─────────────────────────────────────────────────────────────

export { isRateLimited } from "./rateLimit";

// ── Subdirectory Re-exports ───────────────────────────────────────────────────

// API utilities
export * from "./api";

// Cryptography
export * from "./crypto";

// Database queries
export * from "./db";

// Effects system (already has comprehensive index.ts)
export * from "./effects";

// Schemas (for direct schema access; prefer @/lib/validation for validation)
export * from "./schemas";

// Telemetry
export * from "./telemetry";

// Testing utilities
export * from "./testing";

// Migrations
export * from "./migrations";
