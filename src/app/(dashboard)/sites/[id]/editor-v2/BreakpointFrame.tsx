"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate } from "motion/mini";

import { useEditorStore, type Breakpoint } from "@/app/stores/editorStore";
import { duration, EASING } from "@/lib/motion";
import type { ThemeColors, ThemeTypography } from "@/app/stores/slices/editorShell";

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
function themeVars(colors: ThemeColors, typography: ThemeTypography): React.CSSProperties {
	return {
		"--theme-primary": colors.primary,
		"--theme-secondary": colors.secondary,
		"--theme-accent": colors.accent,
		"--theme-background": colors.background,
		"--theme-text": colors.text,
		"--theme-heading-font": typography.headingFont,
		"--theme-body-font": typography.bodyFont,
		"--theme-scale": String(typography.scale),
	} as React.CSSProperties;
}

export function BreakpointFrame({ children }: Props) {
	const ref = useRef<HTMLDivElement>(null);
	const breakpoint = useEditorStore((s) => s.breakpoint);
	const themeTokens = useEditorStore((s) => s.themeTokens);
	const settings = useEditorStore((s) => s.settings);
	const pageBgDisabled = !!settings.pageBgDisabled;

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (breakpoint === "desktop") {
			animate(el, { width: "100%" }, { duration: duration("traySlide") / 1000, ease: EASING.standard });
		} else {
			animate(el, { width: `${WIDTHS[breakpoint]}px` }, { duration: duration("traySlide") / 1000, ease: EASING.standard });
		}
	}, [breakpoint]);

	const isDesktop = breakpoint === "desktop";

	return (
		<div className={`flex h-full w-full overflow-auto ${isDesktop ? "bg-background" : "justify-center bg-muted/40 p-6"}`}>
			<div
				ref={ref}
				data-breakpoint={breakpoint}
				className={`relative min-h-full max-w-full ${isDesktop ? "w-full" : "rounded-lg border border-border shadow-sm"}`}
				style={{
					...(isDesktop ? {} : { width: WIDTHS[breakpoint] }),
					...themeVars(themeTokens.colors, themeTokens.typography),
					backgroundColor: pageBgDisabled ? "transparent" : (settings.bgColor ?? themeTokens.colors.background),
				}}
			>
				{children}
			</div>
		</div>
	);
}
