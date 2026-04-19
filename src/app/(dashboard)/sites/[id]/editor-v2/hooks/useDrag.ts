"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useEditorStore } from "@/app/stores/editorStore";

// ─── Types ─────────────────────────────────────────────────────────────────

export type HandlePosition =
	| "nw"
	| "n"
	| "ne"
	| "e"
	| "se"
	| "s"
	| "sw"
	| "w"
	| "move";

interface DragSession {
	kind: "move" | "resize";
	blockId: string;
	handle?: HandlePosition;
	startX: number;
	startY: number;
	// Move (free positioning)
	startOffsetX?: number;
	startOffsetY?: number;
	// Resize
	startWidthPct?: number;
	startMarginLeftPct?: number;
	startHeightPx?: number;
	containerWidth?: number;
}

// ─── Column snap ───────────────────────────────────────────────────────────

const COLUMNS = 12;
const COL_PCT = 100 / COLUMNS; // 8.3333…%
const SNAP_THRESHOLD_PX = 8;

function snapWidth(rawPct: number, containerWidth: number): number {
	const rawPx = (rawPct / 100) * containerWidth;
	const nearestCol = Math.round(rawPct / COL_PCT);
	const clampedCol = Math.max(1, Math.min(COLUMNS, nearestCol));
	const snappedPx = (clampedCol * COL_PCT * containerWidth) / 100;
	if (Math.abs(rawPx - snappedPx) <= SNAP_THRESHOLD_PX) {
		return clampedCol * COL_PCT;
	}
	const clampedRaw = Math.max(COL_PCT, Math.min(100, rawPct));
	return clampedRaw;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export interface UseDragReturn {
	isDragging: boolean;
	draggedId: string | null;
	startMove: (blockId: string, e: React.PointerEvent) => void;
	startResize: (
		blockId: string,
		handle: HandlePosition,
		e: React.PointerEvent,
	) => void;
}

export function useDrag(
	containerRef: React.RefObject<HTMLElement | null>,
): UseDragReturn {
	const blocks = useEditorStore((s) => s.blocks);
	const updateBlock = useEditorStore((s) => s.updateBlock);
	const setDrag = useEditorStore((s) => s.setDrag);

	const sessionRef = useRef<DragSession | null>(null);
	const cleanupRef = useRef<(() => void) | null>(null);

	const [isDragging, setIsDragging] = useState(false);
	const [draggedId, setDraggedId] = useState<string | null>(null);

	// ── Helpers ────────────────────────────────────────────────────────────

	function getBlockLayout(
		blockId: string,
		container: HTMLElement,
	): { widthPct: number; marginLeftPct: number; heightPx: number } {
		const block = blocks.find((b) => b.id === blockId);
		const config = block?.config ?? {};

		const rawWidth = config.blockWidth;
		const rawHeight = config.blockHeight;
		const rawMarginLeft = config.blockMarginLeft;

		const widthPct =
			typeof rawWidth === "number"
				? rawWidth
				: typeof rawWidth === "string"
					? parseFloat(rawWidth) || 100
					: 100;

		const marginLeftPct =
			typeof rawMarginLeft === "number" ? rawMarginLeft : 0;

		const el = container.querySelector<HTMLElement>(
			`[data-block-id="${blockId}"]`,
		);
		const heightPx =
			typeof rawHeight === "number"
				? rawHeight
				: (el?.offsetHeight ?? 0);

		return { widthPct, marginLeftPct, heightPx };
	}

	// ── End drag ───────────────────────────────────────────────────────────

	const endDrag = useCallback(() => {
		setDrag({ kind: null, id: null });
		sessionRef.current = null;
		setIsDragging(false);
		setDraggedId(null);

		if (cleanupRef.current) {
			cleanupRef.current();
			cleanupRef.current = null;
		}
	}, [setDrag]);

	// ── Pointer move ───────────────────────────────────────────────────────

	const onPointerMove = useCallback(
		(e: PointerEvent) => {
			const session = sessionRef.current;
			if (!session) return;

			const dx = e.clientX - session.startX;
			const dy = e.clientY - session.startY;

			if (session.kind === "move") {
				const block = blocks.find((b) => b.id === session.blockId);
				if (!block) return;
				const config = block.config;
				updateBlock(session.blockId, {
					config: {
						...config,
						blockOffsetX: (session.startOffsetX ?? 0) + dx,
						blockOffsetY: (session.startOffsetY ?? 0) + dy,
					},
				});
			} else if (session.kind === "resize" && session.handle) {
				const container = containerRef.current;
				if (!container || session.containerWidth === undefined) return;

				const handle = session.handle;
				const patch: Record<string, unknown> = {};

				const affectsWidth = ["nw", "ne", "e", "se", "sw", "w"].includes(handle);
				const affectsHeight = ["nw", "n", "ne", "se", "s", "sw"].includes(handle);
				const isWest = ["nw", "sw", "w"].includes(handle);

				if (affectsWidth && session.startWidthPct !== undefined && session.startMarginLeftPct !== undefined) {
					const deltaPct = (dx / session.containerWidth) * 100;

					if (isWest) {
						const newMargin = Math.max(0, session.startMarginLeftPct + deltaPct);
						const newWidth = session.startWidthPct - (newMargin - session.startMarginLeftPct);
						const clampedWidth = Math.max(COL_PCT, Math.min(100, newWidth));
						patch.blockMarginLeft = Math.max(0, Math.min(100 - clampedWidth, newMargin));
						patch.blockWidth = clampedWidth;
					} else {
						const rawPct = session.startWidthPct + deltaPct;
						const maxWidth = 100 - session.startMarginLeftPct;
						const clampedWidth = Math.max(COL_PCT, Math.min(maxWidth, rawPct));
						patch.blockWidth = clampedWidth;
						patch.blockMarginLeft = session.startMarginLeftPct;
					}
				}

				if (affectsHeight && session.startHeightPx !== undefined) {
					const sign = ["nw", "n", "ne"].includes(handle) ? -1 : 1;
					const newHeight = Math.max(20, session.startHeightPx + dy * sign);
					patch.blockHeight = Math.round(newHeight);
				}

				if (Object.keys(patch).length > 0) {
					const block = blocks.find((b) => b.id === session.blockId);
					const config = block?.config ?? {};

					updateBlock(session.blockId, {
						config: { ...config, ...patch },
					});
				}
			}
		},
		 
		[blocks, containerRef, updateBlock],
	);

	const onPointerUp = useCallback(() => {
		endDrag();
	}, [endDrag]);

	// ── Cleanup on unmount ─────────────────────────────────────────────────

	useEffect(() => {
		return () => {
			if (cleanupRef.current) {
				cleanupRef.current();
				cleanupRef.current = null;
			}
		};
	}, []);

	// ── Shared listener setup ─────────────────────────────────────────────

	function attachListeners(e: React.PointerEvent) {
		const target = e.currentTarget as HTMLElement;
		target.setPointerCapture(e.pointerId);

		const move = (ev: PointerEvent) => onPointerMove(ev);
		const up = () => {
			onPointerUp();
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
		};

		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);

		cleanupRef.current = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
		};
	}

	// ── Public API ─────────────────────────────────────────────────────────

	const startMove = useCallback(
		(blockId: string, e: React.PointerEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const block = blocks.find((b) => b.id === blockId);
			const config = block?.config ?? {};

			sessionRef.current = {
				kind: "move",
				blockId,
				startX: e.clientX,
				startY: e.clientY,
				startOffsetX: typeof config.blockOffsetX === "number" ? config.blockOffsetX : 0,
				startOffsetY: typeof config.blockOffsetY === "number" ? config.blockOffsetY : 0,
			};

			setDrag({ kind: "block", id: blockId });
			setIsDragging(true);
			setDraggedId(blockId);
			attachListeners(e);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[blocks, onPointerMove, onPointerUp, setDrag],
	);

	const startResize = useCallback(
		(blockId: string, handle: HandlePosition, e: React.PointerEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const container = containerRef.current;
			if (!container) return;

			const { widthPct, marginLeftPct, heightPx } = getBlockLayout(blockId, container);

			sessionRef.current = {
				kind: "resize",
				blockId,
				handle,
				startX: e.clientX,
				startY: e.clientY,
				startWidthPct: widthPct,
				startMarginLeftPct: marginLeftPct,
				startHeightPx: heightPx,
				containerWidth: container.offsetWidth,
			};

			setDrag({ kind: "block", id: blockId });
			setIsDragging(true);
			setDraggedId(blockId);
			attachListeners(e);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[blocks, containerRef, onPointerMove, onPointerUp, setDrag],
	);

	return { isDragging, draggedId, startMove, startResize };
}
