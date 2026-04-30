"use client";

import { parseCfg } from "@/lib/editableField";
import { type Block, useEditorStore } from "@/app/stores/editorStore";
import { getEffectiveConfig } from "../lib/cascadeConfig";
import { ContentCardEditor } from "./editors/ContentCardEditor";
import { CountdownEditor } from "./editors/CountdownEditor";
import { ScheduleEditor } from "./editors/ScheduleEditor";
import { VideoEditor } from "./editors/VideoEditor";
import { GalleryEditor } from "./editors/GalleryEditor";
import { VenueMapEditor } from "./editors/VenueMapEditor";
import { RegistryEditor } from "./editors/RegistryEditor";
import { TextBlockEditor } from "./editors/TextBlockEditor";
import { ImageBlockEditor } from "./editors/ImageBlockEditor";

// ---------------------------------------------------------------------------
// BlockContentPanel — public export, switch-dispatches to per-type editors
// ---------------------------------------------------------------------------

interface Props {
  block: Block;
  updateBlock: (id: string, updates: Partial<Block>) => void;
}

export function BlockContentPanel({ block, updateBlock }: Props) {
  const breakpoint = useEditorStore((s) => s.breakpoint);

  // Use getEffectiveConfig to get cascaded config for current breakpoint
  const cfg = parseCfg(getEffectiveConfig(block, breakpoint));

  function updateConfig(patch: Record<string, unknown>) {
    if (breakpoint === "desktop") {
      // Desktop: update base config
      updateBlock(block.id, { config: { ...parseCfg(block.config), ...patch } });
    } else {
      // Tablet/Mobile: update overrides[breakpoint]
      const currentOverrides = block.overrides?.[breakpoint] || {};
      const newOverrides = {
        ...block.overrides,
        [breakpoint]: { ...currentOverrides, ...patch },
      };
      updateBlock(block.id, { overrides: newOverrides });
    }
  }

  switch (block.type) {
    case "multi-text":
      return <TextBlockEditor cfg={cfg} updateConfig={updateConfig} />;
    case "home-hero":
    case "photo-split":
      return <ImageBlockEditor cfg={cfg} updateConfig={updateConfig} />;
    case "faq":
    case "fun-facts":
    case "travel":
    case "content-card":
      return <ContentCardEditor cfg={cfg} updateConfig={updateConfig} block={block} breakpoint={breakpoint} updateBlock={updateBlock} />;
    case "schedule":
      return <ScheduleEditor cfg={cfg} updateConfig={updateConfig} block={block} breakpoint={breakpoint} updateBlock={updateBlock} />;
    case "video":
      return <VideoEditor cfg={{ ...cfg, _type: "video" }} updateConfig={updateConfig} block={block} breakpoint={breakpoint} updateBlock={updateBlock} />;
    case "media-video":
      return <VideoEditor cfg={{ ...cfg, _type: "media-video" }} updateConfig={updateConfig} block={block} breakpoint={breakpoint} updateBlock={updateBlock} />;
    case "gallery":
    case "images":
      return <GalleryEditor cfg={cfg} updateConfig={updateConfig} block={block} breakpoint={breakpoint} updateBlock={updateBlock} />;
    case "countdown":
      return <CountdownEditor cfg={cfg} updateConfig={updateConfig} block={block} breakpoint={breakpoint} updateBlock={updateBlock} />;
    case "venue-map":
      return <VenueMapEditor cfg={cfg} updateConfig={updateConfig} block={block} breakpoint={breakpoint} updateBlock={updateBlock} />;
    case "registry":
      return <RegistryEditor cfg={cfg} updateConfig={updateConfig} block={block} breakpoint={breakpoint} updateBlock={updateBlock} />;
    default:
      return (
        <p className="p-4 text-xs text-muted-foreground italic">
          Select a block to edit its content.
        </p>
      );
  }
}
