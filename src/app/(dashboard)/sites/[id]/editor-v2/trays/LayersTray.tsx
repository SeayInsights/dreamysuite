"use client";

import { useRef, useState } from "react";
import { Eye, EyeOff, GripVertical, Layers } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";

const BLOCK_LABELS: Record<string, string> = {
	"home-hero": "Hero",
	couple: "Hero",
	header: "Header",
	"multi-text": "Text",
	video: "Video",
	countdown: "Countdown",
	images: "Images",
	youtube: "YouTube",
	spacer: "Spacer",
	"registry-card": "Registry",
	"hotel-card": "Hotel",
	"venue-map": "Venue Map",
	"photo-split": "Photo Split",
	"media-video": "Media Video",
	gallery: "Gallery",
	"info-card": "Info Card",
	"rsvp-form": "RSVP",
	"story-timeline": "Timeline",
	"guest-book": "Guest Book",
};

export function LayersTray() {
	const blocks = useEditorStore((s) => s.blocks);
	const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
	const selectBlock = useEditorStore((s) => s.selectBlock);
	const updateBlock = useEditorStore((s) => s.updateBlock);
	const reorderBlocks = useEditorStore((s) => s.reorderBlocks);

	const [dragIdx, setDragIdx] = useState<number | null>(null);
	const [overIdx, setOverIdx] = useState<number | null>(null);
	const dragRef = useRef<number | null>(null);

	function handleDragStart(e: React.DragEvent, idx: number) {
		dragRef.current = idx;
		setDragIdx(idx);
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", String(idx));
	}

	function handleDragOver(e: React.DragEvent, idx: number) {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		setOverIdx(idx);
	}

	function handleDrop(e: React.DragEvent, toIdx: number) {
		e.preventDefault();
		const fromIdx = dragRef.current;
		if (fromIdx !== null && fromIdx !== toIdx) {
			reorderBlocks(fromIdx, toIdx);
		}
		setDragIdx(null);
		setOverIdx(null);
		dragRef.current = null;
	}

	function handleDragEnd() {
		setDragIdx(null);
		setOverIdx(null);
		dragRef.current = null;
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Layers
				</h2>
				<span className="text-xs text-muted-foreground">{blocks.length}</span>
			</div>

			<div className="flex-1 overflow-y-auto p-2">
				{blocks.length === 0 ? (
					<p className="px-2 py-6 text-center text-xs text-muted-foreground">
						No blocks yet
					</p>
				) : (
					<ul className="space-y-0.5">
						{blocks.map((block, idx) => (
							<li
								key={block.id}
								draggable
								onDragStart={(e) => handleDragStart(e, idx)}
								onDragOver={(e) => handleDragOver(e, idx)}
								onDrop={(e) => handleDrop(e, idx)}
								onDragEnd={handleDragEnd}
								className={
									(dragIdx === idx ? "opacity-40 " : "") +
									(overIdx === idx && dragIdx !== idx
										? "border-t-2 border-primary "
										: "")
								}
							>
								<button
									type="button"
									onClick={() =>
										selectBlock(
											selectedBlockId === block.id ? null : block.id,
										)
									}
									className={
										"group flex w-full items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-sm transition-colors " +
										(selectedBlockId === block.id
											? "bg-accent text-accent-foreground"
											: "text-muted-foreground hover:bg-accent/50")
									}
								>
									<GripVertical className="size-3.5 shrink-0 cursor-grab opacity-30 group-hover:opacity-70" />
									<span className="flex-1 truncate">
										{BLOCK_LABELS[block.type] ?? block.type}
									</span>
									<span
										role="button"
										tabIndex={0}
										onClick={(e) => {
											e.stopPropagation();
											updateBlock(block.id, {
												isVisible: block.isVisible === 0 ? 1 : 0,
											});
										}}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												e.stopPropagation();
												updateBlock(block.id, {
													isVisible: block.isVisible === 0 ? 1 : 0,
												});
											}
										}}
										className="shrink-0 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
										title={
											block.isVisible === 0
												? "Show block"
												: "Hide block"
										}
									>
										{block.isVisible === 0 ? (
											<EyeOff className="size-3.5" />
										) : (
											<Eye className="size-3.5" />
										)}
									</span>
								</button>
							</li>
						))}
					</ul>
				)}
			</div>

			<div className="border-t border-border px-4 py-3">
				<p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
					<Layers className="size-3" />
					Drag to reorder · click to select · eye to toggle
				</p>
			</div>
		</div>
	);
}
