"use client";

import { useEffect, useMemo, useRef } from "react";
import { animate } from "motion/mini";
import { cn } from "@/lib/utils";
import { useEditorStore, type InspectorTab } from "@/app/stores/editorStore";
import { duration, EASING } from "@/lib/animation/motion";
import { useLastFocus } from "./hooks/useLastFocus";
import { PageSettingsPanel } from "./inspector/PageSettingsPanel";
import { DesignTab } from "./inspector/DesignTab";
import { AdvancedTab } from "./inspector/AdvancedTab";

const PANEL_WIDTH = 320;
const ALL_TABS: { id: InspectorTab; label: string }[] = [
  { id: "design", label: "Design" },
  { id: "advanced", label: "Advanced" },
];

interface Props {
  overlay?: boolean;
}

export function InspectorV2({ overlay = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const { restoreFocus } = useLastFocus();

  useEffect(() => {
    if (ref.current)
      ref.current.style.transform = `translateX(${PANEL_WIDTH}px)`;
  }, []);
  const inspectorOpen = useEditorStore((s) => s.inspectorOpen);
  const settingsLoaded = useEditorStore((s) => s.settingsLoaded);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const tab = useEditorStore((s) => s.inspectorTab);
  const setInspectorTab = useEditorStore((s) => s.setInspectorTab);
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const breakpoint = useEditorStore((s) => s.breakpoint);
  const mode = useEditorStore((s) => s.mode);

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
  }, [selectedBlockId]); // eslint-disable-line react-hooks/exhaustive-deps -- deps intentionally narrowed; this effect must not re-run on the omitted stable/ref values

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
      data-inspector
      onMouseDown={restoreFocus}
      className={cn(
        "pointer-events-none h-full min-w-0 overflow-hidden bg-white",
        overlay
          ? "absolute bottom-0 right-0 top-0 z-[var(--z-modal)]"
          : "relative z-[var(--z-chrome)] w-full",
        inspectorOpen && "border-l border-border shadow-lg",
      )}
      style={
        overlay
          ? {
              gridColumn: 4,
              gridRow: 1,
              width: "min(var(--editor-inspector-w), calc(100vw - 2rem))",
            }
          : { gridColumn: 4, gridRow: 1 }
      }
    >
      <div role="tabpanel" className="h-full">
        {!settingsLoaded ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
          </div>
        ) : selectedBlockId === null ? (
          <div className="overflow-y-auto h-full">
            <PageSettingsPanel />
          </div>
        ) : (
          <>
            <div className="flex border-b border-border">
              {(mode === "pro"
                ? ALL_TABS
                : ALL_TABS.filter((t) => t.id === "design")
              ).map((t) => (
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
            <div className="overflow-y-auto h-[calc(100%-2rem)]">
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
