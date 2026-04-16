"use client";

import { useCallback } from "react";

import { useEditorStore } from "@/app/stores/editorStore";

/**
 * Selection helpers bound to editorShell.selectedBlockId + transient.hoveredBlockId.
 *
 * Kept intentionally thin — the canvas mount (Task 13) composes this with pointer
 * handlers, and the inspector (Task 11) reads selection state the same way.
 */
export function useSelection() {
	const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
	const hoveredBlockId = useEditorStore((s) => s.hoveredBlockId);
	const selectBlock = useEditorStore((s) => s.selectBlock);
	const setHoveredBlockId = useEditorStore((s) => s.setHoveredBlockId);

	const select = useCallback((id: string | null) => selectBlock(id), [selectBlock]);
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
