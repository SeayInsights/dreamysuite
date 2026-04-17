"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useEditorStore } from "@/app/stores/editorStore";
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
	// Fractional offsets from the block rect origin (0–1)
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

const HANDLE_VISUAL = 10; // px — visible square size
const TOUCH_TARGET = 44; // px — invisible hit area
const HANDLE_OFFSET = HANDLE_VISUAL / 2;

// ─── Drop indicator ─────────────────────────────────────────────────────────

interface DropLineProps {
	index: number;
	containerRef: React.RefObject<HTMLElement | null>;
}

function DropLine({ index, containerRef }: DropLineProps) {
	const [top, setTop] = useState<number | null>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const blocks = Array.from(
			container.querySelectorAll<HTMLElement>("[data-block-id]"),
		);
		if (!blocks.length) {
			setTop(null);
			return;
		}

		const containerBox = container.getBoundingClientRect();

		if (index <= 0) {
			const first = blocks[0].getBoundingClientRect();
			setTop(first.top - containerBox.top + container.scrollTop);
		} else if (index >= blocks.length) {
			const last = blocks[blocks.length - 1].getBoundingClientRect();
			setTop(last.bottom - containerBox.top + container.scrollTop);
		} else {
			const prev = blocks[index - 1].getBoundingClientRect();
			const next = blocks[index].getBoundingClientRect();
			setTop(
				((prev.bottom + next.top) / 2) -
					containerBox.top +
					container.scrollTop,
			);
		}
	}, [index, containerRef]);

	if (top === null) return null;

	return (
		<div
			aria-hidden
			className="pointer-events-none absolute left-0 right-0 z-20 h-0.5 bg-primary"
			style={{ top }}
		/>
	);
}

// ─── Move handle (drag grip) ─────────────────────────────────────────────────

interface MoveHandleProps {
	rect: Rect;
	blockId: string;
	containerRef: React.RefObject<HTMLElement | null>;
	dropIndex: number;
}

function MoveHandle({
	rect,
	blockId,
	containerRef,
	dropIndex,
}: MoveHandleProps) {
	const { startReorder, isDragging } = useDrag(containerRef);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			startReorder(blockId, e);
		},
		[blockId, startReorder],
	);

	// Center horizontally at the top of the block
	const left = rect.left + rect.width / 2;
	const top = rect.top - 22; // 22px above the block top

	return (
		<>
			{/* Drop indicator line */}
			{isDragging && dropIndex >= 0 && (
				<DropLine index={dropIndex} containerRef={containerRef} />
			)}

			{/* Grip button */}
			<div
				role="button"
				aria-label="Drag to reorder block"
				tabIndex={0}
				onPointerDown={handlePointerDown}
				className="absolute z-30 flex items-center justify-center rounded-sm bg-primary text-primary-foreground"
				style={{
					left,
					top,
					width: 24,
					height: 18,
					transform: "translateX(-50%)",
					cursor: "grab",
					touchAction: "none",
					userSelect: "none",
				}}
			>
				{/* 6-dot grip icon */}
				<svg
					width="12"
					height="10"
					viewBox="0 0 12 10"
					fill="currentColor"
					aria-hidden
				>
					<circle cx="3" cy="2" r="1" />
					<circle cx="9" cy="2" r="1" />
					<circle cx="3" cy="5" r="1" />
					<circle cx="9" cy="5" r="1" />
					<circle cx="3" cy="8" r="1" />
					<circle cx="9" cy="8" r="1" />
				</svg>
			</div>
		</>
	);
}

// ─── Main component ─────────────────────────────────────────────────────────

/**
 * DragHandles renders an absolute-positioned overlay over the selected block
 * that provides 8 resize handles and a center-top move handle.
 *
 * Mount this inside the same scrollable container that wraps [data-block-id]
 * nodes, passing that container's ref as `containerRef`.
 */
export function DragHandles({ containerRef }: Props) {
	const { selectedBlockId } = useSelection();
	const blocks = useEditorStore((s) => s.blocks);
	const [rect, setRect] = useState<Rect | null>(null);
	const rafRef = useRef<number | null>(null);

	const { startResize, isDragging, dropIndex } = useDrag(containerRef);

	// ── Track selected block rect ────────────────────────────────────────

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
	}, [containerRef, measure, selectedBlockId, blocks]);

	// ── Bail early ────────────────────────────────────────────────────────

	if (!selectedBlockId || !rect) return null;

	// ── Render ────────────────────────────────────────────────────────────

	return (
		<div className="pointer-events-none absolute inset-0 z-[45]" aria-hidden>
			{/* Move handle (re-enables pointer events on itself) */}
			<div className="pointer-events-auto">
				<MoveHandle
					rect={rect}
					blockId={selectedBlockId}
					containerRef={containerRef}
					dropIndex={isDragging ? dropIndex : -1}
				/>
			</div>

			{/* Resize handles */}
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
						className="pointer-events-auto absolute"
						style={{
							left: visualLeft - hitPad,
							top: visualTop - hitPad,
							width: TOUCH_TARGET,
							height: TOUCH_TARGET,
							cursor,
							touchAction: "none",
							userSelect: "none",
							// Center the visible square within the touch-target
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{/* Visible square */}
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
