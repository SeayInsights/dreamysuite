"use client";

/**
 * ImageEditor
 *
 * Absolute-positioned overlay layer that activates on dblclick on any image-
 * bearing block (types: images, photo-split, home-hero).
 *
 * When active it renders:
 *   - A floating toolbar above the image with Replace / Crop / Filter / Animate
 *   - CropHandles (when crop mode is toggled on) over the image element bounds
 *   - ReplaceMediaDialog when Replace is clicked
 *
 * Props
 *   containerRef – ref to the scrollable canvas container element (same
 *                  RefObject<HTMLElement | null> shape used by SelectionLayer)
 *
 * Escape exits edit mode. The toolbar flips to below the image when there is
 * not enough space above it (< 44px from container top).
 */

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type RefObject,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ImageIcon,
  Crop,
  Wand2,
  Sparkles,
  X,
} from "lucide-react";
import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";
import { CropHandles } from "./CropHandles";
import { ReplaceMediaDialog } from "./ReplaceMediaDialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const IMAGE_BEARING_TYPES = new Set(["images", "photo-split", "home-hero"]);
const TOOLBAR_HEIGHT = 40; // px — approximate floating bar height
const TOOLBAR_FLIP_THRESHOLD = TOOLBAR_HEIGHT + 8; // flip below when < this px from top

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveImage {
  blockId: string;
  /** DOMRect of the image element relative to the container */
  imageRect: DOMRect;
  /** DOMRect of the block root relative to the container */
  blockRect: DOMRect;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRelativeRect(
  element: HTMLElement,
  container: HTMLElement,
): DOMRect {
  const eBox = element.getBoundingClientRect();
  const cBox = container.getBoundingClientRect();
  return new DOMRect(
    eBox.left - cBox.left,
    eBox.top - cBox.top + container.scrollTop,
    eBox.width,
    eBox.height,
  );
}

/** Find the first <img> or element with a background-image inside a block root */
function findImageElement(blockRoot: HTMLElement): HTMLElement | null {
  const img = blockRoot.querySelector<HTMLImageElement>("img");
  if (img) return img;
  // Fall back: find any descendant with a CSS background-image
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

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function StubTooltip({ label }: { label: string }) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-[11px] text-white shadow-lg"
    >
      {label}
    </div>
  );
}

// ─── ToolbarButton ────────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  stub?: boolean;
  onClick?: () => void;
}

function ToolbarButton({
  label,
  icon,
  active = false,
  stub = false,
  onClick,
}: ToolbarButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        onMouseEnter={() => stub && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => stub && setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={[
          "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active
            ? "bg-primary text-primary-foreground"
            : "text-white hover:bg-white/20",
          stub ? "cursor-default opacity-60" : "",
        ].join(" ")}
      >
        {icon}
      </button>
      {stub && showTooltip && <StubTooltip label="Coming soon" />}
    </div>
  );
}

// ─── FloatingToolbar ─────────────────────────────────────────────────────────

interface FloatingToolbarProps {
  imageRect: DOMRect;
  containerHeight: number;
  cropActive: boolean;
  onReplace(): void;
  onCropToggle(): void;
  onDismiss(): void;
}

function FloatingToolbar({
  imageRect,
  containerHeight: _containerHeight,
  cropActive,
  onReplace,
  onCropToggle,
  onDismiss,
}: FloatingToolbarProps) {
  // Flip logic: if there is not enough space above the image, render below
  const spaceAbove = imageRect.top;
  const showBelow = spaceAbove < TOOLBAR_FLIP_THRESHOLD;

  const toolbarStyle: React.CSSProperties = showBelow
    ? {
        top: imageRect.top + imageRect.height + 8,
        left: imageRect.left + imageRect.width / 2,
        transform: "translateX(-50%)",
      }
    : {
        top: imageRect.top - TOOLBAR_HEIGHT - 8,
        left: imageRect.left + imageRect.width / 2,
        transform: "translateX(-50%)",
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: showBelow ? -4 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: showBelow ? -4 : 4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={toolbarStyle}
      className={[
        "absolute z-30 flex items-center gap-0.5 rounded-lg px-1.5 py-1",
        "bg-neutral-900/95 shadow-xl ring-1 ring-white/10 backdrop-blur-sm",
      ].join(" ")}
    >
      <ToolbarButton
        label="Replace image"
        icon={<ImageIcon className="h-3.5 w-3.5" />}
        onClick={onReplace}
      />
      <div className="mx-1 h-4 w-px bg-white/20" />
      <ToolbarButton
        label="Crop image"
        icon={<Crop className="h-3.5 w-3.5" />}
        active={cropActive}
        onClick={onCropToggle}
      />
      <ToolbarButton
        label="Filter"
        icon={<Wand2 className="h-3.5 w-3.5" />}
        stub
      />
      <ToolbarButton
        label="Animate"
        icon={<Sparkles className="h-3.5 w-3.5" />}
        stub
      />
      <div className="mx-1 h-4 w-px bg-white/20" />
      <ToolbarButton
        label="Exit image editor"
        icon={<X className="h-3.5 w-3.5" />}
        onClick={onDismiss}
      />
    </motion.div>
  );
}

// ─── ImageEditor (main export) ────────────────────────────────────────────────

interface Props {
  containerRef: RefObject<HTMLElement | null>;
}

export function ImageEditor({ containerRef }: Props) {
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const [active, setActive] = useState<ActiveImage | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const rafRef = useRef<number | null>(null);

  // ── Dismiss helpers ────────────────────────────────────────────────────────

  const dismiss = useCallback(() => {
    setActive(null);
    setCropMode(false);
    setReplaceOpen(false);
  }, []);

  // ── Escape key ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        // If replace dialog is open, let it close first
        if (replaceOpen) {
          setReplaceOpen(false);
        } else if (cropMode) {
          setCropMode(false);
        } else {
          dismiss();
        }
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [active, cropMode, replaceOpen, dismiss]);

  // ── dblclick listener on the container ────────────────────────────────────

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
      const blockRect = getRelativeRect(blockRoot, container);
      // Fall back to block rect when no image element exists yet (empty block)
      const imageRect = imageEl ? getRelativeRect(imageEl, container) : blockRect;

      setActive({ blockId, imageRect, blockRect });
      setCropMode(false);
    };

    container.addEventListener("dblclick", handler);
    return () => container.removeEventListener("dblclick", handler);
  }, [containerRef]);

  // ── Recalculate rects on scroll / resize ──────────────────────────────────

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
        const blockRect = getRelativeRect(blockRoot, container);
        const imageRect = imageEl ? getRelativeRect(imageEl, container) : blockRect;

        setActive((prev) =>
          prev ? { ...prev, imageRect, blockRect } : prev,
        );
      });
    };

    window.addEventListener("resize", recompute);
    container.addEventListener("scroll", recompute);
    return () => {
      window.removeEventListener("resize", recompute);
      container.removeEventListener("scroll", recompute);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, containerRef]);

  // ── Dismiss on click outside active block ─────────────────────────────────

  useEffect(() => {
    if (!active || replaceOpen) return;

    const handler = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const blockRoot = container.querySelector<HTMLElement>(
        `[data-block-id="${active.blockId}"]`,
      );
      if (blockRoot && blockRoot.contains(e.target as Node)) return;

      // Allow toolbar clicks — overlay is rendered outside the container in the DOM
      const overlay = document.querySelector<HTMLElement>("[data-image-editor-overlay]");
      if (overlay && overlay.contains(e.target as Node)) return;

      dismiss();
    };

    // Use capture so we fire before the canvas click handler
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [active, replaceOpen, dismiss, containerRef]);

  // ── Replace handler ───────────────────────────────────────────────────────

  const handleReplace = useCallback(() => {
    setReplaceOpen(true);
  }, []);

  const handleSelectImage = useCallback(
    (url: string) => {
      if (!active) return;
      const block = useEditorStore.getState().blocks.find((b) => b.id === active.blockId);
      const cfg = parseCfg(block?.config);
      updateBlock(active.blockId, { config: { ...cfg, imageUrl: url } });
    },
    [active, updateBlock],
  );

  // ── Derive container height for toolbar flip ──────────────────────────────

  const containerHeight = containerRef.current?.clientHeight ?? 0;

  // ── Verify block still exists ─────────────────────────────────────────────

  const blockExists =
    active !== null && blocks.some((b) => b.id === active.blockId);

  if (!blockExists && active) {
    // Block was removed — clean up without triggering a render loop
    Promise.resolve().then(dismiss);
    return null;
  }

  return (
    <>
      {/* Overlay layer — pointer-events: none so the canvas remains interactive,
          except for the toolbar and handles which opt-in via pointer-events-auto */}
      <div
        data-image-editor-overlay
        className="pointer-events-none absolute inset-0 z-20"
        aria-hidden
      >
        <AnimatePresence>
          {active && !replaceOpen && (
            <FloatingToolbar
              key="toolbar"
              imageRect={active.imageRect}
              containerHeight={containerHeight}
              cropActive={cropMode}
              onReplace={handleReplace}
              onCropToggle={() => setCropMode((v) => !v)}
              onDismiss={dismiss}
            />
          )}
        </AnimatePresence>

        {active && cropMode && (
          <CropHandles blockId={active.blockId} rect={active.imageRect} />
        )}
      </div>

      {/* Replace dialog — rendered in a portal-like pattern outside the
          pointer-events-none overlay, at the root level */}
      <ReplaceMediaDialog
        open={replaceOpen}
        onClose={() => setReplaceOpen(false)}
        onSelect={handleSelectImage}
      />
    </>
  );
}
