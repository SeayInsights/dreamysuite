"use client";

import { type ReactNode, type RefObject } from "react";

import { useEditorStore } from "@/app/stores/editorStore";
import { useSelection } from "./hooks/useSelection";
import { SelectionLayer } from "./SelectionLayer";

interface Props {
	children: ReactNode;
	containerRef: RefObject<HTMLDivElement | null>;
}

export function EditorOverlay({ children, containerRef }: Props) {
	const frameRef = containerRef;
	const { select, hover, clear } = useSelection();

	return (
		<div
			ref={containerRef}
			className="editor-canvas-scroll relative min-h-full w-full overflow-x-hidden pb-8"
			onClick={(e) => {
				const currentId = useEditorStore.getState().selectedBlockId;

				// Use elementsFromPoint so blocks with negative z-index (sent to back)
				// remain selectable even when visually behind other blocks.
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
			onMouseMove={(e) => {
				const id = (e.target as HTMLElement)
					.closest<HTMLElement>("[data-block-id]")
					?.dataset.blockId;
				hover(id ?? null);
			}}
			onMouseLeave={() => hover(null)}
		>
			{children}
			<SelectionLayer frameRef={frameRef} />
		</div>
	);
}
