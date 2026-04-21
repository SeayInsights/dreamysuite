"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

import { cn } from "@/lib/utils";
import { prefersReducedMotion, MOTION } from "@/lib/motion";
import { parseCfg } from "@/lib/editableField";
import { useSelection } from "./hooks/useSelection";
import { useEditorStore } from "@/app/stores/editorStore";

interface Rect {
	top: number;
	left: number;
	width: number;
	height: number;
}

/**
 * Overlay drawn on top of the canvas that renders hover and selection
 * outlines. It sits pointer-events:none so the canvas still receives raw
 * clicks; the canvas mount (Task 13) will call `useSelection().select()` /
 * `.hover()` based on its own hit-testing.
 *
 * This component queries the DOM for `[data-block-id]` nodes inside the
 * provided frame ref and mirrors their bounds relative to the frame.
 */
interface Props {
	frameRef: React.RefObject<HTMLElement | null>;
}

function findRect(
	frame: HTMLElement | null,
	id: string | null,
): Rect | null {
	if (!frame || !id) return null;
	const node = frame.querySelector<HTMLElement>(`[data-block-id="${id}"]`);
	if (!node) return null;
	const frameBox = frame.getBoundingClientRect();

	const block = useEditorStore.getState().blocks.find((b) => b.id === id);
	const cfg = parseCfg(block?.config);
	const cd = cfg.cropDelta as { top?: number; left?: number; right?: number; bottom?: number } | undefined;

	if (cd && ((cd.top ?? 0) + (cd.left ?? 0) + (cd.right ?? 0) + (cd.bottom ?? 0)) > 0) {
		const contentEl = node.querySelector<HTMLElement>("img, video") ?? node;
		const contentBox = contentEl.getBoundingClientRect();
		const t = cd.top ?? 0;
		const l = cd.left ?? 0;
		const r = cd.right ?? 0;
		const b = cd.bottom ?? 0;
		const isLegacy = t > 1 || l > 1 || r > 1 || b > 1;
		const cropT = isLegacy ? t : t * contentBox.height;
		const cropL = isLegacy ? l : l * contentBox.width;
		const cropR = isLegacy ? r : r * contentBox.width;
		const cropB = isLegacy ? b : b * contentBox.height;
		return {
			top: contentBox.top - frameBox.top + frame.scrollTop + cropT,
			left: contentBox.left - frameBox.left + frame.scrollLeft + cropL,
			width: contentBox.width - cropL - cropR,
			height: contentBox.height - cropT - cropB,
		};
	}

	const box = node.getBoundingClientRect();
	return {
		top: box.top - frameBox.top + frame.scrollTop,
		left: box.left - frameBox.left + frame.scrollLeft,
		width: box.width,
		height: box.height,
	};
}

function labelFor(frame: HTMLElement | null, id: string | null): string | null {
	if (!frame || !id) return null;
	const node = frame.querySelector<HTMLElement>(`[data-block-id="${id}"]`);
	return node?.dataset.blockLabel ?? node?.dataset.blockType ?? "Block";
}

export function SelectionLayer({ frameRef }: Props) {
	const { selectedBlockId, hoveredBlockId } = useSelection();
	const collidingIds = useEditorStore((s) => s.collidingIds);
	const breakpoint = useEditorStore((s) => s.breakpoint);
	const isCropping = useEditorStore((s) => s.isCropping);
	const [selectedRect, setSelectedRect] = useState<Rect | null>(null);
	const [hoverRect, setHoverRect] = useState<Rect | null>(null);
	const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
	const [hoverLabel, setHoverLabel] = useState<string | null>(null);
	const [collisionRects, setCollisionRects] = useState<Map<string, Rect>>(new Map());
	const rafRef = useRef<number | null>(null);

	useEffect(() => {
		function measure() {
			const frame = frameRef.current;
			setSelectedRect(findRect(frame, selectedBlockId));
			setHoverRect(findRect(frame, hoveredBlockId));
			setSelectedLabel(labelFor(frame, selectedBlockId));
			setHoverLabel(labelFor(frame, hoveredBlockId));

			const rects = new Map<string, Rect>();
			for (const id of collidingIds) {
				const r = findRect(frame, id);
				if (r) rects.set(id, r);
			}
			setCollisionRects(rects);
		}
		measure();
		const onResize = () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(measure);
		};
		window.addEventListener("resize", onResize);
		window.addEventListener("scroll", onResize, true);
		return () => {
			window.removeEventListener("resize", onResize);
			window.removeEventListener("scroll", onResize, true);
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [frameRef, selectedBlockId, hoveredBlockId, collidingIds, breakpoint]);

	const hoverVisible =
		hoverRect && hoveredBlockId && hoveredBlockId !== selectedBlockId;

	return (
		<div
			className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
			aria-hidden
		>
			{hoverVisible && (
				<Outline key={hoveredBlockId} rect={hoverRect} label={hoverLabel} variant="hover" />
			)}
			{selectedRect && !isCropping && (
				<Outline
					key={selectedBlockId}
					rect={selectedRect}
					label={selectedLabel}
					variant="selected"
					blockId={selectedBlockId}
				/>
			)}
			{Array.from(collisionRects.entries()).map(([id, rect]) => (
				<div
					key={`collision-${id}`}
					className="absolute ring-2 ring-red-500 rounded-sm"
					style={{
						top: rect.top,
						left: rect.left,
						width: rect.width,
						height: rect.height,
					}}
				/>
			))}
		</div>
	);
}

interface OutlineProps {
	rect: Rect;
	label: string | null;
	variant: "hover" | "selected";
	blockId?: string | null;
}

function Outline({ rect, label, variant, blockId }: OutlineProps) {
	const editingPanelBlockId = useEditorStore((s) => s.editingPanelBlockId);
	const setEditingPanel = useEditorStore((s) => s.setEditingPanel);
	const pencilActive = blockId != null && editingPanelBlockId === blockId;
	const ref = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		el.style.opacity = "0";
		const dur = prefersReducedMotion() ? 0 : MOTION.selectionFade;
		// setTimeout(0) guarantees the browser paints the opacity:0 frame before
		// the transition starts — a single rAF fires in the same batch and skips it.
		const timer = setTimeout(() => {
			if (!ref.current) return;
			ref.current.style.transition = `opacity ${dur}ms ease`;
			ref.current.style.opacity = "1";
		}, 0);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div
			ref={ref}
			className={cn(
				"absolute ring-1",
				variant === "selected"
					? "ring-2 ring-primary"
					: "ring-primary/40",
			)}
			style={{
				top: rect.top,
				left: rect.left,
				width: rect.width,
				height: rect.height,
			}}
		>
			{label && (
				<div className="absolute -top-5 left-0 flex items-end">
					<span
						className={cn(
							"rounded-t-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
							variant === "selected"
								? "bg-primary text-primary-foreground"
								: "bg-primary/70 text-primary-foreground",
						)}
					>
						{label}
					</span>
					{variant === "selected" && blockId && (
						<button
							type="button"
							aria-label="Edit block content"
							aria-pressed={pencilActive}
							className={cn(
								"pointer-events-auto ml-px flex h-[18px] w-[18px] items-center justify-center rounded-t-sm border border-b-0 transition-colors",
								pencilActive
									? "border-primary bg-primary text-primary-foreground"
									: "border-primary/30 bg-white text-primary hover:bg-primary/10",
							)}
							onPointerDown={(e) => e.stopPropagation()}
							onClick={(e) => {
								e.stopPropagation();
								if (pencilActive) {
									setEditingPanel(null);
									return;
								}
								const frame = document.querySelector<HTMLElement>(`[data-block-id="${blockId}"]`);
								const blockType = frame?.dataset.blockType;
								const IMAGE_TYPES = new Set(["images", "photo-split", "home-hero", "gallery"]);
								if (frame && blockType && IMAGE_TYPES.has(blockType)) {
									frame.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
								} else {
									setEditingPanel(blockId);
								}
							}}
						>
							<Pencil className="size-2.5" />
						</button>
					)}
				</div>
			)}
		</div>
	);
}
