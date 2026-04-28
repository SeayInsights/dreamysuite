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

/**
 * Gets the effective sortOrder for a block at a given breakpoint,
 * respecting the cascade hierarchy: mobile ← tablet ← desktop.
 *
 * The cascade logic ensures that element order is preserved across breakpoints
 * unless explicitly overridden:
 *
 * - Desktop: Returns base `block.sortOrder` (or fallback to index)
 * - Tablet: Checks `block.overrides?.tablet?.sortOrder`, falls back to base
 * - Mobile: Checks `block.overrides?.mobile?.sortOrder`, then `block.overrides?.tablet?.sortOrder`, then base
 *
 * @param block - The block containing sortOrder and optional overrides
 * @param breakpoint - The target breakpoint ('desktop' | 'tablet' | 'mobile')
 * @param fallbackIndex - The array index to use if no sortOrder is specified anywhere
 * @returns The effective sortOrder for the given breakpoint
 *
 * @example
 * // Desktop has sortOrder=1, tablet has no override, mobile has no override
 * getEffectiveOrder(block, "tablet", 0) // returns 1 (inherits from desktop)
 * getEffectiveOrder(block, "mobile", 0) // returns 1 (inherits via tablet from desktop)
 *
 * // Desktop has sortOrder=1, tablet has override=2, mobile has no override
 * getEffectiveOrder(block, "mobile", 0) // returns 2 (inherits from tablet)
 *
 * // Desktop has sortOrder=1, tablet has override=2, mobile has override=3
 * getEffectiveOrder(block, "mobile", 0) // returns 3 (uses explicit override)
 */
export function getEffectiveOrder(
	block: Block,
	breakpoint: "desktop" | "tablet" | "mobile",
	fallbackIndex: number
): number {
	switch (breakpoint) {
		case "desktop":
			// Desktop returns base sortOrder or fallback to index
			return block.sortOrder ?? fallbackIndex;

		case "tablet": {
			// Tablet checks override first, then falls back to base sortOrder
			const tabletOverride = block.overrides?.tablet?.sortOrder;
			if (typeof tabletOverride === "number") {
				return tabletOverride;
			}
			return block.sortOrder ?? fallbackIndex;
		}

		case "mobile": {
			// Mobile cascades: check mobile override → tablet override → base sortOrder
			const mobileOverride = block.overrides?.mobile?.sortOrder;
			if (typeof mobileOverride === "number") {
				return mobileOverride;
			}

			const tabletOverride = block.overrides?.tablet?.sortOrder;
			if (typeof tabletOverride === "number") {
				return tabletOverride;
			}

			return block.sortOrder ?? fallbackIndex;
		}
	}
}

/**
 * Unit tests for getEffectiveOrder function.
 * These tests verify that the order cascade logic works correctly across all breakpoints.
 */

// Test Case 1: Block with no sortOrder anywhere - all breakpoints use fallback index
function testOrderNoOverrides() {
	const block: Block = {
		id: "1",
		type: "header",
		config: { width: 100 },
	};

	const desktop = getEffectiveOrder(block, "desktop", 5);
	const tablet = getEffectiveOrder(block, "tablet", 5);
	const mobile = getEffectiveOrder(block, "mobile", 5);

	console.assert(
		desktop === 5,
		"Test Order 1a FAILED: Desktop should use fallback when no sortOrder"
	);
	console.assert(
		tablet === 5,
		"Test Order 1b FAILED: Tablet should use fallback when no sortOrder"
	);
	console.assert(
		mobile === 5,
		"Test Order 1c FAILED: Mobile should use fallback when no sortOrder"
	);

	console.log("✓ Test Case Order 1 (No sortOrder) PASSED");
}

// Test Case 2: Block with base sortOrder only - all breakpoints inherit
function testOrderBaseOnly() {
	const block: Block = {
		id: "2",
		type: "hero",
		config: { width: 100 },
		sortOrder: 3,
	};

	const desktop = getEffectiveOrder(block, "desktop", 99);
	const tablet = getEffectiveOrder(block, "tablet", 99);
	const mobile = getEffectiveOrder(block, "mobile", 99);

	console.assert(
		desktop === 3,
		"Test Order 2a FAILED: Desktop should return base sortOrder"
	);
	console.assert(
		tablet === 3,
		"Test Order 2b FAILED: Tablet should inherit base sortOrder"
	);
	console.assert(
		mobile === 3,
		"Test Order 2c FAILED: Mobile should inherit base sortOrder"
	);

	console.log("✓ Test Case Order 2 (Base sortOrder only) PASSED");
}

// Test Case 3: Block with tablet override - mobile inherits from tablet
function testOrderTabletOverride() {
	const block: Block = {
		id: "3",
		type: "section",
		config: { width: 100 },
		sortOrder: 1,
		overrides: {
			tablet: { sortOrder: 2 },
		},
	};

	const desktop = getEffectiveOrder(block, "desktop", 99);
	const tablet = getEffectiveOrder(block, "tablet", 99);
	const mobile = getEffectiveOrder(block, "mobile", 99);

	console.assert(
		desktop === 1,
		"Test Order 3a FAILED: Desktop should return base sortOrder"
	);
	console.assert(
		tablet === 2,
		"Test Order 3b FAILED: Tablet should use tablet override"
	);
	console.assert(
		mobile === 2,
		"Test Order 3c FAILED: Mobile should cascade through tablet override"
	);

	console.log("✓ Test Case Order 3 (Tablet override) PASSED");
}

// Test Case 4: Block with full cascade - each breakpoint has its own value
function testOrderFullCascade() {
	const block: Block = {
		id: "4",
		type: "gallery",
		config: { width: 100 },
		sortOrder: 1,
		overrides: {
			tablet: { sortOrder: 2 },
			mobile: { sortOrder: 3 },
		},
	};

	const desktop = getEffectiveOrder(block, "desktop", 99);
	const tablet = getEffectiveOrder(block, "tablet", 99);
	const mobile = getEffectiveOrder(block, "mobile", 99);

	console.assert(
		desktop === 1,
		"Test Order 4a FAILED: Desktop should return base sortOrder"
	);
	console.assert(
		tablet === 2,
		"Test Order 4b FAILED: Tablet should use tablet override"
	);
	console.assert(
		mobile === 3,
		"Test Order 4c FAILED: Mobile should use mobile override"
	);

	console.log("✓ Test Case Order 4 (Full cascade) PASSED");
}

// Test Case 5: Block with mobile override only - skips tablet, uses mobile
function testOrderMobileOnly() {
	const block: Block = {
		id: "5",
		type: "footer",
		config: { width: 100 },
		sortOrder: 1,
		overrides: {
			mobile: { sortOrder: 5 },
		},
	};

	const desktop = getEffectiveOrder(block, "desktop", 99);
	const tablet = getEffectiveOrder(block, "tablet", 99);
	const mobile = getEffectiveOrder(block, "mobile", 99);

	console.assert(
		desktop === 1,
		"Test Order 5a FAILED: Desktop should return base sortOrder"
	);
	console.assert(
		tablet === 1,
		"Test Order 5b FAILED: Tablet should inherit base sortOrder"
	);
	console.assert(
		mobile === 5,
		"Test Order 5c FAILED: Mobile should use mobile override"
	);

	console.log("✓ Test Case Order 5 (Mobile override only) PASSED");
}

// Run order tests if in test environment
if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
	testOrderNoOverrides();
	testOrderBaseOnly();
	testOrderTabletOverride();
	testOrderFullCascade();
	testOrderMobileOnly();
}
