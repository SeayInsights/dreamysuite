"use client";

import { useEditorStore } from "@/app/stores/editorStore";
import { useStyledValue } from "../hooks/useStyledValue";

interface Padding {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

const DEFAULT_PADDING: Padding = { top: 56, right: 16, bottom: 56, left: 16 };

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

function NumberInput({
	label,
	value,
	onChange,
	min = 0,
	max = 999,
	unit = "px",
}: {
	label: string;
	value: number;
	onChange: (v: number) => void;
	min?: number;
	max?: number;
	unit?: string;
}) {
	return (
		<div className="flex items-center gap-2">
			<label className="w-10 shrink-0 text-[10px] uppercase text-muted-foreground">{label}</label>
			<input
				type="number"
				min={min}
				max={max}
				value={value}
				onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
				className="h-7 w-full rounded border border-input bg-background px-2 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
			/>
			<span className="shrink-0 text-[10px] text-muted-foreground">{unit}</span>
		</div>
	);
}

export function LayoutTab() {
	const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
	const mode = useEditorStore((s) => s.mode);
	const breakpoint = useEditorStore((s) => s.breakpoint);

	if (!selectedBlockId) {
		return (
			<div className="p-4 text-sm text-muted-foreground">
				Select a block to edit layout.
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
			<PaddingControls blockId={selectedBlockId} />
			<HeightControl blockId={selectedBlockId} />
		</div>
	);
}

function PaddingControls({ blockId }: { blockId: string }) {
	const [padding, setPadding, isInheriting, clearPadding] = useStyledValue<Padding>(
		blockId,
		"padding",
		DEFAULT_PADDING,
	);

	function updateSide(side: keyof Padding, v: number) {
		setPadding({ ...padding, [side]: v });
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
					Padding
				</p>
				<InheritBadge isInheriting={isInheriting} onClear={clearPadding} />
			</div>
			<div className="grid grid-cols-2 gap-2">
				<NumberInput label="Top" value={padding.top} onChange={(v) => updateSide("top", v)} />
				<NumberInput label="Right" value={padding.right} onChange={(v) => updateSide("right", v)} />
				<NumberInput label="Bottom" value={padding.bottom} onChange={(v) => updateSide("bottom", v)} />
				<NumberInput label="Left" value={padding.left} onChange={(v) => updateSide("left", v)} />
			</div>
		</div>
	);
}

function HeightControl({ blockId }: { blockId: string }) {
	const [height, setHeight, isInheriting, clearHeight] = useStyledValue<number>(
		blockId,
		"blockHeight",
		0,
	);

	return (
		<div className="space-y-2 border-t border-border pt-4">
			<div className="flex items-center justify-between">
				<p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
					Height
				</p>
				<InheritBadge isInheriting={isInheriting} onClear={clearHeight} />
			</div>
			<div className="flex items-center gap-2">
				<input
					type="number"
					min={0}
					max={2000}
					value={height}
					onChange={(e) => setHeight(Math.max(0, Number(e.target.value) || 0))}
					placeholder={height === 0 ? "auto" : undefined}
					className="h-7 w-full rounded border border-input bg-background px-2 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
				/>
				<span className="shrink-0 text-[10px] text-muted-foreground">px</span>
			</div>
			{height === 0 && (
				<p className="text-[10px] text-muted-foreground">0 = auto height</p>
			)}
		</div>
	);
}
