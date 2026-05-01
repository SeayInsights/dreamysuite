"use client";

/**
 * ImageEditor
 *
 * Absolute-positioned overlay layer that activates on dblclick on any image-
 * bearing block (types: images, photo-split, home-hero, gallery).
 *
 * When active it renders:
 *   - A floating toolbar above the image with Replace / Crop / Filter / Animate
 *   - An inline photo-picker panel when Replace is active (instead of a modal)
 *   - CropHandles (when crop mode is toggled on) over the image element bounds
 *
 * Props
 *   containerRef - ref to the scrollable canvas container element
 *
 * Escape exits edit mode.
 */

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type RefObject,
} from "react";
import { useEditorStore } from "@/app/stores/editorStore";

// Constants

const IMAGE_BEARING_TYPES = new Set([
  "images",
  "photo-split",
  "home-hero",
  "gallery",
]);

// Types

interface ActiveImage {
  blockId: string;
  imageRect: DOMRect;
  blockRect: DOMRect;
}

// Helpers

function getViewportRect(element: HTMLElement): DOMRect {
  return element.getBoundingClientRect();
}

function findImageElement(blockRoot: HTMLElement): HTMLElement | null {
  const img = blockRoot.querySelector<HTMLImageElement>("img");
  if (img) return img;
  const walker = document.createTreeWalker(blockRoot, NodeFilter.SHOW_ELEMENT);
  let node: Node | null = walker.nextNode();
  while (node) {
    const el = node as HTMLElement;
    const bg = getComputedStyle(el).backgroundImage;
    if (bg && bg !== "none") return el;
    node = walker.nextNode();
  }
  return null;
}

// ImageEditor (main export)

interface Props {
  containerRef: RefObject<HTMLElement | null>;
  containerReady?: boolean;
}

export function ImageEditor({ containerRef, containerReady }: Props) {
  const [active, setActive] = useState<ActiveImage | null>(null);
  const [_activeBlockType, setActiveBlockType] = useState<string>("");
  const [cropMode, setCropModeLocal] = useState(false);
  const setIsCropping = useEditorStore((s) => s.setIsCropping);
  const setCropMode = useCallback(
    (v: boolean | ((prev: boolean) => boolean)) => {
      setCropModeLocal((prev) => {
        const next = typeof v === "function" ? v(prev) : v;
        setIsCropping(next);
        return next;
      });
    },
    [setIsCropping],
  );
  const [photoPanel, setPhotoPanel] = useState(false);
  const rafRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    setActive(null);
    setActiveBlockType("");
    setCropMode(false);
    setPhotoPanel(false);
  }, [setCropMode]);

  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (photoPanel) {
          setPhotoPanel(false);
        } else if (cropMode) {
          setCropMode(false);
        } else {
          dismiss();
        }
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [active, cropMode, photoPanel, dismiss, setCropMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handler = (e: MouseEvent) => {
      const blockRoot = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-block-id]",
      );
      if (!blockRoot) return;

      const blockId = blockRoot.dataset.blockId;
      const blockType = blockRoot.dataset.blockType;

      if (!blockId || !blockType || !IMAGE_BEARING_TYPES.has(blockType)) return;

      e.preventDefault();
      e.stopPropagation();

      const imageEl = findImageElement(blockRoot);
      const blockRect = getViewportRect(blockRoot);
      const imageRect = imageEl ? getViewportRect(imageEl) : blockRect;

      setActive({ blockId, imageRect, blockRect });
      setActiveBlockType(blockType);
      setCropMode(false);
      setPhotoPanel(false);
    };

    container.addEventListener("dblclick", handler);
    return () => container.removeEventListener("dblclick", handler);
  }, [containerRef, containerReady, setCropMode]);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const recompute = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const blockRoot = container.querySelector<HTMLElement>(
          `[data-block-id="${active.blockId}"]`,
        );
        if (!blockRoot) return;
        const imageEl = findImageElement(blockRoot);
        const blockRect = getViewportRect(blockRoot);
        const imageRect = imageEl ? getViewportRect(imageEl) : blockRect;
        setActive((prev) => (prev ? { ...prev, imageRect, blockRect } : prev));
      });
    };

    window.addEventListener("resize", recompute);
    document.addEventListener("scroll", recompute, true);
    return () => {
      window.removeEventListener("resize", recompute);
      document.removeEventListener("scroll", recompute, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, containerRef]);

  useEffect(() => {
    if (!active || photoPanel) return;

    const handler = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const blockRoot = container.querySelector<HTMLElement>(
        `[data-block-id="${active.blockId}"]`,
      );
      if (blockRoot && blockRoot.contains(e.target as Node)) return;
      const overlay = document.querySelector<HTMLElement>(
        "[data-image-editor-overlay]",
      );
      if (overlay && overlay.contains(e.target as Node)) return;
      dismiss();
    };

    document.addEventListener("mousedown", handler, true);
    window.addEventListener("mousedown", handler, true);
    return () => {
      document.removeEventListener("mousedown", handler, true);
      window.removeEventListener("mousedown", handler, true);
    };
  }, [active, photoPanel, dismiss, containerRef]);

  const activeBlockId = active?.blockId ?? null;
  const blockExists = useEditorStore(
    (s) =>
      activeBlockId !== null && s.blocks.some((b) => b.id === activeBlockId),
  );

  if (!blockExists && active) {
    Promise.resolve().then(dismiss);
    return null;
  }

  // Floating toolbar suppressed - image controls live in inspector Design > Content
  return null;
}
