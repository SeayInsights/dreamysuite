"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { SitePhotoPicker } from "../SitePhotoPicker";

// ── Background Image ──────────────────────────────────────────────────────

interface BgImageConfig {
  url: string;
  opacity: number;
  fit: "cover" | "contain" | "center" | "repeat";
  position: string;
  scope: "site" | "page";
}

function parseBgImage(raw: string | null | undefined): BgImageConfig | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as BgImageConfig; }
  catch { return null; }
}

function BackgroundImageSection() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const config = parseBgImage(settings.backgroundImage);

  function patch(p: Partial<BgImageConfig>) {
    const base: BgImageConfig = config ?? { url: "", opacity: 1, fit: "cover", position: "center", scope: "site" };
    updateSettings({ backgroundImage: JSON.stringify({ ...base, ...p }) });
  }

  return (
    <div className="space-y-3">
      <SitePhotoPicker
        label="Background Image"
        value={config?.url ?? null}
        onChange={(url) => {
          if (!url) { updateSettings({ backgroundImage: null }); return; }
          patch({ url });
        }}
      />
      {config?.url && (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase text-muted-foreground">Opacity</label>
              <span className="text-[10px] tabular-nums text-muted-foreground">{Math.round((config.opacity ?? 1) * 100)}%</span>
            </div>
            <input
              type="range" min={0} max={1} step={0.05}
              value={config.opacity ?? 1}
              onChange={(e) => patch({ opacity: parseFloat(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-muted-foreground">Fit</label>
            <select
              value={config.fit ?? "cover"}
              onChange={(e) => patch({ fit: e.target.value as BgImageConfig["fit"] })}
              className="h-8 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="center">Center (no scale)</option>
              <option value="repeat">Tile (repeat)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-muted-foreground">Position</label>
            <select
              value={config.position ?? "center"}
              onChange={(e) => patch({ position: e.target.value })}
              className="h-8 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="center">Center</option>
              <option value="top center">Top</option>
              <option value="bottom center">Bottom</option>
              <option value="center left">Left</option>
              <option value="center right">Right</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-muted-foreground">Apply To</label>
            <div className="grid grid-cols-2 gap-1">
              {(["site", "page"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => patch({ scope: s })}
                  className={`rounded border py-1.5 text-xs font-medium transition-colors ${
                    (config.scope ?? "site") === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  {s === "site" ? "All Pages" : "This Page"}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ backgroundImage: null })}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Remove background
          </button>
        </>
      )}
    </div>
  );
}

// ── Spacing Input ─────────────────────────────────────────────────────────

function SpacingInput({
  label,
  value,
  onChange,
  placeholder = "0",
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  function commit() {
    const trimmed = draft.trim();
    onChange(trimmed === "" ? null : trimmed);
  }

  return (
    <div className="flex items-center gap-2">
      <label className="w-12 shrink-0 text-[10px] uppercase text-muted-foreground">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => {
          setDraft(e.target.value);
          const trimmed = e.target.value.trim();
          onChange(trimmed === "" ? null : trimmed);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          e.stopPropagation();
        }}
        className="h-7 w-full rounded border border-input bg-background px-2 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <span className="shrink-0 text-[10px] text-muted-foreground">px</span>
    </div>
  );
}

// ── Layout Section ────────────────────────────────────────────────────────

export function LayoutSection() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Page Margins
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <SpacingInput label="Top" value={settings.marginTop} onChange={(v) => updateSettings({ marginTop: v })} />
            <SpacingInput label="Right" value={settings.marginRight} onChange={(v) => updateSettings({ marginRight: v })} />
            <SpacingInput label="Bottom" value={settings.marginBottom} onChange={(v) => updateSettings({ marginBottom: v })} />
            <SpacingInput label="Left" value={settings.marginLeft} onChange={(v) => updateSettings({ marginLeft: v })} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Section Gap
            </p>
            <span className="text-[10px] italic text-muted-foreground">tablet &amp; mobile only</span>
          </div>
          <SpacingInput
            label="Gap"
            value={settings.sectionSpacing}
            onChange={(v) => updateSettings({ sectionSpacing: v })}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Background
        </p>
        <BackgroundImageSection />
      </div>
    </div>
  );
}
