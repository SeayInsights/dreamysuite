"use client";

import { Check, CircleDashed } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";

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
