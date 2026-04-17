"use client";

import { useEditorStore } from "@/app/stores/editorStore";
import { useStyledValue } from "../hooks/useStyledValue";
import { CustomCssPanel } from "./CustomCssPanel";

function InheritBadge({ isInheriting, onClear }: { isInheriting: boolean; onClear: () => void }) {
	const mode = useEditorStore((s) => s.mode);
	const breakpoint = useEditorStore((s) => s.breakpoint);

	if (breakpoint === "desktop") return null;

	if (isInheriting) {
		return <span className="text-[10px] italic text-muted-foreground">inheriting</span>;
	}

	if (mode === "pro") {
		return (
			<button
				type="button"
				onClick={onClear}
				className="text-[10px] text-muted-foreground underline hover:text-foreground"
			>
				clear override
			</button>
		);
	}

	return null;
}

export function StyleTab() {
	const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
	const mode = useEditorStore((s) => s.mode);
	const breakpoint = useEditorStore((s) => s.breakpoint);

	if (!selectedBlockId) {
		return (
			<div className="p-4 text-sm text-muted-foreground">
				Select a block to edit styles.
			</div>
		);
	}

	return (
		<div className="space-y-4 p-4">
			{breakpoint !== "desktop" && mode === "pro" && (
				<div className="rounded bg-accent/50 px-2.5 py-1.5 text-[10px] text-muted-foreground">
					Editing <span className="font-semibold">{breakpoint}</span> overrides
				</div>
			)}
			<BackgroundColorControl blockId={selectedBlockId} />
			{mode === "pro" && <CustomCssPanel blockId={selectedBlockId} />}
		</div>
	);
}

function BackgroundColorControl({ blockId }: { blockId: string }) {
	const [bgColor, setBgColor, isInheriting, clearBgColor] = useStyledValue<string>(
		blockId,
		"backgroundColor",
		"",
	);

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
					Background
				</p>
				<InheritBadge isInheriting={isInheriting} onClear={clearBgColor} />
			</div>
			<div className="flex items-center gap-2">
				<div className="relative">
					<input
						type="color"
						value={bgColor || "#ffffff"}
						onChange={(e) => setBgColor(e.target.value)}
						className="h-7 w-7 cursor-pointer rounded border border-input bg-transparent p-0.5"
					/>
				</div>
				<input
					type="text"
					value={bgColor}
					onChange={(e) => setBgColor(e.target.value)}
					placeholder={isInheriting ? "inheriting" : "transparent"}
					className={`h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring ${isInheriting ? "italic text-muted-foreground" : ""}`}
				/>
				{bgColor && (
					<button
						type="button"
						onClick={() => setBgColor("")}
						className="shrink-0 text-[10px] text-muted-foreground underline hover:text-foreground"
					>
						remove
					</button>
				)}
			</div>
		</div>
	);
}
