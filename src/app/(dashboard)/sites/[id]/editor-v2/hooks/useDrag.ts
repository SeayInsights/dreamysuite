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
	kind: "reorder" | "resize";
	blockId: string;
	handle?: HandlePosition;
	startX: number;
	startY: number;
	// Reorder
	fromIndex?: number;
	// Resize
	startWidthPct?: number;
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
	// Only snap if within threshold
	if (Math.abs(rawPx - snappedPx) <= SNAP_THRESHOLD_PX) {
		return clampedCol * COL_PCT;
	}
	// Still clamp without snapping
	const clampedRaw = Math.max(COL_PCT, Math.min(100, rawPct));
	return clampedRaw;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export interface UseDragReturn {
	isDragging: boolean;
	draggedId: string | null;
	/** Call from the move-handle's onPointerDown */
	startReorder: (blockId: string, e: React.PointerEvent) => void;
	/** Call from a resize handle's onPointerDown */
	startResize: (
		blockId: string,
		handle: HandlePosition,
		e: React.PointerEvent,
	) => void;
	/** Current drop-indicator index (insert before this block index); -1 = none */
	dropIndex: number;
}

/**
 * Pointer-based drag for block reorder and resize.
 *
 * containerRef must point to the scrollable canvas container that wraps all
 * [data-block-id] nodes. The hook attaches pointermove / pointerup to the
 * window during an active drag and cleans them up on end or unmount.
 */
export function useDrag(
	containerRef: React.RefObject<HTMLElement | null>,
): UseDragReturn {
	const blocks = useEditorStore((s) => s.blocks);
	const updateBlock = useEditorStore((s) => s.updateBlock);
	const setBlocks = useEditorStore((s) => s.setBlocks);
	const setDrag = useEditorStore((s) => s.setDrag);

	const sessionRef = useRef<DragSession | null>(null);
	const cleanupRef = useRef<(() => void) | null>(null);

	const [isDragging, setIsDragging] = useState(false);
	const [draggedId, setDraggedId] = useState<string | null>(null);
	const [dropIndex, setDropIndex] = useState(-1);

	// ── Helpers ────────────────────────────────────────────────────────────

	function getBlockRects(): Array<{ id: string; top: number; bottom: number }> {
		const container = containerRef.current;
		if (!container) return [];
		const containerBox = container.getBoundingClientRect();
		return Array.from(
			container.querySelectorAll<HTMLElement>("[data-block-id]"),
		).map((el) => {
			const box = el.getBoundingClientRect();
			return {
				id: el.dataset.blockId ?? "",
				top: box.top - containerBox.top + container.scrollTop,
				bottom: box.bottom - containerBox.top + container.scrollTop,
			};
		});
	}

	function computeDropIndex(y: number): number {
		const rects = getBlockRects();
		for (let i = 0; i < rects.length; i++) {
			const mid = (rects[i].top + rects[i].bottom) / 2;
			if (y < mid) return i;
		}
		return rects.length;
	}

	function getBlockLayout(
		blockId: string,
		container: HTMLElement,
	): { widthPct: number; heightPx: number } {
		const block = blocks.find((b) => b.id === blockId);
		const config =
			block && typeof block.config === "object" && block.config !== null
				? (block.config as Record<string, unknown>)
				: {};
		const layout =
			config.layout && typeof config.layout === "object"
				? (config.layout as Record<string, unknown>)
				: {};

		const rawWidth = layout.width;
		const rawHeight = layout.height;

		const widthPct =
			typeof rawWidth === "number"
				? rawWidth
				: typeof rawWidth === "string"
					? parseFloat(rawWidth) || 100
					: 100;

		const el = container.querySelector<HTMLElement>(
			`[data-block-id="${blockId}"]`,
		);
		const heightPx =
			typeof rawHeight === "number"
				? rawHeight
				: typeof rawHeight === "string" && rawHeight !== "auto"
					? parseFloat(rawHeight) || (el?.offsetHeight ?? 0)
					: (el?.offsetHeight ?? 0);

		return { widthPct, heightPx };
	}

	// ── End drag ───────────────────────────────────────────────────────────

	const endDrag = useCallback(() => {
		const session = sessionRef.current;
		if (!session) return;

		if (session.kind === "reorder" && session.fromIndex !== undefined) {
			const idx = dropIndex >= 0 ? dropIndex : session.fromIndex;
			if (idx !== session.fromIndex) {
				const next = [...blocks];
				const [moved] = next.splice(session.fromIndex, 1);
				// Adjust target index after removal
				const insertAt = idx > session.fromIndex ? idx - 1 : idx;
				next.splice(insertAt, 0, moved);
				setBlocks(next);
			}
		}

		setDrag({ kind: null, id: null });
		sessionRef.current = null;
		setIsDragging(false);
		setDraggedId(null);
		setDropIndex(-1);

		if (cleanupRef.current) {
			cleanupRef.current();
			cleanupRef.current = null;
		}
	}, [blocks, dropIndex, setBlocks, setDrag]);

	// ── Pointer move ───────────────────────────────────────────────────────

	const onPointerMove = useCallback(
		(e: PointerEvent) => {
			const session = sessionRef.current;
			if (!session) return;

			const dx = e.clientX - session.startX;
			const dy = e.clientY - session.startY;

			if (session.kind === "reorder") {
				const container = containerRef.current;
				if (!container) return;
				const containerBox = container.getBoundingClientRect();
				const relY =
					e.clientY - containerBox.top + container.scrollTop;
				setDropIndex(computeDropIndex(relY));
			} else if (session.kind === "resize" && session.handle) {
				const container = containerRef.current;
				if (!container || session.containerWidth === undefined) return;

				const handle = session.handle;
				const updates: Record<string, unknown> = {};

				// Width-affecting handles: nw, ne, e, se, sw, w
				const affectsWidth = ["nw", "ne", "e", "se", "sw", "w"].includes(
					handle,
				);
				// Height-affecting handles: nw, n, ne, se, s, sw
				const affectsHeight = ["nw", "n", "ne", "se", "s", "sw"].includes(
					handle,
				);

				if (affectsWidth && session.startWidthPct !== undefined) {
					// West handles invert the delta
					const sign = ["nw", "sw", "w"].includes(handle) ? -1 : 1;
					const deltaPct = (dx / session.containerWidth) * 100 * sign;
					const rawPct = session.startWidthPct + deltaPct;
					const snappedPct = snapWidth(rawPct, session.containerWidth);
					updates.width = snappedPct;
				}

				if (affectsHeight && session.startHeightPx !== undefined) {
					// North handles invert the delta
					const sign = ["nw", "n", "ne"].includes(handle) ? -1 : 1;
					const newHeight = Math.max(
						20,
						session.startHeightPx + dy * sign,
					);
					updates.height = Math.round(newHeight);
				}

				if (Object.keys(updates).length > 0) {
					const block = blocks.find((b) => b.id === session.blockId);
					const config =
						block && typeof block.config === "object" && block.config !== null
							? (block.config as Record<string, unknown>)
							: {};
					const existingLayout =
						config.layout && typeof config.layout === "object"
							? (config.layout as Record<string, unknown>)
							: {};

					updateBlock(session.blockId, {
						config: {
							...config,
							layout: { ...existingLayout, ...updates },
						},
					});
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
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

	// ── Public API ─────────────────────────────────────────────────────────

	const startReorder = useCallback(
		(blockId: string, e: React.PointerEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const fromIndex = blocks.findIndex((b) => b.id === blockId);

			sessionRef.current = {
				kind: "reorder",
				blockId,
				startX: e.clientX,
				startY: e.clientY,
				fromIndex,
			};

			setDrag({ kind: "block", id: blockId, fromIndex });
			setIsDragging(true);
			setDraggedId(blockId);

			// Capture pointer on the underlying native element
			const target = e.currentTarget as HTMLElement;
			target.setPointerCapture(e.pointerId);

			const move = (ev: PointerEvent) => onPointerMove(ev);
			const up = (ev: PointerEvent) => {
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
		},
		[blocks, onPointerMove, onPointerUp, setDrag],
	);

	const startResize = useCallback(
		(blockId: string, handle: HandlePosition, e: React.PointerEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const container = containerRef.current;
			if (!container) return;

			const { widthPct, heightPx } = getBlockLayout(blockId, container);

			sessionRef.current = {
				kind: "resize",
				blockId,
				handle,
				startX: e.clientX,
				startY: e.clientY,
				startWidthPct: widthPct,
				startHeightPx: heightPx,
				containerWidth: container.offsetWidth,
			};

			setDrag({ kind: "block", id: blockId });
			setIsDragging(true);
			setDraggedId(blockId);

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
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[blocks, containerRef, onPointerMove, onPointerUp, setDrag],
	);

	return { isDragging, draggedId, startReorder, startResize, dropIndex };
}
