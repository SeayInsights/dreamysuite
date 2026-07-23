/**
 * Transition Utilities - Standardized CSS Transitions
 *
 * Pre-configured transition strings for inline styles.
 *
 * ## Architecture Decision
 *
 * This module provides CSS transition constants for components that use
 * inline `style={{ transition }}` instead of Motion One. It provides:
 * - Standardized timing functions
 * - Consistent easing curves
 * - Common transition patterns
 * - Type-safe transition keys
 *
 * ## Why This Pattern?
 *
 * **Before:** Scattered inline transition strings
 * - Inconsistent timings (200ms vs 300ms vs 350ms)
 * - Hard-coded easing curves
 * - Copy-pasted between files
 * - Difficult to maintain consistent feel
 *
 * **After:** Centralized transition constants
 * - Single source for all CSS transitions
 * - Consistent timing and easing
 * - Easy to update globally
 * - Type-safe keys
 *
 * ## Usage Guidelines
 *
 * ### Basic Transition
 * ```typescript
 * import { TRANSITIONS } from "@/lib/transitions";
 *
 * <div style={{ transition: TRANSITIONS.fast }}>
 *   Fast transition (150ms)
 * </div>
 * ```
 *
 * ### Component-Specific Transition
 * ```typescript
 * import { TRANSITIONS } from "@/lib/transitions";
 *
 * <div style={{ transition: TRANSITIONS.bottomSheet }}>
 *   Bottom sheet (300ms slide)
 * </div>
 * ```
 *
 * ### Multiple Transitions
 * ```typescript
 * import { transition } from "@/lib/transitions";
 *
 * <div style={{ transition: transition("opacity", "transform") }}>
 *   Opacity + transform
 * </div>
 * ```
 *
 * ### Custom Combination
 * ```typescript
 * import { TRANSITIONS } from "@/lib/transitions";
 *
 * <div style={{
 *   transition: `${TRANSITIONS.opacity}, ${TRANSITIONS.transform}`
 * }}>
 *   Combined transitions
 * </div>
 * ```
 *
 * ## When to Use
 *
 * **Use transitions.ts when:**
 * - You need inline `style={{ transition }}` for simple transitions
 * - Component doesn't need JavaScript animation control
 * - Transitioning one or two CSS properties
 * - Hover/focus states with CSS
 *
 * **Use Motion One instead when:**
 * - You need complex keyframes
 * - You need JavaScript control over animation
 * - You need sequencing or staggering
 * - You need animation callbacks
 *
 * ## Animation Systems Overview
 *
 * **transitions.ts** (this file) - Simple CSS transitions
 * **Motion One** (`@/lib/motion`) - Editor UI animations
 * **Effects System** (`@/lib/effects/`) - Guest visual effects
 * **GSAP** (`[slug]/route.ts`) - Scroll reveals
 *
 * See `.planning/ANIMATION-ARCHITECTURE.md` for full guide.
 *
 * ## Adding New Transitions
 *
 * 1. Add to `TRANSITIONS` constant with descriptive key
 * 2. Update type (auto-derived from TRANSITIONS)
 * 3. Document the use case
 * 4. Test with `prefers-reduced-motion` (handled by global CSS)
 *
 * ## Refactor Status
 *
 * - [x] Core transition constants
 * - [x] Transition combiner helper
 * - [x] Type-safe keys
 * - [ ] Migrate NavPreview
 * - [ ] Migrate ContentCardBlock
 * - [ ] Migrate all inline transitions
 *
 * @module lib/transitions
 */

/**
 * Pre-configured CSS transition strings
 *
 * All transitions use cubic-bezier easing for smooth, natural motion.
 * Duration and easing are tuned for each use case.
 */
export const TRANSITIONS = {
  // ── Duration-based (general use) ──────────────────────────────────────────

  /**
   * Fast transition - Quick hover/focus states
   * Duration: 150ms
   * Easing: Smooth ease-in-out
   * Use for: Button hovers, simple toggles
   */
  fast: "all 150ms cubic-bezier(0.2, 0, 0, 1)",

  /**
   * Medium transition - Standard UI transitions
   * Duration: 250ms
   * Easing: Smooth ease-in-out
   * Use for: Most UI transitions
   */
  medium: "all 250ms cubic-bezier(0.2, 0, 0, 1)",

  /**
   * Slow transition - Deliberate, emphasizedtransitions
   * Duration: 350ms
   * Easing: Smooth ease-in-out
   * Use for: Large panels, emphasized changes
   */
  slow: "all 350ms cubic-bezier(0.2, 0, 0, 1)",

  // ── Property-specific ─────────────────────────────────────────────────────

  /**
   * Opacity transition
   * Duration: 200ms
   * Easing: Ease-out
   * Use for: Fade in/out effects
   */
  opacity: "opacity 200ms ease-out",

  /**
   * Transform transition
   * Duration: 250ms
   * Easing: Smooth cubic-bezier
   * Use for: Slides, scales, rotations
   */
  transform: "transform 250ms cubic-bezier(0.2, 0, 0, 1)",

  /**
   * Color transitions
   * Duration: 200ms each
   * Easing: Default
   * Use for: Background/text color changes
   */
  colors: "background-color 200ms, color 200ms, border-color 200ms",

  /**
   * Layout transitions
   * Duration: 300ms each
   * Easing: Smooth cubic-bezier
   * Use for: Width/height/padding changes
   */
  layout:
    "width 300ms cubic-bezier(0.2, 0, 0, 1), height 300ms cubic-bezier(0.2, 0, 0, 1), padding 300ms cubic-bezier(0.2, 0, 0, 1)",

  // ── Component-specific ────────────────────────────────────────────────────

  /**
   * Bottom sheet transition
   * Duration: 300ms
   * Easing: Smooth deceleration
   * Use for: Bottom sheet toolbar slides
   */
  bottomSheet: "transform 300ms cubic-bezier(0.3, 0, 0, 1)",

  /**
   * Dropdown transition
   * Duration: 150ms
   * Easing: Quick entry
   * Use for: Dropdown menus, popovers
   */
  dropdown:
    "opacity 150ms cubic-bezier(0, 0, 0, 1), transform 150ms cubic-bezier(0, 0, 0, 1)",

  /**
   * Modal transition
   * Duration: 250ms
   * Easing: Smooth entry/exit
   * Use for: Modal dialogs, overlays
   */
  modal:
    "opacity 250ms cubic-bezier(0.2, 0, 0, 1), transform 250ms cubic-bezier(0.2, 0, 0, 1)",

  /**
   * Card transition
   * Duration: 200ms
   * Easing: Smooth hover
   * Use for: Card hovers, content cards
   */
  card: "transform 200ms cubic-bezier(0.2, 0, 0, 1), box-shadow 200ms cubic-bezier(0.2, 0, 0, 1)",

  /**
   * Navigation transition
   * Duration: 250ms
   * Easing: Smooth slide
   * Use for: Navigation panels, previews
   */
  navigation:
    "transform 250ms cubic-bezier(0.2, 0, 0, 1), opacity 250ms cubic-bezier(0.2, 0, 0, 1)",

  /**
   * Button transition
   * Duration: 150ms
   * Easing: Quick response
   * Use for: Button hover/active states
   */
  button:
    "background-color 150ms ease-out, transform 150ms ease-out, box-shadow 150ms ease-out",

  /**
   * Input transition
   * Duration: 150ms
   * Easing: Quick response
   * Use for: Input focus/blur states
   */
  input: "border-color 150ms ease-out, box-shadow 150ms ease-out",

  /**
   * Accordion transition
   * Duration: 300ms
   * Easing: Smooth expand/collapse
   * Use for: Accordions, collapsible sections
   */
  accordion:
    "max-height 300ms cubic-bezier(0.2, 0, 0, 1), opacity 200ms ease-out",

  /**
   * Tooltip transition
   * Duration: 100ms
   * Easing: Instant entry
   * Use for: Tooltips, quick hints
   */
  tooltip: "opacity 100ms ease-out, transform 100ms ease-out",
} as const;

export type TransitionKey = keyof typeof TRANSITIONS;

/**
 * Combine multiple transition keys into one string
 *
 * @param keys - Transition keys to combine
 * @returns Combined transition string
 *
 * @example
 * ```typescript
 * import { transition } from "@/lib/transitions";
 *
 * <div style={{ transition: transition("opacity", "transform") }}>
 *   // opacity 200ms ease-out, transform 250ms cubic-bezier(0.2, 0, 0, 1)
 * </div>
 * ```
 */
export function transition(...keys: TransitionKey[]): string {
  return keys.map((key) => TRANSITIONS[key]).join(", ");
}
