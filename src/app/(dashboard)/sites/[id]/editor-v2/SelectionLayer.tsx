"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { prefersReducedMotion, MOTION } from "@/lib/animation/motion";
import { parseCfg } from "@/lib/editableField";
import { useSelection } from "./hooks/useSelection";
import { useEditorStore } from "@/app/stores/editorStore";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  contentDocument: Document | null;
}

function findRect(doc: Document | null, id: string | null): Rect | null {
  if (!doc || !id) return null;
  const node = doc.querySelector<HTMLElement>(`[data-block-id="${id}"]`);
  if (!node) return null;

  const block = useEditorStore.getState().blocks.find((b) => b.id === id);
  const cfg = parseCfg(block?.config);
  const cd = cfg.cropDelta as
    | { top?: number; left?: number; right?: number; bottom?: number }
    | undefined;

  if (
    cd &&
    (cd.top ?? 0) + (cd.left ?? 0) + (cd.right ?? 0) + (cd.bottom ?? 0) > 0
  ) {
    const contentEl = node.querySelector<HTMLElement>("img, video") ?? node;
    const contentBox = contentEl.getBoundingClientRect();
    const t = cd.top ?? 0;
    const l = cd.left ?? 0;
    const r = cd.right ?? 0;
    const b = cd.bottom ?? 0;
    const isLegacy = t > 1 || l > 1 || r > 1 || b > 1;
    const cropT = isLegacy ? t : t * contentBox.height;
    const cropL = isLegacy ? l : l * contentBox.width;
    const cropR = isLegacy ? r : r * contentBox.width;
    const cropB = isLegacy ? b : b * contentBox.height;
    return {
      top: contentBox.top + cropT,
      left: contentBox.left + cropL,
      width: contentBox.width - cropL - cropR,
      height: contentBox.height - cropT - cropB,
    };
  }

  const box = node.getBoundingClientRect();
  return { top: box.top, left: box.left, width: box.width, height: box.height };
}

function labelFor(doc: Document | null, id: string | null): string | null {
  if (!doc || !id) return null;
  const node = doc.querySelector<HTMLElement>(`[data-block-id="${id}"]`);
  return node?.dataset.blockLabel ?? node?.dataset.blockType ?? "Block";
}

export function SelectionLayer({ contentDocument }: Props) {
  const { selectedBlockId, hoveredBlockId } = useSelection();
  const collidingIds = useEditorStore((s) => s.collidingIds);
  const breakpoint = useEditorStore((s) => s.breakpoint);
  const isCropping = useEditorStore((s) => s.isCropping);
  const accentColor =
    useEditorStore((s) => s.themeTokens.colors.accent) || "#B8921A";
  const [selectedRect, setSelectedRect] = useState<Rect | null>(null);
  const [hoverRect, setHoverRect] = useState<Rect | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [collisionRects, setCollisionRects] = useState<Map<string, Rect>>(
    new Map(),
  );
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    function measure() {
      setSelectedRect(findRect(contentDocument, selectedBlockId));
      setHoverRect(findRect(contentDocument, hoveredBlockId));
      setSelectedLabel(labelFor(contentDocument, selectedBlockId));
      setHoverLabel(labelFor(contentDocument, hoveredBlockId));

      const rects = new Map<string, Rect>();
      for (const id of collidingIds) {
        const r = findRect(contentDocument, id);
        if (r) rects.set(id, r);
      }
      setCollisionRects(rects);
    }
    measure();
    const onResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };

    window.addEventListener("resize", onResize);

    const scrollEl = contentDocument?.querySelector(".editor-canvas-scroll");
    scrollEl?.addEventListener("scroll", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      scrollEl?.removeEventListener("scroll", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    contentDocument,
    selectedBlockId,
    hoveredBlockId,
    collidingIds,
    breakpoint,
  ]);

  const hoverVisible =
    hoverRect && hoveredBlockId && hoveredBlockId !== selectedBlockId;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[var(--z-selection)] overflow-hidden"
      aria-hidden
    >
      {hoverVisible && (
        <Outline
          key={hoveredBlockId}
          rect={hoverRect}
          label={hoverLabel}
          variant="hover"
          accentColor={accentColor}
        />
      )}
      {selectedRect && !isCropping && (
        <Outline
          key={selectedBlockId}
          rect={selectedRect}
          label={selectedLabel}
          variant="selected"
          accentColor={accentColor}
        />
      )}
      {Array.from(collisionRects.entries()).map(([id, rect]) => (
        <div
          key={`collision-${id}`}
          className="absolute ring-2 ring-red-500 rounded-sm"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      ))}
    </div>
  );
}

interface OutlineProps {
  rect: Rect;
  label: string | null;
  variant: "hover" | "selected";
  accentColor: string;
}

function Outline({ rect, label, variant, accentColor }: OutlineProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    const dur = prefersReducedMotion() ? 0 : MOTION.selectionFade;
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
        "absolute",
        variant === "selected" ? "ring-2" : "ring-1 ring-dashed opacity-50",
      )}
      style={
        {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          "--tw-ring-color": accentColor,
        } as React.CSSProperties
      }
    >
      {label && (
        <span
          className="absolute -top-5 left-0 rounded-t-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
          style={{
            backgroundColor: accentColor,
            opacity: variant === "selected" ? 1 : 0.7,
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
