"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/app/stores/editorStore";

interface Photo {
  id: string;
  r2Key: string;
  filename: string;
  mimeType: string;
  size: number;
  sortOrder: number;
}

interface Props {
  open: boolean;
  onClose(): void;
  onSelect(url: string): void;
}

export function ReplaceMediaDialog({ open, onClose, onSelect }: Props) {
  const siteId = useEditorStore((s) => s.siteId);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !siteId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedUrl(null);

    setQuery("");

    setLoading(true);
    fetch(`/api/sites/${siteId}/photos`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setPhotos((d as { photos: Photo[] }).photos))
      .catch(() => {})
      .finally(() => setLoading(false));
    requestAnimationFrame(() => firstFocusableRef.current?.focus());
  }, [open, siteId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [open, onClose]);

  const handleBackdropPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleConfirm = useCallback(() => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onClose();
    }
  }, [selectedUrl, onSelect, onClose]);

  if (!open) return null;

  const photoUrl = (id: string) => `/api/sites/${siteId}/photos/${id}`;

  const filtered = query.trim()
    ? photos.filter((p) =>
        p.filename.toLowerCase().includes(query.toLowerCase()),
      )
    : photos;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onPointerDown={handleBackdropPointerDown}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Replace image"
        className="relative flex h-[540px] w-[560px] max-w-[calc(100vw-2rem)] flex-col rounded-xl bg-background shadow-2xl ring-1 ring-border"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="text-sm font-semibold text-foreground">
            Replace Image
          </span>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your photos..."
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="flex flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex w-full flex-1 items-center justify-center text-sm text-muted-foreground">
                Loading photos...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex w-full flex-1 items-center justify-center text-sm text-muted-foreground">
                {photos.length === 0
                  ? "Upload photos in the Media tray first"
                  : "No photos match your search"}
              </div>
            ) : (
              <div className="grid w-full grid-cols-3 gap-2 content-start">
                {filtered.map((photo) => {
                  const url = photoUrl(photo.id);
                  const isSelected = selectedUrl === url;
                  return (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedUrl(isSelected ? null : url)}
                      className={[
                        "relative overflow-hidden rounded-md aspect-square",
                        "ring-2 transition-all focus-visible:outline-none focus-visible:ring-ring",
                        isSelected
                          ? "ring-primary"
                          : "ring-transparent hover:ring-primary/40",
                      ].join(" ")}
                    >
                      <Image
                        src={url}
                        alt={photo.filename}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="80px"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                          <div className="rounded-full bg-primary p-1">
                            <svg
                              className="h-3 w-3 text-primary-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={!selectedUrl} onClick={handleConfirm}>
            Use Image
          </Button>
        </div>
      </div>
    </div>
  );
}
