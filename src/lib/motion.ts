/**
 * Motion One helpers for editor-chrome animations.
 *
 * Guest-facing reveal animations continue to use GSAP 3.15 (see
 * /[slug]/route.ts). Motion One is the editor-chrome motion system only:
 * icon rail slides, tray transitions, selection outlines, toolbar pops.
 *
 * All durations respect `prefers-reduced-motion` and are clamped to 0
 * when the user opts out of motion.
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
