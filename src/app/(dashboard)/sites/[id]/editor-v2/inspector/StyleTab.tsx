"use client";

import { useEditorStore } from "@/app/stores/editorStore";
import { useStyledValue } from "../hooks/useStyledValue";
import { ColorInput } from "./ColorInput";
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
			<ColorInput
				value={bgColor}
				onChange={setBgColor}
				isInheriting={isInheriting}
			/>
		</div>
	);
}
