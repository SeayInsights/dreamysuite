/**
 * Motion System - Single Source of Truth
 *
 * Standardized animation durations and easing curves for editor-chrome animations.
 *
 * ## Architecture Decision
 *
 * This module centralizes Motion One (motion/mini) timing constants for ALL editor
 * UI animations. It provides:
 * - Standardized durations for common UI patterns
 * - Consistent easing curves
 * - Automatic `prefers-reduced-motion` support
 * - Type-safe duration keys
 *
 * ## Why This Pattern?
 *
 * **Before:** Scattered animation timings across editor components
 * - Inconsistent durations (100ms vs 150ms vs 200ms for same pattern)
 * - Hard-coded easing curves copied between files
 * - No accessibility support (ignored prefers-reduced-motion)
 * - Difficult to maintain consistent feel
 *
 * **After:** Centralized motion constants
 * - Single source for all editor animation timing
 * - Consistent UX (tray always slides in 200ms)
 * - Automatic reduced-motion support
 * - Easy to tune globally
 *
 * ## Usage Guidelines
 *
 * ### Basic Animation
 * ```typescript
 * import { animate } from "motion/mini";
 * import { duration, EASING } from "@/lib/motion";
 *
 * animate(
 *   element,
 *   { opacity: [0, 1], transform: ["translateX(-100%)", "translateX(0)"] },
 *   {
 *     duration: duration("traySlide") / 1000, // Convert to seconds
 *     easing: EASING.enter,
 *   }
 * );
 * ```
 *
 * ### With Reduced Motion Support
 * ```typescript
 * import { duration, prefersReducedMotion } from "@/lib/motion";
 *
 * if (prefersReducedMotion()) {
 *   // duration("traySlide") returns 0 automatically
 *   element.style.transform = "translateX(0)"; // Instant
 * } else {
 *   animate(...); // Animated
 * }
 * ```
 *
 * ### Custom Duration
 * ```typescript
 * // For one-off animations not in MOTION constants
 * const customDuration = prefersReducedMotion() ? 0 : 300;
 * ```
 *
 * ## Animation Systems Overview
 *
 * DreamySuite uses THREE animation systems:
 *
 * **1. Motion One (this file) - Editor UI**
 * - Purpose: Editor chrome (trays, toolbars, selections)
 * - Bundle: ~5KB (motion/mini)
 * - Usage: Import from @/lib/motion
 *
 * **2. Effects System (src/lib/effects/) - Guest Visual Effects**
 * - Purpose: 100+ visual effects for wedding sites
 * - Bundle: Lazy-loaded per effect
 * - Usage: See src/lib/effects/README.md
 *
 * **3. GSAP (src/app/[slug]/route.ts) - Guest Scroll Animations**
 * - Purpose: Scroll-driven reveal animations
 * - Bundle: ~30KB (GSAP 3.15)
 * - Usage: Automatic on guest sites
 *
 * ### Decision Tree: Which System?
 *
 * - **Editor UI transition?** → Use Motion One (this file)
 * - **Guest visual effect?** → Use Effects System (src/lib/effects/)
 * - **Scroll-based reveal?** → Use GSAP (already configured)
 * - **Inline CSS transition?** → Use src/lib/transitions.ts constants
 *
 * ## Adding New Durations
 *
 * 1. Add to `MOTION` constant with descriptive key
 * 2. Update `MotionDuration` type (auto-derived from MOTION)
 * 3. Document the use case
 * 4. Test with `prefers-reduced-motion` enabled
 *
 * ## Refactor Status
 *
 * - [x] Centralized editor-chrome durations
 * - [x] Easing curve constants
 * - [x] Reduced-motion support
 * - [x] Type-safe duration keys
 * - [x] Comprehensive documentation
 * - [ ] Migrate all editor components to use constants
 * - [ ] Add spring/bounce easing options
 *
 * @module lib/motion
 */

export const MOTION = {
	railSlide: 250,
	traySlide: 200,
	inspectorSlide: 220,
	selectionFade: 120,
	toolbarPop: 100,
} as const;

export type MotionDuration = keyof typeof MOTION;

export function prefersReducedMotion(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function duration(key: MotionDuration): number {
	return prefersReducedMotion() ? 0 : MOTION[key];
}

export const EASING = {
	standard: [0.2, 0, 0, 1] as const,
	enter: [0, 0, 0, 1] as const,
	exit: [0.3, 0, 1, 1] as const,
} as const;
