"use client";

import { useCallback } from "react";
import { useEditorStore } from "@/app/stores/editorStore";

export function useHover() {
	const hoveredBlockId = useEditorStore((s) => s.hoveredBlockId);
	const setHoveredBlockId = useEditorStore((s) => s.setHoveredBlockId);
	const hover = useCallback(
		(id: string | null) => setHoveredBlockId(id),
		[setHoveredBlockId],
	);
	return { hoveredBlockId, hover };
}
