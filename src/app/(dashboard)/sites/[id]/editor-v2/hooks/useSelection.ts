"use client";

import { useCallback, useRef } from "react";

import { useEditorStore } from "@/app/stores/editorStore";
import { trackEditorSelect } from "@/lib/telemetry/editor";

export function useSelection() {
	const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
	const hoveredBlockId = useEditorStore((s) => s.hoveredBlockId);
	const selectBlock = useEditorStore((s) => s.selectBlock);
	const setHoveredBlockId = useEditorStore((s) => s.setHoveredBlockId);
	const siteId = useEditorStore((s) => s.siteId);
	const selectStart = useRef(0);

	const select = useCallback(
		(id: string | null) => {
			selectStart.current = performance.now();
			selectBlock(id);
			if (id && siteId) {
				const latencyMs = performance.now() - selectStart.current;
				trackEditorSelect(siteId, id, latencyMs);
			}
		},
		[selectBlock, siteId],
	);

	const hover = useCallback(
		(id: string | null) => setHoveredBlockId(id),
		[setHoveredBlockId],
	);
	const clear = useCallback(() => selectBlock(null), [selectBlock]);

	return {
		selectedBlockId,
		hoveredBlockId,
		select,
		hover,
		clear,
		isSelected: (id: string) => selectedBlockId === id,
		isHovered: (id: string) => hoveredBlockId === id,
	};
}
