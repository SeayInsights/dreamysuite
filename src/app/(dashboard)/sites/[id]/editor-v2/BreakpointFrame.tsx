/* eslint-disable react-hooks/static-components */
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { animate } from "motion/mini";

import { useEditorStore, type Breakpoint } from "@/app/stores/editorStore";
import { duration, EASING } from "@/lib/animation/motion";
import type { ThemeColors, ThemeTypography } from "@/app/stores/slices/theme";
import { getEffectComponent } from "@/lib/effects/loader";
import { useEffectsEnabled } from "@/lib/effects/performance";

const WIDTHS: Record<Breakpoint, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

const GFONTS_MAP: Record<string, string> = {
  "Playfair Display": "Playfair+Display:wght@400;600",
  "Cormorant Garamond": "Cormorant+Garamond:wght@400;600",
  "EB Garamond": "EB+Garamond:wght@400;600",
  Lato: "Lato:wght@400;700",
  Merriweather: "Merriweather:wght@400;700",
  "Source Sans 3": "Source+Sans+3:wght@400;600",
  "Open Sans": "Open+Sans:wght@400;600",
};
const SYSTEM_FONTS = new Set(["Georgia", "Inter"]);

interface Props {
  children?: ReactNode;
  nav?: ReactNode;
}

function siteThemeVars(
  colors: ThemeColors,
  typography: ThemeTypography,
): React.CSSProperties {
  return {
    "--heading-color": colors.primary,
    "--site-muted": colors.secondary,
    "--site-accent": colors.accent,
    "--bg": colors.background,
    "--text": colors.text,
    "--heading-font": typography.headingFont,
    "--body-font": typography.bodyFont,
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
    if (
      !target.closest("[data-block-id]") &&
      !target.closest("[data-toolbar]")
    ) {
      useEditorStore.getState().selectBlock(null);
    }
  }, []);

  const BgEffect = useMemo(
    () =>
      effectsEnabled.backgrounds && settings.effectBg
        ? getEffectComponent(settings.effectBg)
        : null,
    [effectsEnabled.backgrounds, settings.effectBg],
  );
  const CursorEffect = useMemo(
    () =>
      effectsEnabled.cursor && settings.effectCursor
        ? getEffectComponent(settings.effectCursor)
        : null,
    [effectsEnabled.cursor, settings.effectCursor],
  );
  const DecorationEffect = useMemo(
    () =>
      effectsEnabled.animations && settings.effectDecoration
        ? getEffectComponent(settings.effectDecoration)
        : null,
    [effectsEnabled.animations, settings.effectDecoration],
  );
  const WRAPPER_TRANSITIONS = useMemo(
    () => new Set(["animated-content", "fade-content"]),
    [],
  );
  const TransitionEffect = useMemo(
    () =>
      effectsEnabled.transitions &&
      settings.effectTransition &&
      !WRAPPER_TRANSITIONS.has(settings.effectTransition)
        ? getEffectComponent(settings.effectTransition)
        : null,
    [
      effectsEnabled.transitions,
      settings.effectTransition,
      WRAPPER_TRANSITIONS,
    ],
  );

  const effectColors = useMemo(
    () => ({
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
    }),
    [
      settings.effectColor1,
      settings.effectColor2,
      settings.effectColor3,
      themeTokens.colors,
    ],
  );

  const [frameReady, setFrameReady] = useState(false);
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);
  const [navHeight, setNavHeight] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const isDesktop = breakpoint === "desktop";

  useEffect(() => {
    const updateDPR = () => {
      setDevicePixelRatio(window.devicePixelRatio || 1);
    };
    updateDPR();

    const mediaQuery = window.matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`,
    );
    const handler = () => updateDPR();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setFrameReady(true);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setNavHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const dur = duration("traySlide") / 1000;
    const safeDPR = isDesktop ? 1 : devicePixelRatio || 1;
    const normalizedWidth = WIDTHS[breakpoint] / safeDPR;
    const target = { width: `${normalizedWidth}px` };
    const anim = animate(el, target, { duration: dur, ease: EASING.standard });
    anim.finished.then(() => window.dispatchEvent(new Event("resize")));
  }, [breakpoint, devicePixelRatio, isDesktop]);

  useEffect(() => {
    const fonts = [
      themeTokens.typography.headingFont,
      themeTokens.typography.bodyFont,
    ]
      .map((f) => f.split(",")[0].trim())
      .filter((f) => !SYSTEM_FONTS.has(f) && GFONTS_MAP[f])
      .filter((f, i, a) => a.indexOf(f) === i);
    if (!fonts.length) return;
    const id = "editor-gfonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    const href = `https://fonts.googleapis.com/css2?${fonts.map((f) => `family=${GFONTS_MAP[f]}`).join("&")}&display=swap`;
    if (link) {
      link.href = href;
    } else {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  }, [themeTokens.typography.headingFont, themeTokens.typography.bodyFont]);

  const safeDPR = isDesktop ? 1 : devicePixelRatio || 1;
  const normalizedWidth = WIDTHS[breakpoint] / safeDPR;

  const rawMT = Number(settings.marginTop ?? 0) || 0;
  const rawMR = Number(settings.marginRight ?? 0) || 0;
  const rawMB = Number(settings.marginBottom ?? 0) || 0;
  const rawML = Number(settings.marginLeft ?? 0) || 0;

  const scale = WIDTHS[breakpoint] / WIDTHS.desktop;
  const hCap =
    breakpoint === "mobile" ? 10 : breakpoint === "tablet" ? 40 : Infinity;
  const mT = Math.round(rawMT * scale);
  const mR = Math.min(Math.round(rawMR * scale), hCap);
  const mB = Math.round(rawMB * scale);
  const mL = Math.min(Math.round(rawML * scale), hCap);
  const hasMargins = mT > 0 || mR > 0 || mB > 0 || mL > 0;
  const curtainBg = settings.bgColor ?? themeTokens.colors.background;
  const bgImage = settings.bgImage as string | null;
  const bgImageOpacity = Number(settings.bgImageOpacity ?? 1);
  const bgImageBleed = settings.bgImageBleed !== 0; // default true (1)
  const effectBleed = settings.effectBleed !== 0; // default true (1)

  return (
    <div
      className="flex h-full w-full justify-center items-center p-0"
      style={{
        background: isDesktop
          ? "linear-gradient(135deg, #f8f7f5 0%, #ede9e3 100%)"
          : "rgb(var(--site-muted) / 0.4)",
      }}
      onClick={handleDeselect}
    >
      <div
        ref={ref}
        data-breakpoint={breakpoint}
        className="relative max-w-full h-full overflow-hidden"
        style={{
          width: `${normalizedWidth}px`,
          borderRadius: "8px",
          border: isDesktop
            ? "1px solid rgba(0, 0, 0, 0.06)"
            : "1px solid rgb(var(--site-border))",
          boxShadow: isDesktop
            ? "0 4px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)"
            : "0 2px 8px rgba(0,0,0,0.04)",
          ...siteThemeVars(themeTokens.colors, themeTokens.typography),
          background: pageBgDisabled ? "transparent" : curtainBg,
        }}
      >
        {BgEffect && frameReady && (
          <div
            className="pointer-events-none absolute z-0 overflow-hidden"
            style={
              effectBleed
                ? { inset: 0 }
                : { top: mT, right: mR, bottom: mB, left: mL }
            }
          >
            <BgEffect {...effectColors} />
          </div>
        )}
        {bgImage && !pageBgDisabled && (
          <div
            className="pointer-events-none absolute overflow-hidden"
            style={{
              zIndex: 1,
              top: bgImageBleed ? 0 : mT,
              right: bgImageBleed ? 0 : mR,
              bottom: bgImageBleed ? 0 : mB,
              left: bgImageBleed ? 0 : mL,
              backgroundImage: `url('${bgImage}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: bgImageOpacity,
            }}
          />
        )}
        <div
          className="editor-canvas-scroll relative h-full overflow-x-hidden overflow-y-auto"
          style={{ zIndex: 10 }}
        >
          <div
            style={{
              padding: `${isDesktop ? mT : mT + navHeight}px ${mR}px ${mB}px ${mL}px`,
            }}
          >
            {children}
          </div>
        </div>
        {DecorationEffect && frameReady && (
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{ zIndex: 15 }}
          >
            <DecorationEffect {...effectColors} />
          </div>
        )}
        {TransitionEffect && (
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{ zIndex: 16 }}
          >
            <TransitionEffect {...effectColors} />
          </div>
        )}
        {hasMargins &&
          (!bgImage || !bgImageBleed) &&
          (!settings.effectBg || !effectBleed) && (
            <>
              {mT > 0 && (
                <div
                  className="pointer-events-none absolute left-0 right-0 top-0"
                  style={{ height: mT, background: curtainBg, zIndex: 20 }}
                />
              )}
              {mB > 0 && (
                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0"
                  style={{ height: mB, background: curtainBg, zIndex: 20 }}
                />
              )}
              {mL > 0 && (
                <div
                  className="pointer-events-none absolute bottom-0 left-0 top-0"
                  style={{ width: mL, background: curtainBg, zIndex: 20 }}
                />
              )}
              {mR > 0 && (
                <div
                  className="pointer-events-none absolute bottom-0 right-0 top-0"
                  style={{ width: mR, background: curtainBg, zIndex: 20 }}
                />
              )}
            </>
          )}
        {nav && (
          <div
            ref={navRef}
            className="absolute left-0 right-0 top-0"
            style={{ zIndex: 30 }}
          >
            {nav}
          </div>
        )}
        {CursorEffect && (
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{ zIndex: 40 }}
          >
            <CursorEffect {...effectColors} />
          </div>
        )}
      </div>
    </div>
  );
}
