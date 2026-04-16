"use client";

import { PanelRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { useEditorStore } from "@/app/stores/editorStore";

export function InspectorToggle() {
	const inspectorOpen = useEditorStore((s) => s.inspectorOpen);
	const toggleInspector = useEditorStore((s) => s.toggleInspector);

	return (
		<button
			type="button"
			aria-label="Toggle inspector"
			aria-pressed={inspectorOpen}
			title="Inspector (])"
			onClick={toggleInspector}
			className={cn(
				"flex h-8 w-8 items-center justify-center rounded-md transition-colors",
				inspectorOpen
					? "bg-accent text-accent-foreground"
					: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
			)}
		>
			<PanelRight className="size-4" />
		</button>
	);
}
