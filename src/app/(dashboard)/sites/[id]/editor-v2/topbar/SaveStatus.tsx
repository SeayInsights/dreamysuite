"use client";

import { Check, CircleDashed } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";

/**
 * Reflects document dirty state.
 *
 * Autosave wiring (debounced flush → markClean) lands with the canvas
 * integration in Phase 3. Until then this display-only indicator mirrors
 * `isDirty` so the shell can be verified end-to-end.
 */
export function SaveStatus() {
	const isDirty = useEditorStore((s) => s.isDirty);

	return (
		<div
			className="flex items-center gap-1.5 text-xs text-muted-foreground"
			aria-live="polite"
		>
			{isDirty ? (
				<>
					<CircleDashed className="size-3.5" />
					<span>Unsaved</span>
				</>
			) : (
				<>
					<Check className="size-3.5 text-emerald-600" />
					<span>Saved</span>
				</>
			)}
		</div>
	);
}
