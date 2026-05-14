"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { ColorInput } from "./ColorInput";
import { SitePhotoPicker } from "../SitePhotoPicker";

export function StyleTab() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const themeTokens = useEditorStore((s) => s.themeTokens);
  const setOpenTray = useEditorStore((s) => s.setOpenTray);

  const hasPageMargins = !!(
    settings.marginLeft ||
    settings.marginRight ||
    settings.marginTop ||
    settings.marginBottom
  );

  // Local buffers prevent re-render interference with browser range input drag tracking.
  const storeOpacity = settings.bgImageOpacity ?? 1;
  const [localOpacity, setLocalOpacity] = useState(storeOpacity);
  const isDraggingOpacity = useRef(false);
  useEffect(() => {
    if (!isDraggingOpacity.current) setLocalOpacity(storeOpacity);
  }, [storeOpacity]);
  const onOpacityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      setLocalOpacity(v);
      updateSettings({ bgImageOpacity: v });
    },
    [updateSettings],
  );

  const storeZoom = settings.bgImageZoom ?? 100;
  const [localZoom, setLocalZoom] = useState(storeZoom);
  const isDraggingZoom = useRef(false);
  useEffect(() => {
    if (!isDraggingZoom.current) setLocalZoom(storeZoom);
  }, [storeZoom]);
  const onZoomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseInt(e.target.value, 10);
      setLocalZoom(v);
      updateSettings({ bgImageZoom: v });
    },
    [updateSettings],
  );

  const storePosX = settings.bgImagePositionX ?? 50;
  const [localPosX, setLocalPosX] = useState(storePosX);
  const isDraggingPosX = useRef(false);
  useEffect(() => {
    if (!isDraggingPosX.current) setLocalPosX(storePosX);
  }, [storePosX]);
  const onPosXChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseInt(e.target.value, 10);
      setLocalPosX(v);
      updateSettings({ bgImagePositionX: v });
    },
    [updateSettings],
  );

  const storePosY = settings.bgImagePositionY ?? 50;
  const [localPosY, setLocalPosY] = useState(storePosY);
  const isDraggingPosY = useRef(false);
  useEffect(() => {
    if (!isDraggingPosY.current) setLocalPosY(storePosY);
  }, [storePosY]);
  const onPosYChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseInt(e.target.value, 10);
      setLocalPosY(v);
      updateSettings({ bgImagePositionY: v });
    },
    [updateSettings],
  );

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Page Background
        </p>
        <ColorInput
          value={settings.bgColor ?? "#ffffff"}
          onChange={(v) => updateSettings({ bgColor: v })}
          includeThemeBackgroundSwatch={false}
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
            {hasPageMargins && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  Margins
                </span>
                <div className="flex overflow-hidden rounded border border-input text-[10px] font-medium">
                  {(
                    [
                      ["full", "Full page"],
                      ["clip", "Content only"],
                    ] as const
                  ).map(([val, label]) => {
                    const active =
                      val === "full"
                        ? (settings.bgImageBleed ?? 1) !== 0
                        : (settings.bgImageBleed ?? 1) === 0;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() =>
                          updateSettings({
                            bgImageBleed: val === "full" ? 1 : 0,
                          })
                        }
                        className={`px-2.5 py-1 transition-colors ${
                          active
                            ? "bg-accent text-accent-foreground"
                            : "bg-background text-muted-foreground hover:bg-accent/50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Opacity</span>
                <span className="tabular-nums">
                  {Math.round(localOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={localOpacity}
                onPointerDown={() => {
                  isDraggingOpacity.current = true;
                }}
                onPointerUp={() => {
                  isDraggingOpacity.current = false;
                }}
                onChange={onOpacityChange}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Zoom</span>
                <span className="tabular-nums">{localZoom}%</span>
              </div>
              <input
                type="range"
                min={100}
                max={200}
                step={1}
                value={localZoom}
                onPointerDown={() => {
                  isDraggingZoom.current = true;
                }}
                onPointerUp={() => {
                  isDraggingZoom.current = false;
                }}
                onChange={onZoomChange}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Position X</span>
                <span className="tabular-nums">{localPosX}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={localPosX}
                onPointerDown={() => {
                  isDraggingPosX.current = true;
                }}
                onPointerUp={() => {
                  isDraggingPosX.current = false;
                }}
                onChange={onPosXChange}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Position Y</span>
                <span className="tabular-nums">{localPosY}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={localPosY}
                onPointerDown={() => {
                  isDraggingPosY.current = true;
                }}
                onPointerUp={() => {
                  isDraggingPosY.current = false;
                }}
                onChange={onPosYChange}
                className="w-full accent-primary"
              />
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
          {(
            ["primary", "secondary", "accent", "background", "text"] as const
          ).map((key) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <div
                className="h-6 w-6 rounded-full border border-border"
                style={{ backgroundColor: themeTokens.colors[key] }}
                title={`${key}: ${themeTokens.colors[key]}`}
              />
              <span className="text-[8px] text-muted-foreground">
                {key.slice(0, 3)}
              </span>
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
          onClick={() =>
            updateSettings({ pageBgDisabled: settings.pageBgDisabled ? 0 : 1 })
          }
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
