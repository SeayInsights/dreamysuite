"use client";

/**
 * VideoInlineEditor
 *
 * Activates on dblclick on any video block (media-video, video, youtube).
 * Shows a floating toolbar with a "Video" button that opens an inline panel
 * for selecting from the media library or pasting a YouTube/Vimeo/GIF URL.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useEditorStore } from "@/app/stores/editorStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const VIDEO_BEARING_TYPES = new Set(["media-video", "video", "youtube"]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getViewportRect(element: HTMLElement): DOMRect {
  return element.getBoundingClientRect();
}

// ─── VideoInlineEditor (main export) ─────────────────────────────────────────

interface Props {
  containerRef: RefObject<HTMLElement | null>;
  containerReady?: boolean;
}

export function VideoInlineEditor({ containerRef, containerReady }: Props) {
  const [active, setActive] = useState<{
    blockId: string;
    blockRect: DOMRect;
  } | null>(null);
  const [videoPanel, setVideoPanel] = useState(false);
  const rafRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    setActive(null);
    setVideoPanel(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (videoPanel) {
          setVideoPanel(false);
        } else {
          dismiss();
        }
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [active, videoPanel, dismiss]);

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
      if (!blockId || !blockType || !VIDEO_BEARING_TYPES.has(blockType)) return;

      e.preventDefault();
      e.stopPropagation();

      const blockRect = getViewportRect(blockRoot);
      setActive({ blockId, blockRect });
      setVideoPanel(false);
    };

    container.addEventListener("dblclick", handler);
    return () => container.removeEventListener("dblclick", handler);
  }, [containerRef, containerReady]);

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
        const blockRect = getViewportRect(blockRoot);
        setActive((prev) => (prev ? { ...prev, blockRect } : prev));
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
    if (!active) return;
    const handler = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const blockRoot = container.querySelector<HTMLElement>(
        `[data-block-id="${active.blockId}"]`,
      );
      if (blockRoot && blockRoot.contains(e.target as Node)) return;
      // Both FloatingToolbar and InlineVideoPanel carry data-video-editor-overlay,
      // so any click inside either stops propagation before reaching here.
      // The querySelectorAll handles the case where both are mounted simultaneously.
      for (const overlay of document.querySelectorAll<HTMLElement>(
        "[data-video-editor-overlay]",
      )) {
        if (overlay.contains(e.target as Node)) return;
      }
      dismiss();
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [active, dismiss, containerRef]);

  const activeBlockId = active?.blockId ?? null;
  const blockExists = useEditorStore(
    (s) =>
      activeBlockId !== null && s.blocks.some((b) => b.id === activeBlockId),
  );
  if (!blockExists && active) {
    Promise.resolve().then(dismiss);
    return null;
  }

  // Floating toolbar suppressed — video controls live in inspector Design > Content
  return null;
}
