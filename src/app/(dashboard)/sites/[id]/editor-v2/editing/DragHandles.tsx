"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";
import { useDrag, type HandlePosition } from "../hooks/useDrag";
import { useSelection } from "../hooks/useSelection";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Rect {
	top: number;
	left: number;
	width: number;
	height: number;
}

interface Props {
	containerRef: React.RefObject<HTMLElement | null>;
}

// ─── Geometry helpers ───────────────────────────────────────────────────────

function measureBlock(
	container: HTMLElement | null,
	blockId: string | null,
): Rect | null {
	if (!container || !blockId) return null;
	const el = container.querySelector<HTMLElement>(
		`[data-block-id="${blockId}"]`,
	);
	if (!el) return null;
	const containerBox = container.getBoundingClientRect();

	const block = useEditorStore.getState().blocks.find((b) => b.id === blockId);
	const cfg = parseCfg(block?.config);
	const cd = cfg.cropDelta as { top?: number; left?: number; right?: number; bottom?: number } | undefined;

	if (cd && ((cd.top ?? 0) + (cd.left ?? 0) + (cd.right ?? 0) + (cd.bottom ?? 0)) > 0) {
		const contentEl = el.querySelector<HTMLElement>("img, video") ?? el;
		const contentBox = contentEl.getBoundingClientRect();
		const t = cd.top ?? 0;
		const l = cd.left ?? 0;
		const r = cd.right ?? 0;
		const b = cd.bottom ?? 0;
		const isLegacy = t > 1 || l > 1 || r > 1 || b > 1;
		const cropT = isLegacy ? t : t * contentBox.height;
		const cropL = isLegacy ? l : l * contentBox.width;
		const cropR = isLegacy ? r : r * contentBox.width;
		const cropB = isLegacy ? b : b * contentBox.height;
		return {
			top: contentBox.top - containerBox.top + container.scrollTop + cropT,
			left: contentBox.left - containerBox.left + cropL,
			width: contentBox.width - cropL - cropR,
			height: contentBox.height - cropT - cropB,
		};
	}

	const elBox = el.getBoundingClientRect();
	return {
		top: elBox.top - containerBox.top + container.scrollTop,
		left: elBox.left - containerBox.left,
		width: elBox.width,
		height: elBox.height,
	};
}

// ─── Handle descriptor ──────────────────────────────────────────────────────

interface HandleDesc {
	pos: HandlePosition;
	x: number;
	y: number;
	cursor: string;
	label: string;
}

const RESIZE_HANDLES: HandleDesc[] = [
	{ pos: "nw", x: 0, y: 0, cursor: "nw-resize", label: "Resize NW" },
	{ pos: "n", x: 0.5, y: 0, cursor: "n-resize", label: "Resize N" },
	{ pos: "ne", x: 1, y: 0, cursor: "ne-resize", label: "Resize NE" },
	{ pos: "e", x: 1, y: 0.5, cursor: "e-resize", label: "Resize E" },
	{ pos: "se", x: 1, y: 1, cursor: "se-resize", label: "Resize SE" },
	{ pos: "s", x: 0.5, y: 1, cursor: "s-resize", label: "Resize S" },
	{ pos: "sw", x: 0, y: 1, cursor: "sw-resize", label: "Resize SW" },
	{ pos: "w", x: 0, y: 0.5, cursor: "w-resize", label: "Resize W" },
];

const HANDLE_VISUAL = 10;
const TOUCH_TARGET = 44;
const HANDLE_OFFSET = HANDLE_VISUAL / 2;

// ─── Main component ─────────────────────────────────────────────────────────

export function DragHandles({ containerRef }: Props) {
	const { selectedBlockId } = useSelection();
	const isCropping = useEditorStore((s) => s.isCropping);
	const [rect, setRect] = useState<Rect | null>(null);
	const rafRef = useRef<number | null>(null);

	const { startResize } = useDrag(containerRef);

	// Subscribe to selected block's config so resize dimension changes re-measure the selection box.
	const selectedBlockConfig = useEditorStore(
		(s) => s.blocks.find((b) => b.id === s.selectedBlockId)?.config,
	);

	const measure = useCallback(() => {
		setRect(measureBlock(containerRef.current, selectedBlockId));
	}, [containerRef, selectedBlockId]);

	useEffect(() => {
		measure();

		const schedMeasure = () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(measure);
		};

		const ro = new ResizeObserver(schedMeasure);
		if (containerRef.current) ro.observe(containerRef.current);

		window.addEventListener("resize", schedMeasure);
		window.addEventListener("scroll", schedMeasure, true);

		return () => {
			ro.disconnect();
			window.removeEventListener("resize", schedMeasure);
			window.removeEventListener("scroll", schedMeasure, true);
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [containerRef, measure, selectedBlockId]);

	// Re-measure whenever the selected block's config changes (e.g. width/height during resize).
	useEffect(() => {
		if (rafRef.current) cancelAnimationFrame(rafRef.current);
		rafRef.current = requestAnimationFrame(measure);
	}, [selectedBlockConfig, measure]);

	if (!selectedBlockId || !rect || isCropping) return null;

	return (
		<div className="pointer-events-none absolute inset-0 z-[45] overflow-hidden" aria-hidden="true">
			{RESIZE_HANDLES.map(({ pos, x, y, cursor, label }) => {
				const visualLeft = rect.left + x * rect.width - HANDLE_OFFSET;
				const visualTop = rect.top + y * rect.height - HANDLE_OFFSET;
				const hitPad = (TOUCH_TARGET - HANDLE_VISUAL) / 2;

				return (
					<div
						key={pos}
						role="button"
						aria-label={label}
						tabIndex={0}
						onPointerDown={(e) => {
							startResize(selectedBlockId, pos, e);
						}}
						onClick={(e) => e.stopPropagation()}
						className="pointer-events-auto absolute"
						style={{
							left: visualLeft - hitPad,
							top: visualTop - hitPad,
							width: TOUCH_TARGET,
							height: TOUCH_TARGET,
							cursor,
							touchAction: "none",
							userSelect: "none",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<div
							className="rounded-[1px] border border-primary-foreground bg-primary ring-1 ring-primary"
							style={{
								width: HANDLE_VISUAL,
								height: HANDLE_VISUAL,
								flexShrink: 0,
							}}
						/>
					</div>
				);
			})}
		</div>
	);
}
