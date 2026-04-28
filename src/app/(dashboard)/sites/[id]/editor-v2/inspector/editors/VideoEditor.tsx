"use client";

import { useState, useEffect } from "react";
import { useEditorStore, type Block } from "@/app/stores/editorStore";
import { FormInput } from "../FormInput";

// ---------------------------------------------------------------------------
// Video editor
// ---------------------------------------------------------------------------

function detectProvider(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/vimeo\.com/.test(url)) return "vimeo";
  if (/\.gif(\?|$)/i.test(url)) return "gif";
  return "direct";
}

export function VideoEditor({
  cfg,
  updateConfig,
  block,
  breakpoint,
  updateBlock,
}: {
  cfg: Record<string, unknown>;
  updateConfig: (patch: Record<string, unknown>) => void;
  block?: Block;
  breakpoint?: "desktop" | "tablet" | "mobile";
  updateBlock?: (id: string, updates: Partial<Block>) => void;
}) {
  const siteId = useEditorStore((s) => s.siteId);
  const currentUrl = String(cfg.url ?? "");
  const height = String(cfg.height ?? "100dvh");
  const objectFit = String(cfg.objectFit ?? "cover");
  const provider = String(cfg.provider ?? "");
  const [videos, setVideos] = useState<{ id: string; url: string; title: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    if (!siteId) return;
    fetch(`/api/sites/${siteId}/media?type=video`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setVideos((d as { items: { id: string; url: string; title: string | null }[] }).items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  function applyUrlInput() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    updateConfig({ url: trimmed, provider: detectProvider(trimmed) });
    setUrlInput("");
  }

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Video
        </label>

        {currentUrl && (
          <div className="flex items-center gap-2 rounded border border-border bg-muted/40 px-2.5 py-2">
            <span className="flex-1 truncate text-[10px]">{currentUrl.split("/").pop()}</span>
            <button
              type="button"
              onClick={() => updateConfig({ url: "", provider: "" })}
              className="shrink-0 text-[10px] text-muted-foreground hover:text-destructive"
            >
              Remove
            </button>
          </div>
        )}

        {loading ? (
          <p className="py-2 text-center text-[10px] text-muted-foreground">Loading videos...</p>
        ) : videos.length > 0 ? (
          <div className="space-y-1">
            {videos.map((v) => {
              const isSelected = currentUrl === v.url;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => updateConfig({ url: v.url, provider: detectProvider(v.url) })}
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
        ) : null}

        <div className="space-y-1 border-t border-border pt-3">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Or paste a URL
          </label>
          <p className="text-[10px] text-muted-foreground">YouTube, Vimeo, GIF, or direct link</p>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applyUrlInput(); }}
              placeholder="https://..."
              className="h-7 flex-1 rounded border border-input bg-background px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={applyUrlInput}
              className="h-7 rounded bg-primary px-2.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              Use
            </button>
          </div>
        </div>
      </div>

      <FormInput
        mode="block"
        type="text"
        label="Height"
        value={height}
        onChange={(v) => updateConfig({ height: v })}
        placeholder="100dvh"
        block={block}
        breakpoint={breakpoint}
        propertyName="height"
        updateBlock={updateBlock}
        helpText="CSS value (e.g., 100dvh, 600px, 80vh). Cascades from desktop → tablet → mobile."
      />

      {(!provider || provider === "direct") && (
        <FormInput
          mode="block"
          type="select"
          label="Object Fit"
          value={objectFit}
          onChange={(v) => updateConfig({ objectFit: v })}
          options={[
            { value: "cover", label: "Cover (crop to fill)" },
            { value: "contain", label: "Contain (letterbox)" },
            { value: "fill", label: "Fill (stretch)" },
            { value: "none", label: "None (natural size)" },
          ]}
          block={block}
          breakpoint={breakpoint}
          propertyName="objectFit"
          updateBlock={updateBlock}
          helpText="How the video fits within its container (cascading supported)"
        />
      )}
    </div>
  );
}
