"use client";

import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { useEditorStore } from "@/app/stores/editorStore";

/**
 * Ancestor trail shown bottom-left of the canvas.
 *
 * For now renders a single segment based on the selected block's type; once
 * the block tree supports columns/rows (Phase 3) this walks the parent chain
 * and each segment becomes selectable.
 */
export function Breadcrumb() {
	const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
	const blocks = useEditorStore((s) => s.blocks);
	const selectBlock = useEditorStore((s) => s.selectBlock);

	if (!selectedBlockId) return null;

	const selected = blocks.find((b) => b.id === selectedBlockId);
	const label =
		typeof selected?.type === "string"
			? selected.type
			: "Block";

	const segments = [
		{ id: null as string | null, label: "Page" },
		{ id: selectedBlockId, label },
	];

	return (
		<nav
			aria-label="Selection breadcrumb"
			className="pointer-events-auto absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-md border border-border bg-white/95 px-2 py-1 text-xs shadow-sm backdrop-blur"
		>
			{segments.map((seg, i) => {
				const isLast = i === segments.length - 1;
				return (
					<span key={`${seg.id ?? "root"}-${i}`} className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => selectBlock(seg.id)}
							className={cn(
								"rounded-sm px-1 transition-colors hover:bg-accent",
								isLast
									? "font-medium text-foreground"
									: "text-muted-foreground",
							)}
						>
							{seg.label}
						</button>
						{!isLast && (
							<ChevronRight
								className="size-3 text-muted-foreground/60"
								aria-hidden
							/>
						)}
					</span>
				);
			})}
		</nav>
	);
}
