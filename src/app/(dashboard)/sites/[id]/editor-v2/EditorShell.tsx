"use client";

import React, { type ReactNode, useEffect, useMemo, useState } from "react";

import { SidebarNav } from "./SidebarNav";
import { InspectorV2 } from "./InspectorV2";
import { SlideTray } from "./SlideTray";
import { TopBar } from "./TopBar";
import { Breadcrumb } from "./Breadcrumb";
import { Canvas } from "./Canvas";
import { EditorErrorBoundary } from "./EditorErrorBoundary";
import { useShortcuts } from "./hooks/useShortcuts";
import { useSettingsSync } from "./hooks/useSettingsSync";
import { useBlockSync } from "./hooks/useBlockSync";
import { useV1Migration } from "./hooks/useV1Migration";
import { useEditorStore } from "@/app/stores/editorStore";
import { trackEditorMount, flushEditorTelemetry } from "@/lib/telemetry/editor";

export interface EditorV2Site {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  eventType: string | null;
  status: string;
  previewColor: string;
  updatedAt: number;
}

export interface EditorV2User {
  id: string;
  email: string;
  name?: string | null;
}

interface Props {
  site: EditorV2Site;
  user: EditorV2User;
  children?: ReactNode;
}

type EditorLayoutMode =
  | "docked-wide"
  | "docked"
  | "mixed-overlay"
  | "compact-overlay";

function getEditorLayoutMode(width: number): EditorLayoutMode {
  if (width >= 1680) return "docked-wide";
  if (width >= 1440) return "docked";
  if (width >= 1200) return "mixed-overlay";
  return "compact-overlay";
}

export function EditorShell({ site, children }: Props) {
  useShortcuts();
  useSettingsSync(site.id);
  useBlockSync(site.id);
  useV1Migration(site.id);
  const setSiteId = useEditorStore((s) => s.setSiteId);
  const setSiteMeta = useEditorStore((s) => s.setSiteMeta);
  const railCollapsed = useEditorStore((s) => s.railCollapsed);
  const openTray = useEditorStore((s) => s.openTray);
  const inspectorOpen = useEditorStore((s) => s.inspectorOpen);
  const setOpenTray = useEditorStore((s) => s.setOpenTray);
  const setInspectorOpen = useEditorStore((s) => s.setInspectorOpen);
  const [viewportWidth, setViewportWidth] = useState(1440);

  useEffect(() => {
    function syncViewportWidth() {
      setViewportWidth(window.innerWidth);
    }
    syncViewportWidth();
    window.addEventListener("resize", syncViewportWidth);
    return () => window.removeEventListener("resize", syncViewportWidth);
  }, []);

  const layoutMode = useMemo(
    () => getEditorLayoutMode(viewportWidth),
    [viewportWidth],
  );
  const panelsDocked = layoutMode === "docked" || layoutMode === "docked-wide";
  const overlayPanelsOpen = !panelsDocked && Boolean(openTray || inspectorOpen);

  useEffect(() => {
    setSiteId(site.id);
    setSiteMeta({
      slug: site.slug,
      customDomain: site.customDomain,
      eventType: site.eventType,
    });
    trackEditorMount(site.id);
    return () => flushEditorTelemetry();
  }, [
    site.id,
    site.slug,
    site.customDomain,
    site.eventType,
    setSiteId,
    setSiteMeta,
  ]);

  return (
    <div
      className="fixed inset-0 flex flex-col bg-background text-foreground antialiased"
      style={
        {
          "--accent": "#FDF6E0",
          "--accent-foreground": "#7D6518",
        } as React.CSSProperties
      }
    >
      <TopBar site={site} />

      <div
        className="relative grid flex-1 overflow-hidden transition-[grid-template-columns] duration-200 ease-out"
        style={{
          gridTemplateColumns: [
            railCollapsed ? "0px" : "var(--editor-rail-w)",
            panelsDocked && openTray ? "var(--editor-tray-w)" : "0px",
            "minmax(0, 1fr)",
            panelsDocked && inspectorOpen ? "var(--editor-inspector-w)" : "0px",
          ].join(" "),
        }}
        data-editor-layout={layoutMode}
      >
        <SidebarNav />
        <SlideTray overlay={!panelsDocked} />

        <main
          className="relative min-w-0 overflow-hidden"
          style={{ gridColumn: 3, gridRow: 1 }}
        >
          <EditorErrorBoundary siteId={site.id}>
            {children ?? <Canvas siteId={site.id} />}
          </EditorErrorBoundary>
          <Breadcrumb />
        </main>

        {overlayPanelsOpen && (
          <button
            type="button"
            aria-label="Close editor panels"
            className="absolute bottom-0 right-0 top-0 z-[var(--z-overlay)] bg-black/20 backdrop-blur-[1px]"
            style={{ left: railCollapsed ? 0 : "var(--editor-rail-w)" }}
            onClick={() => {
              setOpenTray(null);
              setInspectorOpen(false);
            }}
          />
        )}

        <InspectorV2 overlay={!panelsDocked} />
      </div>
    </div>
  );
}
