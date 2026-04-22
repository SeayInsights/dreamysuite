"use client";

import "@/styles/site-blocks.css";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { BLOCK_COMPONENTS } from "@/app/components/blocks";
import { parseCfg } from "@/lib/editableField";
import type { ThemeTokens } from "@/app/stores/slices/theme";

interface Block {
  id: string;
  type: string;
  config: Record<string, unknown>;
  sortOrder: number;
  isVisible: number;
  [key: string]: unknown;
}

interface Settings {
  bgColor?: string | null;
  bgImage?: string | null;
  bgImageOpacity?: number | null;
  sectionSpacing?: number | null;
}

interface Props {
  blocks: Block[];
  settings: Settings;
  theme: ThemeTokens;
  designedAtWidth?: number;
}

type ScaleMode = "desktop" | "proportional" | "reflow";

function useResponsiveScale(designedAtWidth: number) {
  const [mode, setMode] = useState<ScaleMode>("desktop");
  const [scale, setScale] = useState(1);

  const update = useCallback(() => {
    const vw = window.innerWidth;
    const s = vw / designedAtWidth;
    setScale(s);
    // PRO MODE: per-block breakpoint overrides will be applied here before proportional scaling
    if (s >= 1) setMode("desktop");
    else if (s > 0.6) setMode("proportional");
    else setMode("reflow");
  }, [designedAtWidth]);

  useEffect(() => {
    update();
    let timer: ReturnType<typeof setTimeout>;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(update, 100);
    };
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("resize", handler);
      clearTimeout(timer);
    };
  }, [update]);

  return { mode, scale };
}

function isDecorativeOffscreen(cfg: Record<string, unknown>, dw: number): boolean {
  const bw = typeof cfg.blockWidth === "number" ? cfg.blockWidth : 100;
  const ml = typeof cfg.blockMarginLeft === "number" ? cfg.blockMarginLeft : 0;
  const ox = typeof cfg.blockOffsetX === "number" ? cfg.blockOffsetX : 0;
  const widthPx = (bw / 100) * dw;
  if (widthPx <= 0) return false;
  const leftPx = (ml / 100) * dw + ox;
  const visLeft = Math.max(0, leftPx);
  const visRight = Math.min(dw, leftPx + widthPx);
  return Math.max(0, visRight - visLeft) / widthPx < 0.2;
}

export function PreviewContent({ blocks, settings, theme, designedAtWidth = 1440 }: Props) {
  const { mode, scale } = useResponsiveScale(designedAtWidth);
  const rendererRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "proportional" || !rendererRef.current) return;
    const els = rendererRef.current.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,dd,dt,label,strong,em,a,span,button");
    const cleanups: Array<() => void> = [];
    els.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const base = parseFloat(getComputedStyle(htmlEl).fontSize);
      const rendered = base * scale;
      if (rendered < 11) {
        const prev = htmlEl.style.fontSize;
        htmlEl.style.fontSize = `${11 / scale}px`;
        cleanups.push(() => { htmlEl.style.fontSize = prev; });
      }
    });
    return () => { cleanups.forEach((fn) => fn()); };
  }, [mode, scale]);

  useEffect(() => {
    if (mode !== "proportional" || !rendererRef.current) return;
    const container = rendererRef.current;
    const blockEls = Array.from(
      container.querySelectorAll<HTMLElement>(":scope > .block, :scope > [data-block-id]"),
    );
    if (blockEls.length < 2) return;

    for (const el of blockEls) el.style.removeProperty("margin-top");
    void container.offsetHeight;

    for (let i = 1; i < blockEls.length; i++) {
      let maxPush = 0;
      const cur = blockEls[i].getBoundingClientRect();
      for (let j = 0; j < i; j++) {
        const prev = blockEls[j].getBoundingClientRect();
        if (cur.left < prev.right && cur.right > prev.left && cur.top < prev.bottom) {
          maxPush = Math.max(maxPush, prev.bottom - cur.top + 8);
        }
      }
      if (maxPush > 0) {
        blockEls[i].style.marginTop = `${maxPush}px`;
      }
    }

    return () => {
      Array.from(container.querySelectorAll<HTMLElement>(":scope > .block, :scope > [data-block-id]"))
        .forEach((el) => el.style.removeProperty("margin-top"));
    };
  }, [mode, scale, blocks]);

  const themeVars = {
    "--theme-primary": theme.colors.primary,
    "--theme-secondary": theme.colors.secondary,
    "--theme-accent": theme.colors.accent,
    "--theme-background": theme.colors.background,
    "--theme-text": theme.colors.text,
    "--theme-heading-font": theme.typography.headingFont,
    "--theme-body-font": theme.typography.bodyFont,
    "--theme-scale": String(theme.typography.scale),
  } as CSSProperties;

  const gap = Number(settings.sectionSpacing ?? 0) || 0;
  const visible = blocks
    .filter((b) => b.isVisible !== 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const isReflow = mode === "reflow";
  const rendererStyle: CSSProperties = {
    position: "relative",
    zIndex: 2,
    ...(gap ? { display: "flex", flexDirection: "column", gap } : {}),
    ...(mode === "proportional" ? { zoom: scale } : {}),
    ...(isReflow ? { display: "flex", flexDirection: "column", padding: "0 10px" } : {}),
  };

  return (
    <div
      data-breakpoint="desktop"
      className={isReflow ? "ds-reflow" : mode === "proportional" ? "ds-proportional" : ""}
      style={{
        ...themeVars,
        backgroundColor: settings.bgColor ?? "#ffffff",
        minHeight: "100vh",
        position: "relative",
        ...(isReflow ? { overflowX: "hidden" as const } : {}),
      }}
    >
      {settings.bgImage && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${settings.bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: settings.bgImageOpacity ?? 1,
            zIndex: 1,
          }}
        />
      )}
      <div ref={rendererRef} className="site-renderer" style={rendererStyle}>
        {visible.map((block) => {
          const Component = BLOCK_COMPONENTS[block.type];
          if (!Component) return null;
          if (isReflow && isDecorativeOffscreen(parseCfg(block.config), designedAtWidth)) return null;
          return <Component key={block.id} block={block} />;
        })}
      </div>
      <style>{RESPONSIVE_CSS}</style>
    </div>
  );
}

const RESPONSIVE_CSS = `
/* === Proportional mode (tablet) === */
.ds-proportional .block {
  background-size: cover;
  background-position: center;
}

/* === Reflow mode (mobile) === */
.ds-reflow .block[data-block-id],
.ds-reflow .block {
  width: 100% !important;
  max-width: calc(100vw - 20px) !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  transform: none !important;
  height: auto !important;
  position: static !important;
  z-index: auto !important;
  padding-left: 10px !important;
  padding-right: 10px !important;
  box-sizing: border-box !important;
  background-size: cover !important;
  background-position: center !important;
}
.ds-reflow .block h1,
.ds-reflow .block h2,
.ds-reflow .block h3 {
  font-size: clamp(1.25rem, 5vw, 2.5rem) !important;
}
.ds-reflow .block p,
.ds-reflow .block li,
.ds-reflow .block dd,
.ds-reflow .block dt,
.ds-reflow .block label {
  font-size: clamp(0.875rem, 3.5vw, 1rem) !important;
}
.ds-reflow .block img,
.ds-reflow .block video {
  width: 100% !important;
  height: auto !important;
  max-height: 60vh !important;
  object-fit: cover !important;
}
.ds-reflow .block iframe {
  width: 100% !important;
}
.ds-reflow [style*="grid-template-columns"] {
  grid-template-columns: 1fr !important;
}

/* Schedule timeline — stack time above events on mobile */
.ds-reflow .timeline > [aria-hidden="true"] {
  display: none !important;
}
.ds-reflow .timeline-item {
  flex-direction: column !important;
  gap: 0.25rem !important;
  margin-bottom: 1rem !important;
  padding-bottom: 1rem !important;
  border-bottom: 1px solid var(--border, #e7e5e4);
}
.ds-reflow .timeline-item:last-child {
  border-bottom: none !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}
.ds-reflow .timeline-item > [aria-hidden="true"] {
  display: none !important;
}
.ds-reflow .timeline-time {
  width: auto !important;
  min-width: unset !important;
  text-align: left !important;
  flex-shrink: unset !important;
}
.ds-reflow .timeline-content {
  padding-left: 0 !important;
}
`;
