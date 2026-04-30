"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { usePopoverDismiss } from "./RegistryPopovers";
import {
  PRESET_STORES,
  STORE_LOGOS,
  PLATFORM_LABELS,
  PLATFORM_ICONS,
} from "./RegistryBlockTypes";
import type { RegistryItem } from "./RegistryBlockTypes";

// ── Picker modal ─────────────────────────────────────────────────────────────

interface PickerModalProps {
  onAddStore: (store: string) => void;
  onAddCustomStore: () => void;
  onAddFund: (platform: RegistryItem["platform"]) => void;
  onClose: () => void;
}

export function PickerModal({
  onAddStore,
  onAddCustomStore,
  onAddFund,
  onClose,
}: PickerModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  usePopoverDismiss(panelRef, onClose);
  const [tab, setTab] = useState<"registry" | "fund">("registry");

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30">
      <div
        ref={panelRef}
        className="w-[420px] max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-popover shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-border">
          {(["registry", "fund"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                tab === t
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "registry" ? "Add Registry" : "Add Fund"}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === "registry" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.5rem",
              }}
            >
              {PRESET_STORES.map((store) => (
                <button
                  key={store}
                  type="button"
                  onClick={() => {
                    onAddStore(store);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-xs transition-colors hover:border-primary hover:bg-accent/30"
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- src is a data: URI (inline SVG); next/image does not support data: URIs */}
                    <img
                      src={STORE_LOGOS[store]}
                      alt={store}
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  </div>
                  <span className="text-center leading-tight">{store}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  onAddCustomStore();
                  onClose();
                }}
                className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-border p-3 text-xs transition-colors hover:border-primary hover:bg-accent/30"
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    color: "var(--site-muted)",
                  }}
                >
                  +
                </div>
                <span className="text-center leading-tight text-muted-foreground">
                  Custom
                </span>
              </button>
            </div>
          )}

          {tab === "fund" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.5rem",
              }}
            >
              {(["paypal", "venmo", "zelle", "cashapp", "other"] as const).map(
                (platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => {
                      onAddFund(platform);
                      onClose();
                    }}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-xs transition-colors hover:border-primary hover:bg-accent/30"
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "var(--site-accent, #B8921A)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.1rem",
                        fontWeight: 700,
                      }}
                    >
                      {PLATFORM_ICONS[platform]}
                    </div>
                    <span className="text-center leading-tight">
                      {PLATFORM_LABELS[platform]}
                    </span>
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
