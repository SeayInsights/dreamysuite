"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate } from "motion/mini";

import { useEditorStore, type Breakpoint } from "@/app/stores/editorStore";
import { duration, EASING } from "@/lib/motion";

const WIDTHS: Record<Breakpoint, number> = {
	desktop: 1280,
	tablet: 768,
	mobile: 390,
};

interface Props {
	children?: ReactNode;
}

/**
 * Viewport-constrained canvas frame.
 *
 * Animates width changes when the breakpoint toggle switches. The frame is a
 * horizontally centered card; the canvas mounts inside it.
 */
export function BreakpointFrame({ children }: Props) {
	const ref = useRef<HTMLDivElement>(null);
	const breakpoint = useEditorStore((s) => s.breakpoint);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const target = WIDTHS[breakpoint];
		animate(
			el,
			{ width: `${target}px` },
			{
				duration: duration("traySlide") / 1000,
				ease: EASING.standard,
			},
		);
	}, [breakpoint]);

	return (
		<div className="flex h-full w-full justify-center overflow-auto bg-muted/40 p-6">
			<div
				ref={ref}
				data-breakpoint={breakpoint}
				className="relative min-h-full max-w-full rounded-lg border border-border bg-background shadow-sm"
				style={{ width: WIDTHS[breakpoint] }}
			>
				{children}
			</div>
		</div>
	);
}
