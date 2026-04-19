"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { PanelTextInput } from "../PanelInputs";

// ---------------------------------------------------------------------------
// Video editor
// ---------------------------------------------------------------------------

export function VideoEditor({
  cfg,
  updateConfig,
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
}) {
  const siteId = useEditorStore((s) => s.siteId);
  const currentUrl = String(cfg.url ?? "");
  const height = String(cfg.height ?? "100dvh");
  const [videos, setVideos] = useState<{ id: string; url: string; title: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;
    fetch(`/api/sites/${siteId}/media?type=video`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setVideos((d as { items: { id: string; url: string; title: string | null }[] }).items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Video
        </label>

        {currentUrl && (
          <div className="flex items-center gap-2 rounded border border-border bg-muted/40 px-2.5 py-2">
            <span className="flex-1 truncate text-[10px]">{currentUrl.split("/").pop()}</span>
            <button
              type="button"
              onClick={() => updateConfig({ url: "" })}
              className="shrink-0 text-[10px] text-muted-foreground hover:text-destructive"
            >
              Remove
            </button>
          </div>
        )}

        {loading ? (
          <p className="py-2 text-center text-[10px] text-muted-foreground">Loading videos...</p>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center gap-1 rounded-md border border-dashed border-border px-3 py-4">
            <p className="text-[10px] text-muted-foreground text-center">
              No videos imported yet. Add videos in the Media tray.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {videos.map((v) => {
              const isSelected = currentUrl === v.url;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => updateConfig({ url: v.url })}
                  className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left text-[10px] transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <span className="flex-1 truncate">{v.title ?? v.url.split("/").pop()}</span>
                  {isSelected && <span className="shrink-0 text-primary">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <PanelTextInput
        label="Height"
        value={height}
        onChange={(v) => updateConfig({ height: v })}
        placeholder="100dvh"
      />
      <p className="text-[10px] text-muted-foreground -mt-2">
        CSS value — e.g. 100dvh, 600px, 80vh
      </p>
    </div>
  );
}
