"use client";

import { useCallback } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";

export function useStyledValue<T>(
	blockId: string,
	cfgKey: string,
	defaultValue: T,
): [value: T, setValue: (v: T) => void, isInheriting: boolean, clearValue: () => void] {
	const breakpoint = useEditorStore((s) => s.breakpoint);
	const blocks = useEditorStore((s) => s.blocks);
	const updateBlock = useEditorStore((s) => s.updateBlock);

	const block = blocks.find((b) => b.id === blockId);
	const cfg = parseCfg(block?.config);

	const bpKey =
		breakpoint === "desktop" ? cfgKey : `${cfgKey}_${breakpoint}`;

	const baseValue = cfg[cfgKey] as T | undefined;
	const bpValue =
		breakpoint !== "desktop"
			? (cfg[bpKey] as T | undefined)
			: undefined;

	const value: T =
		breakpoint !== "desktop" && bpValue !== undefined
			? bpValue
			: baseValue !== undefined
				? baseValue
				: defaultValue;

	const isInheriting =
		breakpoint !== "desktop" && bpValue === undefined;

	const setValue = useCallback(
		(v: T) => {
			const blk = useEditorStore.getState().blocks.find((b) => b.id === blockId);
			const current = parseCfg(blk?.config);
			updateBlock(blockId, { config: { ...current, [bpKey]: v } });
		},
		[blockId, bpKey, updateBlock],
	);

	const clearValue = useCallback(() => {
		if (breakpoint === "desktop") return;
		const blk = useEditorStore.getState().blocks.find((b) => b.id === blockId);
		const current = parseCfg(blk?.config);
		const next = { ...current };
		delete next[bpKey];
		updateBlock(blockId, { config: next });
	}, [blockId, bpKey, breakpoint, updateBlock]);

	return [value, setValue, isInheriting, clearValue];
}
