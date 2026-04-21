"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useEditorStore } from "@/app/stores/editorStore";
import { flushOps } from "./useBlockSync";

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
	/** The most-recent config patch applied during this drag (committed on pointerup). */
	lastConfig?: Record<string, unknown>;
}

// ─── Snap helpers ─────────────────────────────────────────────────────────

const COLUMNS = 12;
const COL_PCT = 100 / COLUMNS; // 8.3333…%
const SNAP_THRESHOLD_PX = 8;
const GRID_SIZE_PX = 8; // Snap grid for move operations

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

function snapToGrid(value: number, gridSize: number, threshold: number): number {
	const nearest = Math.round(value / gridSize) * gridSize;
	if (Math.abs(value - nearest) <= threshold) return nearest;
	return value;
}

function rectsOverlap(a: DOMRect, b: DOMRect): boolean {
	return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

function detectCollisions(
	blockId: string,
	newBounds: DOMRect,
	allBlocks: Array<{ id: string; type: string; config: Record<string, unknown> }>,
	container: HTMLElement,
): string[] {
	const collisions: string[] = [];
	for (const block of allBlocks) {
		if (block.id === blockId) continue;
		const el = container.querySelector<HTMLElement>(`[data-block-id="${block.id}"]`);
		if (!el) continue;
		const otherBounds = el.getBoundingClientRect();
		if (rectsOverlap(newBounds, otherBounds)) {
			collisions.push(block.id);
		}
	}
	return collisions;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useDrag(
	containerRef: React.RefObject<HTMLElement | null>,
): { isDragging: boolean; draggedId: string | null; collidingIds: string[]; startMove: (blockId: string, e: React.PointerEvent) => void; startResize: (blockId: string, handle: HandlePosition, e: React.PointerEvent) => void } {
	const blocks = useEditorStore((s) => s.blocks);
	const updateBlock = useEditorStore((s) => s.updateBlock);
	const setDrag = useEditorStore((s) => s.setDrag);
	const temporalStore = useEditorStore.temporal;

	const sessionRef = useRef<DragSession | null>(null);
	const cleanupRef = useRef<(() => void) | null>(null);

	const [isDragging, setIsDragging] = useState(false);
	const [draggedId, setDraggedId] = useState<string | null>(null);
	const collidingIds = useEditorStore((s) => s.collidingIds);
	const setCollidingIds = useEditorStore((s) => s.setCollidingIds);

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
			typeof rawMarginLeft === "number"
				? rawMarginLeft
				: typeof rawMarginLeft === "string"
					? parseFloat(rawMarginLeft) || 0
					: 0;

		const el = container.querySelector<HTMLElement>(
			`[data-block-id="${blockId}"]`,
		);
		const heightPx =
			typeof rawHeight === "number"
				? rawHeight
				: (() => {
						if (!el) return 0;
						const cs = window.getComputedStyle(el);
						const pt = parseFloat(cs.paddingTop) || 0;
						const pb = parseFloat(cs.paddingBottom) || 0;
						return Math.max(20, (el.offsetHeight || 0) - pt - pb);
					})();

		return { widthPct, marginLeftPct, heightPx };
	}

	// ── End drag ───────────────────────────────────────────────────────────

	const endDrag = useCallback(() => {
		const session = sessionRef.current;

		// Commit the drag as a single undo entry. Tracking was paused at drag
		// start; resuming re-enables it. The subsequent updateBlock call is the
		// one tracked write — exactly one history entry for the whole drag.
		if (session?.lastConfig !== undefined) {
			temporalStore.getState().resume();
			updateBlock(session.blockId, { config: session.lastConfig });
			// Flush immediately so the save isn't lost if the user navigates
			// away within the 1.5 s debounce window.
			const s = useEditorStore.getState();
			if (s.siteId && s.currentPageId) {
				flushOps(s.siteId, s.currentPageId, s.pendingOps, s.blocks);
			}
		} else {
			// No move happened (pointer up immediately) — just resume without
			// writing so no spurious history entry is created.
			temporalStore.getState().resume();
		}

		setDrag({ kind: null, id: null });
		sessionRef.current = null;
		setIsDragging(false);
		setDraggedId(null);
		setCollidingIds([]);

		if (cleanupRef.current) {
			cleanupRef.current();
			cleanupRef.current = null;
		}
	}, [setDrag, temporalStore, updateBlock]);

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
				// Apply snap-to-grid for move operations
				const rawX = (session.startOffsetX ?? 0) + dx;
				const rawY = (session.startOffsetY ?? 0) + dy;
				const newConfig = {
					...config,
					blockOffsetX: snapToGrid(rawX, GRID_SIZE_PX, SNAP_THRESHOLD_PX),
					blockOffsetY: snapToGrid(rawY, GRID_SIZE_PX, SNAP_THRESHOLD_PX),
				};
				session.lastConfig = newConfig;
				updateBlock(session.blockId, { config: newConfig });

				// Detect collisions with other blocks
				const container = containerRef.current;
				if (container) {
					const el = container.querySelector<HTMLElement>(`[data-block-id="${session.blockId}"]`);
					if (el) {
						const bounds = el.getBoundingClientRect();
						const collisions = detectCollisions(session.blockId, bounds, blocks, container);
						setCollidingIds(collisions);
					}
				}
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
						// blockMarginLeft intentionally not patched — preserves CSS centering
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
					const newConfig = { ...config, ...patch };
					session.lastConfig = newConfig;
					updateBlock(session.blockId, { config: newConfig });
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

		const preventSelect = (ev: Event) => ev.preventDefault();
		document.addEventListener("selectstart", preventSelect);
		document.body.style.userSelect = "none";

		const move = (ev: PointerEvent) => onPointerMove(ev);
		const up = () => {
			onPointerUp();
			document.removeEventListener("selectstart", preventSelect);
			document.body.style.userSelect = "";
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
		};

		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);

		cleanupRef.current = () => {
			document.removeEventListener("selectstart", preventSelect);
			document.body.style.userSelect = "";
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

			// Pause undo tracking for the duration of the drag. All intermediate
			// pointermove updates are silent; a single entry is committed on pointerup.
			temporalStore.getState().pause();

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
		[blocks, onPointerMove, onPointerUp, setDrag, temporalStore],
	);

	const startResize = useCallback(
		(blockId: string, handle: HandlePosition, e: React.PointerEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const container = containerRef.current;
			if (!container) return;

			const { widthPct, marginLeftPct, heightPx } = getBlockLayout(blockId, container);

			// Pause undo tracking for the duration of the resize. A single entry
			// is committed on pointerup.
			temporalStore.getState().pause();

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
		[blocks, containerRef, onPointerMove, onPointerUp, setDrag, temporalStore],
	);

	return { isDragging, draggedId, collidingIds, startMove, startResize };
}
