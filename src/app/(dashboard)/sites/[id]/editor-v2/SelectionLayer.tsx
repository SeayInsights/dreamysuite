"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { prefersReducedMotion, MOTION } from "@/lib/motion";
import { useSelection } from "./hooks/useSelection";

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
	const box = node.getBoundingClientRect();
	// getBoundingClientRect() is viewport-relative; the SelectionLayer lives in
	// content-space inside the scrollable frame, so add scroll offset to align.
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
	const [selectedRect, setSelectedRect] = useState<Rect | null>(null);
	const [hoverRect, setHoverRect] = useState<Rect | null>(null);
	const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
	const [hoverLabel, setHoverLabel] = useState<string | null>(null);
	const rafRef = useRef<number | null>(null);

	useEffect(() => {
		function measure() {
			const frame = frameRef.current;
			setSelectedRect(findRect(frame, selectedBlockId));
			setHoverRect(findRect(frame, hoveredBlockId));
			setSelectedLabel(labelFor(frame, selectedBlockId));
			setHoverLabel(labelFor(frame, hoveredBlockId));
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
	}, [frameRef, selectedBlockId, hoveredBlockId]);

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
			{selectedRect && (
				<Outline
					key={selectedBlockId}
					rect={selectedRect}
					label={selectedLabel}
					variant="selected"
				/>
			)}
		</div>
	);
}

interface OutlineProps {
	rect: Rect;
	label: string | null;
	variant: "hover" | "selected";
}

function Outline({ rect, label, variant }: OutlineProps) {
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
				<span
					className={cn(
						"absolute -top-5 left-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
						variant === "selected"
							? "bg-primary text-primary-foreground"
							: "bg-primary/70 text-primary-foreground",
					)}
				>
					{label}
				</span>
			)}
		</div>
	);
}
