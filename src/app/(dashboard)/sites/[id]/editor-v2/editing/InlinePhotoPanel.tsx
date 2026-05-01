"use client";

/**
 * InlinePhotoPanel
 *
 * Floating photo-picker panel rendered below the image toolbar when "Replace"
 * is active. Fetches the site's photo library and lets the user swap the image
 * on the active block (or multi-select for gallery blocks).
 */

import { useEffect, useState, useCallback } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Photo {
  id: string;
  r2Key: string;
  filename: string;
  mimeType: string;
  size: number;
  sortOrder: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InlinePhotoPanel({
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

  const photoUrl = useCallback(
    (id: string) => `/api/sites/${siteId}/photos/${id}`,
    [siteId],
  );

  function selectPhoto(url: string) {
    const block = useEditorStore
      .getState()
      .blocks.find((b) => b.id === blockId);
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
    const block = useEditorStore
      .getState()
      .blocks.find((b) => b.id === blockId);
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
          <p className="py-4 text-center text-[10px] text-muted-foreground">
            Loading...
          </p>
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
                    (isSelected
                      ? "ring-primary"
                      : "ring-transparent hover:ring-primary/40")
                  }
                  title={photo.filename}
                >
                  <Image
                    src={url}
                    alt={photo.filename}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="80px"
                  />
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
