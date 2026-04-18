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
	nav?: ReactNode;
}

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

export function BreakpointFrame({ children, nav }: Props) {
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
	const CursorEffect = useMemo(
		() => (effectsEnabled.cursor && settings.effectCursor ? getEffectComponent(settings.effectCursor) : null),
		[effectsEnabled.cursor, settings.effectCursor],
	);
	const DecorationEffect = useMemo(
		() => (effectsEnabled.animations && settings.effectDecoration ? getEffectComponent(settings.effectDecoration) : null),
		[effectsEnabled.animations, settings.effectDecoration],
	);
	const TransitionEffect = useMemo(
		() => (effectsEnabled.transitions && settings.effectTransition ? getEffectComponent(settings.effectTransition) : null),
		[effectsEnabled.transitions, settings.effectTransition],
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
		sparkColor: settings.effectColor1 ?? themeTokens.colors.primary,
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

	const mT = Number(settings.marginTop ?? 0) || 0;
	const mR = Number(settings.marginRight ?? 0) || 0;
	const mB = Number(settings.marginBottom ?? 0) || 0;
	const mL = Number(settings.marginLeft ?? 0) || 0;
	const hasMargins = mT > 0 || mR > 0 || mB > 0 || mL > 0;
	const curtainBg = settings.bgColor ?? themeTokens.colors.background;

	return (
		<div
			className={`flex h-full w-full ${isDesktop ? "bg-background" : "justify-center bg-muted/40 p-6"}`}
			onClick={handleDeselect}
		>
			<div
				ref={ref}
				data-breakpoint={breakpoint}
				className={`relative max-w-full overflow-hidden ${isDesktop ? "h-full w-full" : "h-full rounded-lg border border-border shadow-sm"}`}
				style={{
					...(isDesktop ? {} : { width: WIDTHS[breakpoint] }),
					...themeVars(themeTokens.colors, themeTokens.typography),
					background: pageBgDisabled ? "transparent" : curtainBg,
				}}
			>
				{BgEffect && (
					<div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
						<BgEffect {...effectColors} />
					</div>
				)}
				<div className="editor-canvas-scroll relative h-full overflow-x-hidden overflow-y-auto" style={{ zIndex: 10 }}>
					<div style={{ padding: `${mT}px ${mR}px ${mB}px ${mL}px` }}>
						{children}
					</div>
				</div>
				{DecorationEffect && (
					<div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 15 }}>
						<DecorationEffect {...effectColors} />
					</div>
				)}
				{TransitionEffect && (
					<div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 16 }}>
						<TransitionEffect {...effectColors} />
					</div>
				)}
				{hasMargins && (
					<>
						{mT > 0 && <div className="pointer-events-none absolute left-0 right-0 top-0" style={{ height: mT, background: curtainBg, zIndex: 20 }} />}
						{mB > 0 && <div className="pointer-events-none absolute bottom-0 left-0 right-0" style={{ height: mB, background: curtainBg, zIndex: 20 }} />}
						{mL > 0 && <div className="pointer-events-none absolute bottom-0 left-0 top-0" style={{ width: mL, background: curtainBg, zIndex: 20 }} />}
						{mR > 0 && <div className="pointer-events-none absolute bottom-0 right-0 top-0" style={{ width: mR, background: curtainBg, zIndex: 20 }} />}
					</>
				)}
				{nav && (
					<div className="absolute left-0 right-0 top-0" style={{ zIndex: 30 }}>
						{nav}
					</div>
				)}
				{CursorEffect && (
					<div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 40 }}>
						<CursorEffect {...effectColors} />
					</div>
				)}
			</div>
		</div>
	);
}
