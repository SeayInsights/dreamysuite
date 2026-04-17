"use client";

import { useRef, type ReactNode } from "react";

import { useSelection } from "./hooks/useSelection";
import { SelectionLayer } from "./SelectionLayer";

interface Props {
	children: ReactNode;
}

export function EditorOverlay({ children }: Props) {
	const frameRef = useRef<HTMLDivElement>(null);
	const { select, hover, clear } = useSelection();

	return (
		<div
			ref={frameRef}
			className="relative h-full w-full overflow-y-auto"
			onClick={(e) => {
				const id = (e.target as HTMLElement)
					.closest<HTMLElement>("[data-block-id]")
					?.dataset.blockId;
				if (id) select(id);
				else clear();
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
