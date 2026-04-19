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
				const id = (e.target as HTMLElement)
					.closest<HTMLElement>("[data-block-id]")
					?.dataset.blockId;
				if (id) {
					if (id === currentId) clear();
					else select(id);
				} else {
					clear();
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
