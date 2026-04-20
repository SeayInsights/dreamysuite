"use client";

import { Check, CircleDashed, AlertCircle } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";

export function SaveStatus() {
	const isDirty = useEditorStore((s) => s.isDirty);
	const settingsDirty = useEditorStore((s) => s.settingsDirty);
	const saveError = useEditorStore((s) => s.saveError);
	const isUnsaved = isDirty || settingsDirty;

	return (
		<div
			className="flex items-center gap-1.5 text-xs text-muted-foreground"
			aria-live="polite"
		>
			{saveError ? (
				<>
					<AlertCircle className="size-3.5 text-destructive" />
					<span className="text-destructive">Save failed</span>
				</>
			) : isUnsaved ? (
				<>
					<CircleDashed className="size-3.5 animate-spin" />
					<span>Saving…</span>
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
