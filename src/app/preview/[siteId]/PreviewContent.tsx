"use client";

import "@/styles/site-blocks.css";
import type { CSSProperties } from "react";
import { BLOCK_COMPONENTS } from "@/app/components/blocks";
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
}

export function PreviewContent({ blocks, settings, theme }: Props) {
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

  return (
    <div
      data-breakpoint="desktop"
      style={{
        ...themeVars,
        backgroundColor: settings.bgColor ?? "#ffffff",
        minHeight: "100vh",
        position: "relative",
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
      <div className="site-renderer" style={{ position: "relative", zIndex: 2, ...(gap ? { display: "flex", flexDirection: "column", gap } : {}) }}>
        {visible.map((block) => {
          const Component = BLOCK_COMPONENTS[block.type];
          if (!Component) return null;
          return <Component key={block.id} block={block} />;
        })}
      </div>
    </div>
  );
}
