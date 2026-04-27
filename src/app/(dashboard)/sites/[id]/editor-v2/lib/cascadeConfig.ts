import type { Block } from "@/app/stores/slices/document";

/**
 * Cascades breakpoint configuration from desktop → tablet → mobile.
 *
 * The cascade logic ensures that users can edit on desktop and have changes
 * automatically flow to smaller breakpoints, unless explicitly overridden:
 *
 * - Desktop: Returns base config as-is
 * - Tablet: Merges base config + tablet overrides
 * - Mobile: Merges base config + tablet overrides + mobile overrides (highest priority)
 *
 * This creates an inheritance model where mobile can override tablet,
 * and tablet can override desktop, while maintaining the base config layer.
 *
 * @param block - The block containing config and optional overrides
 * @param breakpoint - The target breakpoint ('desktop' | 'tablet' | 'mobile')
 * @returns The effective configuration for the given breakpoint
 *
 * @example
 * const block = {
 *   id: '1',
 *   type: 'header',
 *   config: { width: 100, height: 50, bgColor: 'blue' },
 *   overrides: {
 *     tablet: { width: 80 },
 *     mobile: { width: 60, bgColor: 'red' }
 *   }
 * };
 *
 * getEffectiveConfig(block, 'desktop')
 * // → { width: 100, height: 50, bgColor: 'blue' }
 *
 * getEffectiveConfig(block, 'tablet')
 * // → { width: 80, height: 50, bgColor: 'blue' }
 *
 * getEffectiveConfig(block, 'mobile')
 * // → { width: 60, height: 50, bgColor: 'red' }
 */
export function getEffectiveConfig(
	block: Block,
	breakpoint: "desktop" | "tablet" | "mobile"
): Record<string, unknown> {
	switch (breakpoint) {
		case "desktop":
			// Desktop returns base config unchanged
			return { ...block.config };

		case "tablet":
			// Tablet merges base + tablet overrides
			return {
				...block.config,
				...(block.overrides?.tablet || {}),
			};

		case "mobile":
			// Mobile cascades through tablet first, then applies mobile overrides
			// This ensures the cascade order: base → tablet → mobile
			return {
				...block.config,
				...(block.overrides?.tablet || {}),
				...(block.overrides?.mobile || {}),
			};
	}
}

/**
 * Unit tests for getEffectiveConfig function.
 * These tests verify that the cascade logic works correctly across all breakpoints.
 */

// Test Case 1: Block with no overrides - all breakpoints return base config
function testNoOverrides() {
	const block: Block = {
		id: "1",
		type: "header",
		config: { width: 100, height: 50, bgColor: "blue" },
	};

	const desktop = getEffectiveConfig(block, "desktop");
	const tablet = getEffectiveConfig(block, "tablet");
	const mobile = getEffectiveConfig(block, "mobile");

	console.assert(
		JSON.stringify(desktop) === JSON.stringify({ width: 100, height: 50, bgColor: "blue" }),
		"Test 1a FAILED: Desktop should return base config"
	);
	console.assert(
		JSON.stringify(tablet) === JSON.stringify({ width: 100, height: 50, bgColor: "blue" }),
		"Test 1b FAILED: Tablet should return base config when no overrides"
	);
	console.assert(
		JSON.stringify(mobile) === JSON.stringify({ width: 100, height: 50, bgColor: "blue" }),
		"Test 1c FAILED: Mobile should return base config when no overrides"
	);

	console.log("✓ Test Case 1 (No overrides) PASSED");
}

// Test Case 2: Block with tablet overrides only - tablet and mobile cascade correctly
function testTabletOverridesOnly() {
	const block: Block = {
		id: "2",
		type: "hero",
		config: { width: 100, height: 50, bgColor: "blue", padding: 10 },
		overrides: {
			tablet: { width: 80 },
		},
	};

	const desktop = getEffectiveConfig(block, "desktop");
	const tablet = getEffectiveConfig(block, "tablet");
	const mobile = getEffectiveConfig(block, "mobile");

	console.assert(
		JSON.stringify(desktop) === JSON.stringify({ width: 100, height: 50, bgColor: "blue", padding: 10 }),
		"Test 2a FAILED: Desktop should return base config"
	);
	console.assert(
		JSON.stringify(tablet) === JSON.stringify({ width: 80, height: 50, bgColor: "blue", padding: 10 }),
		"Test 2b FAILED: Tablet should merge base + tablet overrides"
	);
	console.assert(
		JSON.stringify(mobile) === JSON.stringify({ width: 80, height: 50, bgColor: "blue", padding: 10 }),
		"Test 2c FAILED: Mobile should cascade through tablet when no mobile overrides"
	);

	console.log("✓ Test Case 2 (Tablet overrides only) PASSED");
}

// Test Case 3: Block with both tablet and mobile overrides - full cascade
function testFullCascade() {
	const block: Block = {
		id: "3",
		type: "section",
		config: { width: 100, height: 50, bgColor: "blue", padding: 10, fontSize: 16 },
		overrides: {
			tablet: { width: 80 },
			mobile: { width: 60, bgColor: "red" },
		},
	};

	const desktop = getEffectiveConfig(block, "desktop");
	const tablet = getEffectiveConfig(block, "tablet");
	const mobile = getEffectiveConfig(block, "mobile");

	console.assert(
		JSON.stringify(desktop) === JSON.stringify({ width: 100, height: 50, bgColor: "blue", padding: 10, fontSize: 16 }),
		"Test 3a FAILED: Desktop should return base config"
	);
	console.assert(
		JSON.stringify(tablet) === JSON.stringify({ width: 80, height: 50, bgColor: "blue", padding: 10, fontSize: 16 }),
		"Test 3b FAILED: Tablet should merge base + tablet overrides"
	);
	console.assert(
		JSON.stringify(mobile) === JSON.stringify({ width: 60, height: 50, bgColor: "red", padding: 10, fontSize: 16 }),
		"Test 3c FAILED: Mobile should cascade base + tablet + mobile with mobile taking priority"
	);

	console.log("✓ Test Case 3 (Full cascade) PASSED");
}

// Run all tests if in test environment
if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
	testNoOverrides();
	testTabletOverridesOnly();
	testFullCascade();
}
