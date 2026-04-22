"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";
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
	// Resize — frozen edges at pointerdown (derived from DOM rects)
	containerWidth?: number;
	hadBlockHeightAtStart?: boolean;
	leftEdgePct?: number;
	rightEdgePct?: number;
	topEdgePx?: number;
	bottomEdgePx?: number;
	naturalTopPx?: number;
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



	// ── End drag ───────────────────────────────────────────────────────────

	const endDrag = useCallback(() => {
		const session = sessionRef.current;

		// Commit the drag as a single undo entry. Tracking was paused at drag
		// start; resuming re-enables it. The subsequent updateBlock call is the
		// one tracked write — exactly one history entry for the whole drag.
		if (session?.lastConfig !== undefined) {
			temporalStore.getState().resume();

			const handle = session.handle;
			const affectsWidth = handle && ["nw", "ne", "e", "se", "sw", "w"].includes(handle);
			const affectsHeight = handle && ["nw", "n", "ne", "se", "s", "sw"].includes(handle);
			if (affectsWidth && !affectsHeight && !session.hadBlockHeightAtStart && session.lastConfig.blockHeight !== undefined) {
				delete session.lastConfig.blockHeight;
				delete session.lastConfig.blockOffsetY;
			}

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
				const config = parseCfg(block.config);
				const rawX = (session.startOffsetX ?? 0) + dx;
				const rawY = (session.startOffsetY ?? 0) + dy;
				const newConfig = {
					...config,
					blockOffsetX: snapToGrid(rawX, GRID_SIZE_PX, SNAP_THRESHOLD_PX),
					blockOffsetY: snapToGrid(rawY, GRID_SIZE_PX, SNAP_THRESHOLD_PX),
				};
				session.lastConfig = newConfig;
				updateBlock(session.blockId, { config: newConfig });

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

				if (affectsWidth && session.leftEdgePct !== undefined && session.rightEdgePct !== undefined) {
					const deltaPct = (dx / session.containerWidth) * 100;

					if (isWest) {
						const newLeftEdge = Math.max(0, Math.min(session.rightEdgePct - COL_PCT, session.leftEdgePct + deltaPct));
						patch.blockMarginLeft = newLeftEdge;
						patch.blockWidth = session.rightEdgePct - newLeftEdge;
						patch.blockOffsetX = 0;
					} else {
						const newRightEdge = session.rightEdgePct + deltaPct;
						patch.blockWidth = Math.max(COL_PCT, Math.min(100 - session.leftEdgePct, newRightEdge - session.leftEdgePct));
					}
				}

				if (affectsHeight && session.topEdgePx !== undefined && session.bottomEdgePx !== undefined && session.naturalTopPx !== undefined) {
					const isTop = ["nw", "n", "ne"].includes(handle);

					if (isTop) {
						const newTopEdge = Math.min(session.bottomEdgePx - 20, session.topEdgePx + dy);
						patch.blockOffsetY = Math.round(newTopEdge - session.naturalTopPx);
						patch.blockHeight = Math.round(session.bottomEdgePx - newTopEdge);
					} else {
						const newBottomEdge = session.bottomEdgePx + dy;
						patch.blockHeight = Math.round(Math.max(20, newBottomEdge - session.topEdgePx));
					}
				}

				if (Object.keys(patch).length > 0) {
					const liveBlock = useEditorStore.getState().blocks.find((b) => b.id === session.blockId);
					const liveConfig = parseCfg(liveBlock?.config);
					const newConfig = { ...liveConfig, ...patch };
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
			window.removeEventListener("pointercancel", up);
		};

		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
		window.addEventListener("pointercancel", up);

		cleanupRef.current = () => {
			document.removeEventListener("selectstart", preventSelect);
			document.body.style.userSelect = "";
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
			window.removeEventListener("pointercancel", up);
		};
	}

	// ── Public API ─────────────────────────────────────────────────────────

	const startMove = useCallback(
		(blockId: string, e: React.PointerEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const block = blocks.find((b) => b.id === blockId);
			const config = parseCfg(block?.config);

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

			const block = blocks.find((b) => b.id === blockId);
			const config = parseCfg(block?.config);

			const blockEl = container.querySelector<HTMLElement>(`[data-block-id="${blockId}"]`);
			if (!blockEl) return;

			const blockRect = blockEl.getBoundingClientRect();
			const containerRect = container.getBoundingClientRect();
			const containerWidth = containerRect.width;

			const leftEdgePct = ((blockRect.left - containerRect.left) / containerWidth) * 100;
			const rightEdgePct = ((blockRect.right - containerRect.left) / containerWidth) * 100;

			const topEdgePx = blockRect.top - containerRect.top;
			const bottomEdgePx = blockRect.bottom - containerRect.top;
			const currentOffsetY = typeof config.blockOffsetY === "number" ? config.blockOffsetY : 0;
			const naturalTopPx = topEdgePx - currentOffsetY;

			temporalStore.getState().pause();

			sessionRef.current = {
				kind: "resize",
				blockId,
				handle,
				startX: e.clientX,
				startY: e.clientY,
				containerWidth,
				hadBlockHeightAtStart: typeof config.blockHeight === "number",
				leftEdgePct,
				rightEdgePct,
				topEdgePx,
				bottomEdgePx,
				naturalTopPx,
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
