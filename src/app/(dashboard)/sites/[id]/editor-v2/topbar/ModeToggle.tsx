"use client";

import { cn } from "@/lib/utils";
import { useEditorStore, type EditorMode } from "@/app/stores/editorStore";

const MODES: { id: EditorMode; label: string }[] = [
	{ id: "simple", label: "Simple" },
	{ id: "pro", label: "Pro" },
];

export function ModeToggle() {
	const mode = useEditorStore((s) => s.mode);
	const setMode = useEditorStore((s) => s.setMode);

	return (
		<div
			role="radiogroup"
			aria-label="Editor mode"
			className="flex items-center rounded-md border border-border bg-background p-0.5"
		>
			{MODES.map(({ id, label }) => {
				const active = mode === id;
				return (
					<button
						key={id}
						type="button"
						role="radio"
						aria-checked={active}
						onClick={() => setMode(id)}
						className={cn(
							"h-7 rounded-sm px-2.5 text-xs font-medium transition-colors",
							active
								? "bg-accent text-accent-foreground"
								: "text-muted-foreground hover:bg-accent/50",
						)}
					>
						{label}
					</button>
				);
			})}
		</div>
	);
}
