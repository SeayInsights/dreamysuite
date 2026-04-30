"use client";

import { cn } from "@/lib/utils";
import { SitePhotoPicker } from "../../SitePhotoPicker";

// ---------------------------------------------------------------------------
// ImageBlockEditor — inspector controls for image-carrying blocks (E011)
//
// Used by: home-hero, photo-split
// Config keys: imageUrl, imageFit, cropX, cropY, cropW, cropH
// ---------------------------------------------------------------------------

const FIT_OPTIONS = [
  { label: "Cover", value: "cover" },
  { label: "Contain", value: "contain" },
  { label: "Fill", value: "fill" },
] as const;

interface ImageBlockEditorProps {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
}

export function ImageBlockEditor({ cfg, updateConfig }: ImageBlockEditorProps) {
  const imageUrl = (cfg.imageUrl as string | undefined) ?? null;
  const imageFit = String(cfg.imageFit ?? "cover");

  return (
    <div className="space-y-5 p-4">
      {/* Photo picker */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Image
        </div>
        <SitePhotoPicker
          value={imageUrl}
          onChange={(url) => updateConfig({ imageUrl: url ?? undefined })}
          label="Replace image"
        />
      </div>

      {/* Fit selector */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Fit
        </div>
        <div className="flex gap-1">
          {FIT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateConfig({ imageFit: opt.value })}
              className={cn(
                "flex-1 rounded border px-2 py-1.5 text-xs transition-colors",
                imageFit === opt.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Crop toggle */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Crop
        </div>
        <button
          type="button"
          onClick={() => {
            // Clear crop values to reset
            updateConfig({ cropX: undefined, cropY: undefined, cropW: undefined, cropH: undefined });
          }}
          className="w-full rounded border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          Reset crop
        </button>
      </div>
    </div>
  );
}
