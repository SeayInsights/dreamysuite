"use client";

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { animate } from "motion/mini";

import { useEditorStore, type Breakpoint } from "@/app/stores/editorStore";
import { duration, EASING } from "@/lib/motion";
import type { ThemeColors, ThemeTypography } from "@/app/stores/slices/editorShell";
import { getEffectComponent } from "@/lib/effects/loader";
import { useEffectsEnabled } from "@/lib/effects/performance";

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
	const effectsEnabled = useEffectsEnabled();
	const handleDeselect = useCallback((e: React.MouseEvent) => {
		const target = e.target as HTMLElement;
		if (!target.closest("[data-block-id]") && !target.closest("[data-toolbar]")) {
			useEditorStore.getState().selectBlock(null);
		}
	}, []);
	const BgEffect = useMemo(
		() => (effectsEnabled.backgrounds && settings.effectBg ? getEffectComponent(settings.effectBg) : null),
		[effectsEnabled.backgrounds, settings.effectBg],
	);
	const effectColors = useMemo(() => ({
		color: settings.effectColor1 ?? themeTokens.colors.primary,
		colors: [
			settings.effectColor1 ?? themeTokens.colors.primary,
			settings.effectColor2 ?? themeTokens.colors.secondary,
			settings.effectColor3 ?? themeTokens.colors.accent,
		],
		lineColor: settings.effectColor1 ?? themeTokens.colors.primary,
		backgroundColor: "transparent",
		particleColors: [
			settings.effectColor1 ?? themeTokens.colors.primary,
			settings.effectColor2 ?? themeTokens.colors.secondary,
			settings.effectColor3 ?? themeTokens.colors.accent,
		],
	}), [settings.effectColor1, settings.effectColor2, settings.effectColor3, themeTokens.colors]);

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
		<div className={`editor-canvas-scroll flex h-full w-full overflow-x-hidden overflow-y-auto ${isDesktop ? "bg-background" : "justify-center bg-muted/40 p-6"}`} onClick={handleDeselect}>
			<div
				ref={ref}
				data-breakpoint={breakpoint}
				className={`relative min-h-full max-w-full overflow-hidden ${isDesktop ? "w-full" : "rounded-lg border border-border shadow-sm"}`}
				style={{
					...(isDesktop ? {} : { width: WIDTHS[breakpoint] }),
					...themeVars(themeTokens.colors, themeTokens.typography),
					background: pageBgDisabled ? "transparent" : (settings.bgColor ?? themeTokens.colors.background),
				}}
			>
				{BgEffect && (
					<div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" style={{ width: "100%", height: "100%" }}>
						<BgEffect {...effectColors} />
					</div>
				)}
				<div className="relative z-10">{children}</div>
			</div>
		</div>
	);
}
