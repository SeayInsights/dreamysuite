"use client";

import { useStore } from "zustand";
import { Undo2, Redo2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useEditorStore } from "@/app/stores/editorStore";

export function UndoRedo() {
	const canUndo = useStore(
		useEditorStore.temporal,
		(s) => s.pastStates.length > 0,
	);
	const canRedo = useStore(
		useEditorStore.temporal,
		(s) => s.futureStates.length > 0,
	);

	const handleUndo = () => useEditorStore.temporal.getState().undo();
	const handleRedo = () => useEditorStore.temporal.getState().redo();

	return (
		<div className="flex items-center gap-0.5">
			<button
				type="button"
				aria-label="Undo"
				title="Undo (Cmd+Z)"
				onClick={handleUndo}
				disabled={!canUndo}
				className={cn(
					"flex h-8 w-8 items-center justify-center rounded-md transition-colors",
					"hover:bg-accent hover:text-accent-foreground",
					"disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
				)}
			>
				<Undo2 className="size-4" />
			</button>
			<button
				type="button"
				aria-label="Redo"
				title="Redo (Cmd+Shift+Z)"
				onClick={handleRedo}
				disabled={!canRedo}
				className={cn(
					"flex h-8 w-8 items-center justify-center rounded-md transition-colors",
					"hover:bg-accent hover:text-accent-foreground",
					"disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
				)}
			>
				<Redo2 className="size-4" />
			</button>
		</div>
	);
}
