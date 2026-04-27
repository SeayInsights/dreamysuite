"use client";

import { useCallback, useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { useEditorStore } from "@/app/stores/editorStore";

// ---------------------------------------------------------------------------
// Gallery / Images editor — multi-select photos from the site media library
// ---------------------------------------------------------------------------

interface Photo {
  id: string;
  r2Key: string;
  filename: string;
  mimeType: string;
  size: number;
  sortOrder: number;
}

export function GalleryEditor({
  cfg,
  updateConfig,
  block,
  breakpoint,
  updateBlock,
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
  block?: unknown;
  breakpoint?: unknown;
  updateBlock?: (id: string, updates: Partial<unknown>) => void;
}) {
  const siteId = useEditorStore((s) => s.siteId);
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

  const selected: string[] = Array.isArray(cfg.urls) ? (cfg.urls as string[]) : [];

  function toggle(url: string) {
    const next = selected.includes(url)
      ? selected.filter((u) => u !== url)
      : [...selected, url];
    updateConfig({ urls: next });
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Images
        </label>
        {selected.length > 0 && (
          <span className="text-[10px] text-muted-foreground">{selected.length} selected</span>
        )}
      </div>

      {loading ? (
        <p className="py-2 text-center text-[10px] text-muted-foreground">Loading photos...</p>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-md border border-dashed border-border px-3 py-4">
          <ImagePlus className="size-4 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground text-center">
            Upload photos in the Media tray first
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((photo) => {
            const url = photoUrl(photo.id);
            const isSelected = selected.includes(url);
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => toggle(url)}
                className={
                  "relative aspect-square overflow-hidden rounded-md ring-2 transition-all " +
                  (isSelected ? "ring-primary" : "ring-transparent hover:ring-primary/40")
                }
                title={photo.filename}
              >
                <img
                  src={url}
                  alt={photo.filename}
                  className="size-full object-cover"
                />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {selected.indexOf(url) + 1}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => updateConfig({ urls: [] })}
          className="text-[10px] text-muted-foreground underline hover:text-destructive"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
