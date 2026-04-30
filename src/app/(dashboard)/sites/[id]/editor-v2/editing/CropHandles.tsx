"use client";

/**
 * CropHandles
 *
 * Renders 8 resize/crop handles (4 corners + 4 edges) over an image element's
 * bounds. Each handle uses pointer capture so drags remain smooth even when the
 * pointer leaves the handle element.
 *
 * Props
 *   blockId  – store ID to write cropDelta into
 *   rect     – DOMRect of the image element, relative to the canvas container
 *
 * The cropDelta stored on the block represents normalized 0-1 insets from each
 * edge: { top, left, right, bottom } — e.g. top: 0.1 = crop 10% from top.
 */

import { useRef, useCallback, type RefObject } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";

export interface CropDelta {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

type HandlePosition =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w";

interface HandleDef {
  pos: HandlePosition;
  /** Tailwind classes to position the dot */
  cls: string;
  /** Which axes this handle moves */
  axes: {
    deltaTop?: 1 | -1;
    deltaLeft?: 1 | -1;
    deltaRight?: 1 | -1;
    deltaBottom?: 1 | -1;
  };
  cursor: string;
}

const HANDLES: HandleDef[] = [
  {
    pos: "nw",
    cls: "-top-1.5 -left-1.5",
    axes: { deltaTop: 1, deltaLeft: 1 },
    cursor: "cursor-nw-resize",
  },
  {
    pos: "n",
    cls: "-top-1.5 left-1/2 -translate-x-1/2",
    axes: { deltaTop: 1 },
    cursor: "cursor-n-resize",
  },
  {
    pos: "ne",
    cls: "-top-1.5 -right-1.5",
    axes: { deltaTop: 1, deltaRight: 1 },
    cursor: "cursor-ne-resize",
  },
  {
    pos: "e",
    cls: "top-1/2 -right-1.5 -translate-y-1/2",
    axes: { deltaRight: 1 },
    cursor: "cursor-e-resize",
  },
  {
    pos: "se",
    cls: "-bottom-1.5 -right-1.5",
    axes: { deltaBottom: 1, deltaRight: 1 },
    cursor: "cursor-se-resize",
  },
  {
    pos: "s",
    cls: "-bottom-1.5 left-1/2 -translate-x-1/2",
    axes: { deltaBottom: 1 },
    cursor: "cursor-s-resize",
  },
  {
    pos: "sw",
    cls: "-bottom-1.5 -left-1.5",
    axes: { deltaBottom: 1, deltaLeft: 1 },
    cursor: "cursor-sw-resize",
  },
  {
    pos: "w",
    cls: "top-1/2 -left-1.5 -translate-y-1/2",
    axes: { deltaLeft: 1 },
    cursor: "cursor-w-resize",
  },
];

interface Props {
  blockId: string;
  rect: DOMRect;
  containerRef: RefObject<HTMLElement | null>;
}

export function CropHandles({ blockId, rect, containerRef }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const blocks = useEditorStore((s) => s.blocks);

  // Read existing cropDelta so we accumulate correctly across drags
  const currentDelta = useRef<CropDelta>({ top: 0, left: 0, right: 0, bottom: 0 });

  // Sync currentDelta from store on each render, normalizing legacy pixel values
  const block = blocks.find((b) => b.id === blockId);
  const blockCfg = parseCfg(block?.config);
  if (blockCfg.cropDelta) {
    const cd = blockCfg.cropDelta as CropDelta;
    const isLegacy = cd.top > 1 || cd.left > 1 || cd.right > 1 || cd.bottom > 1;
    if (isLegacy) {
      const w = rect.width || 1;
      const h = rect.height || 1;
      currentDelta.current = {
        top: cd.top / h,
        left: cd.left / w,
        right: cd.right / w,
        bottom: cd.bottom / h,
      };
      updateBlock(blockId, { config: { ...blockCfg, cropDelta: currentDelta.current } });
    } else {
      currentDelta.current = { ...cd };
    }
  }

  const buildPointerHandlers = useCallback(
    (handle: HandleDef) => {
      let startX = 0;
      let startY = 0;
      let startDelta: CropDelta = { top: 0, left: 0, right: 0, bottom: 0 };

      const onPointerMove = (e: PointerEvent) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const { axes } = handle;

        const w = rect.width || 1;
        const h = rect.height || 1;

        const next: CropDelta = { ...startDelta };

        if (axes.deltaTop !== undefined) {
          next.top = Math.min(1, Math.max(0, startDelta.top + (dy * axes.deltaTop) / h));
        }
        if (axes.deltaBottom !== undefined) {
          next.bottom = Math.min(1, Math.max(0, startDelta.bottom - (dy * axes.deltaBottom) / h));
        }
        if (axes.deltaLeft !== undefined) {
          next.left = Math.min(1, Math.max(0, startDelta.left + (dx * axes.deltaLeft) / w));
        }
        if (axes.deltaRight !== undefined) {
          next.right = Math.min(1, Math.max(0, startDelta.right - (dx * axes.deltaRight) / w));
        }

        currentDelta.current = next;
        const block = useEditorStore.getState().blocks.find((b) => b.id === blockId);
        const cfg = parseCfg(block?.config);
        updateBlock(blockId, { config: { ...cfg, cropDelta: next } });
      };

      const onPointerUp = (e: PointerEvent) => {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        (e.target as HTMLElement).removeEventListener("pointermove", onPointerMove);
        (e.target as HTMLElement).removeEventListener("pointerup", onPointerUp);
      };

      const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();

        startX = e.clientX;
        startY = e.clientY;
        startDelta = { ...currentDelta.current };

        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        el.addEventListener("pointermove", onPointerMove);
        el.addEventListener("pointerup", onPointerUp);
      };

      return { onPointerDown };
    },
    [blockId, updateBlock, rect.width, rect.height],
  );

  const cd = currentDelta.current;
  const cropTop = cd.top * rect.height;
  const cropLeft = cd.left * rect.width;
  const cropRight = cd.right * rect.width;
  const cropBottom = cd.bottom * rect.height;

  return (
    <>
      {/* Dimmed overlay outside the crop region */}
      <div
        className="pointer-events-none absolute z-20"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          background: "rgba(0,0,0,0.45)",
          clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${(cd.left * 100)}% ${(cd.top * 100)}%, ${(cd.left * 100)}% ${((1 - cd.bottom) * 100)}%, ${((1 - cd.right) * 100)}% ${((1 - cd.bottom) * 100)}%, ${((1 - cd.right) * 100)}% ${(cd.top * 100)}%, ${(cd.left * 100)}% ${(cd.top * 100)}%)`,
        }}
        aria-hidden
      />
      {/* Crop handle container — tracks the cropped region */}
      <div
        className="pointer-events-none absolute z-20"
        style={{
          top: rect.top + cropTop,
          left: rect.left + cropLeft,
          width: rect.width - cropLeft - cropRight,
          height: rect.height - cropTop - cropBottom,
        }}
        aria-hidden
      >
        <div className="absolute inset-0 border-2 border-primary" />

      {HANDLES.map((handle) => {
        const handlers = buildPointerHandlers(handle);
        return (
          <div
            key={handle.pos}
            onPointerDown={handlers.onPointerDown}
            className={[
              "pointer-events-auto absolute h-3 w-3 rounded-sm",
              "border-2 border-primary bg-white shadow-sm",
              "transition-transform hover:scale-125",
              handle.cls,
              handle.cursor,
            ].join(" ")}
            style={{ touchAction: "none" }}
          />
        );
      })}
      </div>
    </>
  );
}
