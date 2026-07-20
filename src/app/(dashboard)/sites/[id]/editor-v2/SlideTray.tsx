"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";
import { useEditorStore } from "@/app/stores/editorStore";
import { prefersReducedMotion } from "@/lib/animation/motion";

const PagesTray = dynamic(() =>
  import("./trays/PagesTray").then((m) => ({ default: m.PagesTray })),
);
const ElementsTray = dynamic(() =>
  import("./trays/ElementsTray").then((m) => ({ default: m.ElementsTray })),
);
const LayersTray = dynamic(() =>
  import("./trays/LayersTray").then((m) => ({ default: m.LayersTray })),
);
const DesignThemeTray = dynamic(() =>
  import("./trays/DesignThemeTray").then((m) => ({
    default: m.DesignThemeTray,
  })),
);
const MediaTray = dynamic(() =>
  import("./trays/MediaTray").then((m) => ({ default: m.MediaTray })),
);
const LanguageTray = dynamic(() =>
  import("./trays/LanguageTray").then((m) => ({ default: m.LanguageTray })),
);
const SettingsTray = dynamic(() =>
  import("./trays/SettingsTray").then((m) => ({ default: m.SettingsTray })),
);

const ANIM_MS = 200;

interface Props {
  overlay?: boolean;
}

export function SlideTray({ overlay = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTray = useEditorStore((s) => s.openTray);
  const setOpenTray = useEditorStore((s) => s.setOpenTray);
  const railCollapsed = useEditorStore((s) => s.railCollapsed);

  // Set initial hidden state before first paint, then enable CSS transition.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateX(-60px)";
    el.style.pointerEvents = "none";
    const dur = prefersReducedMotion() ? 0 : ANIM_MS;
    const raf = requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.style.transition = `opacity ${dur}ms ease-out, transform ${dur}ms ease-out`;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Fade + nudge in / out (tray stays at its target x, never sweeps over the rail).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);

    if (openTray) {
      el.style.pointerEvents = "auto";
      el.style.opacity = "1";
      el.style.transform = "translateX(0px)";
    } else {
      el.style.opacity = "0";
      el.style.transform = "translateX(-60px)";
      const dur = prefersReducedMotion() ? 0 : ANIM_MS;
      closeTimer.current = setTimeout(() => {
        if (ref.current) ref.current.style.pointerEvents = "none";
      }, dur);
    }

    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [openTray]);

  // Close on outside click.
  useEffect(() => {
    if (!openTray) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (ref.current?.contains(target)) return;
      if (target.closest("[data-tray-trigger]")) return;
      if (target.closest("[data-topbar]")) return;
      // Full-screen tray content that portals to document.body (e.g. the Guests
      // panel) lives outside `ref`; treat clicks inside it as inside the tray so
      // interacting with it doesn't close the tray.
      if (target.closest("[data-tray-portal]")) return;
      setOpenTray(null);
    };
    const t = window.setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [openTray, setOpenTray]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-hidden={!openTray}
      className={cn(
        "h-full min-w-0 overflow-hidden border-r border-border bg-white shadow-xl",
        overlay
          ? "absolute bottom-0 top-0 z-[var(--z-modal)]"
          : "relative z-[var(--z-chrome)] w-full",
        !openTray && "border-r-0 shadow-none",
      )}
      style={
        overlay
          ? {
              gridColumn: 2,
              gridRow: 1,
              left: 0,
              width: railCollapsed
                ? "min(var(--editor-tray-w), 100vw)"
                : "min(var(--editor-tray-w), calc(100vw - var(--editor-rail-w)))",
            }
          : { gridColumn: 2, gridRow: 1 }
      }
    >
      {openTray === "pages" && <PagesTray />}
      {openTray === "elements" && <ElementsTray />}
      {openTray === "layers" && <LayersTray />}
      {(openTray === "navigation" || openTray === "theme") && (
        <DesignThemeTray />
      )}
      {(openTray === "photos" ||
        openTray === "videos" ||
        openTray === "music") && <MediaTray />}
      {openTray === "language" && <LanguageTray />}
      {openTray === "settings" && <SettingsTray />}
    </div>
  );
}
