"use client";

import { useEditorStore } from "@/app/stores/editorStore";
import { ColorInput } from "./ColorInput";
import { SitePhotoPicker } from "../SitePhotoPicker";

export function StyleTab() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const themeTokens = useEditorStore((s) => s.themeTokens);
  const setOpenTray = useEditorStore((s) => s.setOpenTray);

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Page Background
        </p>
        <ColorInput
          value={settings.bgColor ?? "#ffffff"}
          onChange={(v) => updateSettings({ bgColor: v })}
        />
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Background Image
        </p>
        <SitePhotoPicker
          value={settings.bgImage ?? null}
          onChange={(v) => updateSettings({ bgImage: v })}
        />

        {settings.bgImage && (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Opacity</span>
                <span className="tabular-nums">{Math.round((settings.bgImageOpacity ?? 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={settings.bgImageOpacity ?? 1}
                onChange={(e) => updateSettings({ bgImageOpacity: parseFloat(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Layer</span>
              <div className="flex overflow-hidden rounded border border-input text-[10px] font-medium">
                {(["behind", "overlay"] as const).map((layer) => (
                  <button
                    key={layer}
                    type="button"
                    onClick={() => updateSettings({ bgImageLayer: layer })}
                    className={`px-2.5 py-1 capitalize transition-colors ${
                      (settings.bgImageLayer ?? "behind") === layer
                        ? "bg-accent text-accent-foreground"
                        : "bg-background text-muted-foreground hover:bg-accent/50"
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Theme Colors
          </p>
          <button
            type="button"
            onClick={() => setOpenTray("theme")}
            className="text-[10px] text-primary underline hover:text-primary/80"
          >
            Edit in Theme tray
          </button>
        </div>
        <div className="flex gap-1.5">
          {(["primary", "secondary", "accent", "background", "text"] as const).map((key) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <div
                className="h-6 w-6 rounded-full border border-border"
                style={{ backgroundColor: themeTokens.colors[key] }}
                title={`${key}: ${themeTokens.colors[key]}`}
              />
              <span className="text-[8px] text-muted-foreground">{key.slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="text-xs font-medium">Disable page background</p>
          <p className="text-[10px] text-muted-foreground">
            Removes page-level background so per-block colors show through
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!!settings.pageBgDisabled}
          onClick={() => updateSettings({ pageBgDisabled: settings.pageBgDisabled ? 0 : 1 })}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
            settings.pageBgDisabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
              settings.pageBgDisabled ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
