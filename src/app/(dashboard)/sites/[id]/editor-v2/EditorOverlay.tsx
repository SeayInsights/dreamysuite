"use client";

import { type ReactNode, type RefObject, useCallback, useRef } from "react";

import { useEditorStore } from "@/app/stores/editorStore";
import { useSelection } from "./hooks/useSelection";
import { useDrag } from "./hooks/useDrag";
import { SelectionLayer } from "./SelectionLayer";

const DRAG_THRESHOLD_PX = 4;

interface Props {
	children: ReactNode;
	containerRef: RefObject<HTMLDivElement | null>;
}

export function EditorOverlay({ children, containerRef }: Props) {
	const frameRef = containerRef;
	const { select, hover, clear } = useSelection();
	const { startMove } = useDrag(containerRef);

	// Track pointerdown state for drag-threshold detection on selected blocks.
	const pendingDragRef = useRef<{
		blockId: string;
		startX: number;
		startY: number;
		pointerId: number;
		dragging: boolean;
		// The React synthetic event can't be re-used after the handler returns,
		// so we capture the native PointerEvent for startMove.
		nativeEvent: PointerEvent;
	} | null>(null);

	const cancelPendingDrag = useCallback(() => {
		pendingDragRef.current = null;
	}, []);

	// Resolve the top-most (or next-in-cycle) block id from a pointer position.
	const resolveBlockId = useCallback(
		(clientX: number, clientY: number): string | null => {
			const seen = new Set<string>();
			const stackIds: string[] = [];
			for (const el of document.elementsFromPoint(clientX, clientY)) {
				const bid = (el as HTMLElement).closest<HTMLElement>("[data-block-id]")
					?.dataset.blockId;
				if (bid && !seen.has(bid)) {
					seen.add(bid);
					stackIds.push(bid);
				}
			}
			return stackIds[0] ?? null;
		},
		[],
	);

	return (
		<div
			ref={containerRef}
			className="editor-canvas-scroll relative min-h-full w-full overflow-x-hidden pb-8"
			// ── Single-click: selection cycling ──────────────────────────────
			onClick={(e) => {
				const currentId = useEditorStore.getState().selectedBlockId;

				const seen = new Set<string>();
				const stackIds: string[] = [];
				for (const el of document.elementsFromPoint(e.clientX, e.clientY)) {
					const bid = (el as HTMLElement).closest<HTMLElement>("[data-block-id]")?.dataset.blockId;
					if (bid && !seen.has(bid)) { seen.add(bid); stackIds.push(bid); }
				}

				if (stackIds.length === 0) { clear(); return; }

				const currentIdx = currentId ? stackIds.indexOf(currentId) : -1;
				if (currentIdx === -1) {
					select(stackIds[0]);
				} else if (stackIds.length === 1) {
					clear();
				} else {
					// Multiple overlapping blocks — cycle front-to-back on each click.
					select(stackIds[(currentIdx + 1) % stackIds.length]);
				}
			}}
			// ── Double-click: show floating toolbar ───────────────────────────
			onDoubleClick={(e) => {
				const blockId = resolveBlockId(e.clientX, e.clientY);
				if (!blockId) return;

				// Video blocks are handled exclusively by VideoInlineEditor — skip
				// the generic block toolbar so the two dblclick handlers don't fight.
				const blockEl = document.querySelector<HTMLElement>(`[data-block-id="${blockId}"]`);
				const blockType = blockEl?.dataset.blockType ?? "";
				if (blockType === "media-video" || blockType === "video" || blockType === "youtube") {
					return;
				}

				// Ensure the block is selected (in case dblclick skipped the click).
				const currentId = useEditorStore.getState().selectedBlockId;
				if (currentId !== blockId) {
					select(blockId);
				}
				// Always show the toolbar on dblclick — even when text editing also
				// activates (e.g. schedule/FAQ/travel inline editors).
				useEditorStore.getState().setBlockToolbarVisible(true);

				// If the target is a contentEditable node the browser takes over text
				// selection; nothing else needed from this handler.
				const target = e.target as HTMLElement;
				if (
					target.isContentEditable ||
					target.closest("[contenteditable='true']")
				) {
					return;
				}
			}}
			// ── Pointer down on a SELECTED block: start drag-threshold ────────
			onPointerDown={(e) => {
				const state = useEditorStore.getState();
				if (!state.selectedBlockId || state.drag.kind) return;

				const blockEl = (e.target as HTMLElement).closest<HTMLElement>("[data-block-id]");
				if (!blockEl || blockEl.dataset.blockId !== state.selectedBlockId) return;
				const currentId = state.selectedBlockId;

				pendingDragRef.current = {
					blockId: currentId,
					startX: e.clientX,
					startY: e.clientY,
					pointerId: e.pointerId,
					dragging: false,
					nativeEvent: e.nativeEvent,
				};
			}}
			onPointerMove={(e) => {
				if (useEditorStore.getState().drag.kind) return;

				const pending = pendingDragRef.current;
				if (pending && !pending.dragging && e.pointerId === pending.pointerId) {
					const dx = e.clientX - pending.startX;
					const dy = e.clientY - pending.startY;
					if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD_PX) {
						pending.dragging = true;
						startMove(pending.blockId, e);
						pendingDragRef.current = null;
					}
				}

				const id = (e.target as HTMLElement)
					.closest<HTMLElement>("[data-block-id]")
					?.dataset.blockId;
				hover(id ?? null);
			}}
			onPointerUp={cancelPendingDrag}
			onPointerCancel={cancelPendingDrag}
			onMouseLeave={() => hover(null)}
		>
			{children}
			<SelectionLayer frameRef={frameRef} />
		</div>
	);
}
