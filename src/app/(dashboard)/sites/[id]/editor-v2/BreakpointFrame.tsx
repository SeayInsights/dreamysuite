/* eslint-disable react-hooks/static-components */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { animate } from "motion/mini";
import { useShallow } from "zustand/react/shallow";

import { useEditorStore, type Breakpoint } from "@/app/stores/editorStore";
import { duration, EASING } from "@/lib/animation/motion";
import type { ThemeColors, ThemeTypography } from "@/app/stores/slices/theme";
import { getEffectComponent } from "@/lib/effects/loader";
import { useEffectsEnabled } from "@/lib/effects/performance";
import { IframeCanvas } from "./IframeCanvas";
import { SelectionLayer } from "./SelectionLayer";

const ScaleContext = createContext(1);
export const useCanvasScale = () => useContext(ScaleContext);

const WIDTHS: Record<Breakpoint, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};
export const FRAME_PADDING_PX = 16;

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

export type EditorBgImageLayer = "overlay" | "full-page" | "content";

function percentValue(
  value: number | string | null | undefined,
  fallback: number,
): number {
  if (value == null || value === "") return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function resolveEditorBgImageLayer(
  bgImageLayer: string | null | undefined,
  bgImageBleed: number | string | null | undefined,
): EditorBgImageLayer {
  const layer = bgImageLayer?.trim().toLowerCase();
  if (layer === "overlay") return "overlay";
  if (
    layer === "content" ||
    layer === "content-only" ||
    layer === "content_only"
  ) {
    return "content";
  }
  if (layer === "full-page" || layer === "fullpage" || layer === "page") {
    return "full-page";
  }
  return Number(bgImageBleed) === 0 ? "content" : "full-page";
}

export function editorBgImageStyle({
  bgImage,
  bgImageZoom,
  bgImagePositionX,
  bgImagePositionY,
}: {
  bgImage: string;
  bgImageZoom?: number | string | null;
  bgImagePositionX?: number | string | null;
  bgImagePositionY?: number | string | null;
}): React.CSSProperties {
  return {
    backgroundImage: `url('${bgImage}')`,
    backgroundSize: `${percentValue(bgImageZoom, 100)}% 100%`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: `${percentValue(bgImagePositionX, 50)}% ${percentValue(bgImagePositionY, 50)}%`,
  };
}

export function getFrameScale(
  availableWidth: number,
  canonicalWidth: number,
): number {
  if (canonicalWidth <= 0) return 1;
  return Math.min(1, Math.max(0, availableWidth) / canonicalWidth);
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
  const [iframeDoc, setIframeDoc] = useState<Document | null>(null);
  const breakpoint = useEditorStore((s) => s.breakpoint);
  const themeTokens = useEditorStore((s) => s.themeTokens);
  const settings = useEditorStore(
    useShallow((s) => ({
      pageBgDisabled: s.settings.pageBgDisabled,
      effectBg: s.settings.effectBg,
      effectCursor: s.settings.effectCursor,
      effectDecoration: s.settings.effectDecoration,
      effectTransition: s.settings.effectTransition,
      effectColor1: s.settings.effectColor1,
      effectColor2: s.settings.effectColor2,
      effectColor3: s.settings.effectColor3,
      effectBleed: s.settings.effectBleed,
      marginTop: s.settings.marginTop,
      marginRight: s.settings.marginRight,
      marginBottom: s.settings.marginBottom,
      marginLeft: s.settings.marginLeft,
      bgColor: s.settings.bgColor,
      bgImage: s.settings.bgImage,
      bgImageLayer: s.settings.bgImageLayer,
      bgImageOpacity: s.settings.bgImageOpacity,
      bgImageBleed: s.settings.bgImageBleed,
      bgImageZoom: s.settings.bgImageZoom,
      bgImagePositionX: s.settings.bgImagePositionX,
      bgImagePositionY: s.settings.bgImagePositionY,
    })),
  );
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

  useEffect(() => {
    useEditorStore.getState().setContentDocument(iframeDoc);
    return () => useEditorStore.getState().setContentDocument(null);
  }, [iframeDoc]);

  useEffect(() => {
    if (!iframeDoc) return;
    function forward(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.isContentEditable) return;
      window.dispatchEvent(
        new KeyboardEvent(e.type, {
          key: e.key,
          code: e.code,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
          bubbles: true,
        }),
      );
    }
    iframeDoc.addEventListener("keydown", forward);
    iframeDoc.addEventListener("keyup", forward);
    return () => {
      iframeDoc.removeEventListener("keydown", forward);
      iframeDoc.removeEventListener("keyup", forward);
    };
  }, [iframeDoc]);

  useEffect(() => {
    if (!iframeDoc) return;
    function forwardMouse(e: MouseEvent) {
      window.dispatchEvent(
        new MouseEvent(e.type, {
          clientX: e.clientX,
          clientY: e.clientY,
          button: e.button,
          bubbles: true,
        }),
      );
    }
    const events = ["mousemove", "mousedown", "mouseup"] as const;
    for (const evt of events) iframeDoc.addEventListener(evt, forwardMouse);
    return () => {
      for (const evt of events)
        iframeDoc.removeEventListener(evt, forwardMouse);
    };
  }, [iframeDoc]);

  const outerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(1280);
  const [frameReady, setFrameReady] = useState(false);
  const [navHeight, setNavHeight] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const isDesktop = breakpoint === "desktop";

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setAvailableWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
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
    const target = { width: `${WIDTHS[breakpoint]}px` };
    const anim = animate(el, target, { duration: dur, ease: EASING.standard });
    anim.finished.then(() => window.dispatchEvent(new Event("resize")));
  }, [breakpoint]);

  const googleFontsHref = useMemo(() => {
    const fonts = [
      themeTokens.typography.headingFont,
      themeTokens.typography.bodyFont,
    ]
      .map((f) => f.split(",")[0].trim())
      .filter((f) => !SYSTEM_FONTS.has(f) && GFONTS_MAP[f])
      .filter((f, i, a) => a.indexOf(f) === i);
    if (!fonts.length) return null;
    return `https://fonts.googleapis.com/css2?${fonts.map((f) => `family=${GFONTS_MAP[f]}`).join("&")}&display=swap`;
  }, [themeTokens.typography.headingFont, themeTokens.typography.bodyFont]);

  const canonicalWidth = WIDTHS[breakpoint];
  const scaleFactor = getFrameScale(availableWidth, canonicalWidth);

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
  const bgImageLayer = resolveEditorBgImageLayer(
    settings.bgImageLayer,
    settings.bgImageBleed,
  );
  const bgImageBaseStyle = bgImage
    ? editorBgImageStyle({
        bgImage,
        bgImageZoom: settings.bgImageZoom,
        bgImagePositionX: settings.bgImagePositionX,
        bgImagePositionY: settings.bgImagePositionY,
      })
    : null;
  const effectBleed = settings.effectBleed !== 0; // default true (1)

  return (
    <div
      ref={outerRef}
      className="box-border flex h-full w-full items-start justify-center overflow-hidden"
      style={{
        background: isDesktop
          ? "linear-gradient(135deg, #f8f7f5 0%, #ede9e3 100%)"
          : "rgb(var(--site-muted) / 0.4)",
        padding: FRAME_PADDING_PX,
      }}
      onClick={handleDeselect}
    >
      <ScaleContext.Provider value={scaleFactor}>
        <div
          style={{
            width: `${canonicalWidth * scaleFactor}px`,
            height: "100%",
            overflow: "hidden",
          }}
        >
          <div
            ref={ref}
            data-breakpoint={breakpoint}
            className="relative h-full overflow-hidden"
            style={{
              width: `${canonicalWidth}px`,
              transform: scaleFactor < 1 ? `scale(${scaleFactor})` : undefined,
              transformOrigin: "top left",
              borderRadius: "8px",
              border: isDesktop
                ? "1px solid rgba(0,0,0,0.06)"
                : "1px solid #e7e5e4",
              boxShadow: isDesktop
                ? "0 4px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)"
                : "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <IframeCanvas
              breakpoint={breakpoint}
              themeStyles={siteThemeVars(
                themeTokens.colors,
                themeTokens.typography,
              )}
              background={pageBgDisabled ? "transparent" : curtainBg}
              googleFontsHref={googleFontsHref}
              onDocumentReady={setIframeDoc}
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
              <div
                className="editor-canvas-scroll relative h-full overflow-x-hidden overflow-y-auto"
                style={{ zIndex: 10 }}
              >
                <div
                  style={{
                    position: "relative",
                    minHeight: "100%",
                    ...(bgImageBaseStyle &&
                    bgImageLayer === "content" &&
                    !pageBgDisabled
                      ? bgImageBaseStyle
                      : {}),
                    padding: `${isDesktop ? mT : mT + navHeight}px ${mR}px ${mB}px ${mL}px`,
                    overflow: "hidden",
                  }}
                >
                  {bgImageBaseStyle &&
                    bgImageLayer !== "content" &&
                    !pageBgDisabled && (
                      <div
                        className="pointer-events-none absolute overflow-hidden"
                        style={{
                          zIndex: 0,
                          top: bgImageBleed ? 0 : mT,
                          right: bgImageBleed ? 0 : mR,
                          bottom: bgImageBleed ? 0 : mB,
                          left: bgImageBleed ? 0 : mL,
                          ...bgImageBaseStyle,
                          opacity: bgImageOpacity,
                        }}
                      />
                    )}
                  <div style={{ position: "relative", zIndex: 1 }}>
                    {children}
                  </div>
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
                        style={{
                          height: mT,
                          background: curtainBg,
                          zIndex: 20,
                        }}
                      />
                    )}
                    {mB > 0 && (
                      <div
                        className="pointer-events-none absolute bottom-0 left-0 right-0"
                        style={{
                          height: mB,
                          background: curtainBg,
                          zIndex: 20,
                        }}
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
            </IframeCanvas>
            <SelectionLayer contentDocument={iframeDoc} />
          </div>
        </div>
      </ScaleContext.Provider>
    </div>
  );
}
