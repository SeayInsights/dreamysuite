"use client";

import { useEffect, useMemo, useRef } from "react";
import { animate } from "motion/mini";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useEditorStore, type InspectorTab } from "@/app/stores/editorStore";
import { duration, EASING } from "@/lib/animation/motion";
import { useLastFocus } from "./hooks/useLastFocus";
import { PageSettingsPanel } from "./inspector/PageSettingsPanel";
import { DesignTab } from "./inspector/DesignTab";
import { AdvancedTab } from "./inspector/AdvancedTab";

const PANEL_WIDTH = 320;
const TABS: { id: InspectorTab; label: string }[] = [
  { id: "design", label: "Design" },
  { id: "advanced", label: "Advanced" },
];

export function InspectorV2() {
  const ref = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const { restoreFocus } = useLastFocus();

  useEffect(() => {
    if (ref.current)
      ref.current.style.transform = `translateX(${PANEL_WIDTH}px)`;
  }, []);
  const inspectorOpen = useEditorStore((s) => s.inspectorOpen);
  const setInspectorOpen = useEditorStore((s) => s.setInspectorOpen);
  const settingsLoaded = useEditorStore((s) => s.settingsLoaded);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const tab = useEditorStore((s) => s.inspectorTab);
  const setInspectorTab = useEditorStore((s) => s.setInspectorTab);
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const breakpoint = useEditorStore((s) => s.breakpoint);

  const selectedBlock = useMemo(
    () =>
      selectedBlockId
        ? (blocks.find((b) => b.id === selectedBlockId) ?? null)
        : null,
    [blocks, selectedBlockId],
  );

  // Reset to Design tab whenever the selected block changes
  useEffect(() => {
    setInspectorTab("design");
  }, [selectedBlockId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (inspectorOpen) {
      el.style.pointerEvents = "auto";
      animate(
        el,
        {
          x: [wasOpen.current ? "0px" : `${PANEL_WIDTH}px`, "0px"],
        },
        {
          duration: duration("inspectorSlide") / 1000,
          ease: EASING.enter,
        },
      ).finished.then(() => {
        if (ref.current) ref.current.style.transform = "translateX(0px)";
      });
      wasOpen.current = true;
      return;
    }
    if (wasOpen.current) {
      animate(
        el,
        { x: ["0px", `${PANEL_WIDTH}px`] },
        {
          duration: duration("inspectorSlide") / 1000,
          ease: EASING.exit,
        },
      ).finished.then(() => {
        if (ref.current) {
          ref.current.style.transform = `translateX(${PANEL_WIDTH}px)`;
          ref.current.style.pointerEvents = "none";
        }
      });
      wasOpen.current = false;
    }
  }, [inspectorOpen]);

  return (
    <aside
      ref={ref}
      role="complementary"
      aria-label="Inspector"
      aria-hidden={!inspectorOpen}
      onMouseDown={restoreFocus}
      className="pointer-events-none absolute bottom-0 right-0 top-0 z-[150] w-80 border-l border-border bg-white shadow-lg"
      style={{}}
    >
      <div className="flex h-10 items-center justify-between border-b border-border px-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {selectedBlockId === null ? "Page Settings" : "Element Properties"}
        </div>
        <button
          type="button"
          aria-label="Close inspector"
          onClick={() => setInspectorOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div role="tabpanel" className="h-[calc(100%-2.5rem)]">
        {!settingsLoaded ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
          </div>
        ) : selectedBlockId === null ? (
          <PageSettingsPanel />
        ) : (
          <>
            <div className="flex border-b border-border">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setInspectorTab(t.id as InspectorTab)}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium transition-colors",
                    tab === t.id
                      ? "border-b-2 border-foreground text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto h-[calc(100%-4.5rem)]">
              {tab === "design" && selectedBlock ? (
                <DesignTab
                  block={selectedBlock}
                  breakpoint={breakpoint}
                  updateBlock={updateBlock}
                />
              ) : tab === "advanced" && selectedBlock ? (
                <AdvancedTab
                  block={selectedBlock}
                  breakpoint={breakpoint}
                  updateBlock={updateBlock}
                />
              ) : null}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
