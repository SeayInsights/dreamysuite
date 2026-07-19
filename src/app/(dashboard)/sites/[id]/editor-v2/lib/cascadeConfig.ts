import type { Block } from "@/app/stores/slices/document";

type Breakpoint = "desktop" | "tablet" | "mobile";

/**
 * Cascades breakpoint configuration from desktop to tablet to mobile.
 */
export function getEffectiveConfig(
  block: Block,
  breakpoint: Breakpoint,
): Record<string, unknown> {
  switch (breakpoint) {
    case "desktop":
      return { ...block.config };

    case "tablet":
      return {
        ...block.config,
        ...(block.overrides?.tablet || {}),
      };

    case "mobile":
      return {
        ...block.config,
        ...(block.overrides?.tablet || {}),
        ...(block.overrides?.mobile || {}),
      };
  }
}

/**
 * Gets the effective sort order for a block at a given breakpoint.
 */
export function getEffectiveOrder(
  block: Block,
  breakpoint: Breakpoint,
  fallbackIndex: number,
): number {
  switch (breakpoint) {
    case "desktop":
      return block.sortOrder ?? fallbackIndex;

    case "tablet": {
      const tabletOverride = block.overrides?.tablet?.sortOrder;
      return typeof tabletOverride === "number"
        ? tabletOverride
        : (block.sortOrder ?? fallbackIndex);
    }

    case "mobile": {
      const mobileOverride = block.overrides?.mobile?.sortOrder;
      if (typeof mobileOverride === "number") return mobileOverride;

      const tabletOverride = block.overrides?.tablet?.sortOrder;
      return typeof tabletOverride === "number"
        ? tabletOverride
        : (block.sortOrder ?? fallbackIndex);
    }
  }
}
