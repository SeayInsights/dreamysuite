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
 *   containerRef – ref to the scrollable canvas container element
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
import { motion, AnimatePresence } from "motion/react";
import {
  ImageIcon,
  Crop,
  Wand2,
  Sparkles,
  X,
  ImagePlus,
} from "lucide-react";
import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";
import { CropHandles } from "./CropHandles";

// ─── Constants ────────────────────────────────────────────────────────────────

const IMAGE_BEARING_TYPES = new Set(["images", "photo-split", "home-hero", "gallery"]);
const TOOLBAR_HEIGHT = 40;
const TOOLBAR_FLIP_THRESHOLD = TOOLBAR_HEIGHT + 8;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActiveImage {
  blockId: string;
  imageRect: DOMRect;
  blockRect: DOMRect;
}

interface Photo {
  id: string;
  r2Key: string;
  filename: string;
  mimeType: string;
  size: number;
  sortOrder: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function ToolbarButton({
  label,
  icon,
  active = false,
  stub = false,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  stub?: boolean;
  onClick?: () => void;
}) {
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
          active ? "bg-primary text-primary-foreground" : "text-white hover:bg-white/20",
          stub ? "cursor-default opacity-60" : "",
        ].join(" ")}
      >
        {icon}
      </button>
      {stub && showTooltip && <StubTooltip label="Coming soon" />}
    </div>
  );
}

// ─── InlinePhotoPanel ─────────────────────────────────────────────────────────

function InlinePhotoPanel({
  blockId,
  blockType,
  style,
  onDismiss,
}: {
  blockId: string;
  blockType: string;
  style: React.CSSProperties;
  onDismiss: () => void;
}) {
  const siteId = useEditorStore((s) => s.siteId);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;
    fetch(`/api/sites/${siteId}/photos`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setPhotos((d as { photos: Photo[] }).photos))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  const photoUrl = useCallback((id: string) => `/api/sites/${siteId}/photos/${id}`, [siteId]);

  function selectPhoto(url: string) {
    const block = useEditorStore.getState().blocks.find((b) => b.id === blockId);
    const cfg = parseCfg(block?.config);

    if (blockType === "gallery" && (cfg.layout ?? "grid") === "grid") {
      const current = Array.isArray(cfg.urls) ? (cfg.urls as string[]) : [];
      const next = current.includes(url)
        ? current.filter((u) => u !== url)
        : [...current, url];
      updateBlock(blockId, { config: { ...cfg, urls: next } });
    } else {
      updateBlock(blockId, { config: { ...cfg, imageUrl: url } });
      onDismiss();
    }
  }

  function getSelected(): string[] {
    const block = useEditorStore.getState().blocks.find((b) => b.id === blockId);
    const cfg = parseCfg(block?.config);
    if (blockType === "gallery" && (cfg.layout ?? "grid") === "grid") {
      return Array.isArray(cfg.urls) ? (cfg.urls as string[]) : [];
    }
    return cfg.imageUrl ? [cfg.imageUrl as string] : [];
  }

  const selected = getSelected();
  const isGalleryGrid = blockType === "gallery";

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      data-image-editor-overlay
      className="absolute z-30 w-56 rounded-lg border border-border bg-popover shadow-xl"
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[11px] font-medium text-foreground">
          {isGalleryGrid ? "Select photos" : "Replace image"}
        </span>
        {isGalleryGrid && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-[10px] text-primary hover:underline"
          >
            Done
          </button>
        )}
      </div>
      <div className="max-h-56 overflow-y-auto p-2">
        {loading ? (
          <p className="py-4 text-center text-[10px] text-muted-foreground">Loading...</p>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-4">
            <ImagePlus className="size-4 text-muted-foreground" />
            <p className="text-center text-[10px] text-muted-foreground">
              Upload photos in the Media tray first
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {photos.map((photo) => {
              const url = photoUrl(photo.id);
              const isSelected = selected.includes(url);
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => selectPhoto(url)}
                  className={
                    "relative aspect-square overflow-hidden rounded ring-2 transition-all " +
                    (isSelected ? "ring-primary" : "ring-transparent hover:ring-primary/40")
                  }
                  title={photo.filename}
                >
                  <img src={url} alt={photo.filename} className="size-full object-cover" />
                  {isSelected && isGalleryGrid && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                      <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                        {selected.indexOf(url) + 1}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── FloatingToolbar ─────────────────────────────────────────────────────────

function FloatingToolbar({
  imageRect,
  cropActive,
  replaceActive,
  onReplace,
  onCropToggle,
  onDismiss,
}: {
  imageRect: DOMRect;
  cropActive: boolean;
  replaceActive: boolean;
  onReplace(): void;
  onCropToggle(): void;
  onDismiss(): void;
}) {
  const spaceAbove = imageRect.top;
  const showBelow = spaceAbove < TOOLBAR_FLIP_THRESHOLD;

  const toolbarStyle: React.CSSProperties = showBelow
    ? { top: imageRect.top + imageRect.height + 8, left: imageRect.left + imageRect.width / 2, transform: "translateX(-50%)" }
    : { top: imageRect.top - TOOLBAR_HEIGHT - 8, left: imageRect.left + imageRect.width / 2, transform: "translateX(-50%)" };

  return (
    <motion.div
      initial={{ opacity: 0, y: showBelow ? -4 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: showBelow ? -4 : 4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={toolbarStyle}
      className="absolute z-30 flex items-center gap-0.5 rounded-lg px-1.5 py-1 bg-neutral-900/95 shadow-xl ring-1 ring-white/10 backdrop-blur-sm"
    >
      <ToolbarButton
        label="Replace image"
        icon={<ImageIcon className="h-3.5 w-3.5" />}
        active={replaceActive}
        onClick={onReplace}
      />
      <div className="mx-1 h-4 w-px bg-white/20" />
      <ToolbarButton label="Crop image" icon={<Crop className="h-3.5 w-3.5" />} active={cropActive} onClick={onCropToggle} />
      <ToolbarButton label="Filter" icon={<Wand2 className="h-3.5 w-3.5" />} stub />
      <ToolbarButton label="Animate" icon={<Sparkles className="h-3.5 w-3.5" />} stub />
      <div className="mx-1 h-4 w-px bg-white/20" />
      <ToolbarButton label="Exit image editor" icon={<X className="h-3.5 w-3.5" />} onClick={onDismiss} />
    </motion.div>
  );
}

// ─── ImageEditor (main export) ────────────────────────────────────────────────

interface Props {
  containerRef: RefObject<HTMLElement | null>;
}

export function ImageEditor({ containerRef }: Props) {
  const blocks = useEditorStore((s) => s.blocks);

  const [active, setActive] = useState<ActiveImage | null>(null);
  const [activeBlockType, setActiveBlockType] = useState<string>("");
  const [cropMode, setCropMode] = useState(false);
  const [photoPanel, setPhotoPanel] = useState(false);
  const rafRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    setActive(null);
    setActiveBlockType("");
    setCropMode(false);
    setPhotoPanel(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (photoPanel) { setPhotoPanel(false); }
        else if (cropMode) { setCropMode(false); }
        else { dismiss(); }
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [active, cropMode, photoPanel, dismiss]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handler = (e: MouseEvent) => {
      const blockRoot = (e.target as HTMLElement).closest<HTMLElement>("[data-block-id]");
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
  }, [containerRef]);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const recompute = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const blockRoot = container.querySelector<HTMLElement>(`[data-block-id="${active.blockId}"]`);
        if (!blockRoot) return;
        const imageEl = findImageElement(blockRoot);
        const blockRect = getViewportRect(blockRoot);
        const imageRect = imageEl ? getViewportRect(imageEl) : blockRect;
        setActive((prev) => prev ? { ...prev, imageRect, blockRect } : prev);
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
      const blockRoot = container.querySelector<HTMLElement>(`[data-block-id="${active.blockId}"]`);
      if (blockRoot && blockRoot.contains(e.target as Node)) return;
      const overlay = document.querySelector<HTMLElement>("[data-image-editor-overlay]");
      if (overlay && overlay.contains(e.target as Node)) return;
      dismiss();
    };

    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [active, photoPanel, dismiss, containerRef]);

  const containerHeight = containerRef.current?.clientHeight ?? 0;
  const blockExists = active !== null && blocks.some((b) => b.id === active.blockId);

  if (!blockExists && active) {
    Promise.resolve().then(dismiss);
    return null;
  }

  // Panel positioned below the toolbar (or below the image if toolbar flips)
  const panelStyle: React.CSSProperties | null = active
    ? (() => {
        const spaceAbove = active.imageRect.top;
        const showBelow = spaceAbove < TOOLBAR_FLIP_THRESHOLD;
        const toolbarBottom = showBelow
          ? active.imageRect.top + active.imageRect.height + 8 + TOOLBAR_HEIGHT + 4
          : active.imageRect.top - TOOLBAR_HEIGHT - 8 + TOOLBAR_HEIGHT + 4;
        return {
          top: toolbarBottom,
          left: active.imageRect.left + active.imageRect.width / 2,
          transform: "translateX(-50%)",
        };
      })()
    : null;

  return (
    <div
      data-image-editor-overlay
      className="pointer-events-none fixed inset-0 z-[100]"
      aria-hidden
    >
      <div className="pointer-events-auto">
        <AnimatePresence>
          {active && (
            <FloatingToolbar
              key="toolbar"
              imageRect={active.imageRect}
              cropActive={cropMode}
              replaceActive={photoPanel}
              onReplace={() => setPhotoPanel((v) => !v)}
              onCropToggle={() => setCropMode((v) => !v)}
              onDismiss={dismiss}
            />
          )}
          {active && photoPanel && panelStyle && (
            <InlinePhotoPanel
              key="photo-panel"
              blockId={active.blockId}
              blockType={activeBlockType}
              style={panelStyle}
              onDismiss={() => setPhotoPanel(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {active && cropMode && (
        <CropHandles blockId={active.blockId} rect={active.imageRect} containerRef={containerRef} />
      )}
    </div>
  );
}
