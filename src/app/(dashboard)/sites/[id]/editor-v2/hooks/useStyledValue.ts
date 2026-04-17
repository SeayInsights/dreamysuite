"use client";

import { useCallback } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import type { Breakpoint } from "@/app/stores/slices/editorShell";

/**
 * Breakpoint-scoped style value hook.
 *
 * Styled<T> shape uses suffixed keys in a block's flat config object:
 *   desktop (base)  →  cfg[cfgKey]            e.g. cfg.padding
 *   tablet          →  cfg[cfgKey + "_tablet"] e.g. cfg.padding_tablet
 *   mobile          →  cfg[cfgKey + "_mobile"] e.g. cfg.padding_mobile
 *
 * Reading: returns the breakpoint-specific value when set, otherwise falls
 * back to the base (desktop) value, then to `defaultValue`.
 *
 * Writing: writes to the breakpoint-specific key when breakpoint !== "desktop",
 * or to the base key when breakpoint === "desktop".
 *
 * Controls can use `isInheriting` to show an "(inheriting)" indicator when
 * the current breakpoint has no explicit override and is falling back to base.
 *
 * Simple mode only exposes base (desktop) editing; Pro mode allows per-breakpoint
 * overrides. Consumers should gate the override controls on `mode === "pro"`.
 *
 * @param blockId     The block whose config is being edited.
 * @param cfgKey      The base config key (e.g. "padding", "fontSize").
 * @param defaultValue Fallback when no value exists at all.
 */
export function useStyledValue<T>(
	blockId: string,
	cfgKey: string,
	defaultValue: T,
): [value: T, setValue: (v: T) => void, isInheriting: boolean] {
	const breakpoint = useEditorStore((s) => s.breakpoint);
	const blocks = useEditorStore((s) => s.blocks);
	const updateBlock = useEditorStore((s) => s.updateBlock);

	const block = blocks.find((b) => b.id === blockId);

	// Derive the suffixed key for non-desktop breakpoints.
	const bpKey =
		breakpoint === "desktop" ? cfgKey : `${cfgKey}_${breakpoint}`;

	// Raw values from the block config.
	const baseValue = block?.[cfgKey] as T | undefined;
	const bpValue =
		breakpoint !== "desktop"
			? (block?.[bpKey] as T | undefined)
			: undefined;

	// Resolved value: breakpoint override → base → defaultValue.
	const value: T =
		breakpoint !== "desktop" && bpValue !== undefined
			? bpValue
			: baseValue !== undefined
				? baseValue
				: defaultValue;

	// True when the current breakpoint has no explicit value and is inheriting.
	const isInheriting =
		breakpoint !== "desktop" && bpValue === undefined;

	const setValue = useCallback(
		(v: T) => {
			// On desktop (base) layer, write to the plain key.
			// On tablet/mobile, write to the suffixed key to create a per-bp override.
			updateBlock(blockId, { [bpKey]: v });
		},
		[blockId, bpKey, updateBlock],
	);

	return [value, setValue, isInheriting];
}
