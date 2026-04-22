"use client";

import { parseCfg } from "@/lib/editableField";
import { type Block } from "@/app/stores/editorStore";
import { ContentCardEditor } from "./editors/ContentCardEditor";
import { CountdownEditor } from "./editors/CountdownEditor";
import { ScheduleEditor } from "./editors/ScheduleEditor";
import { VideoEditor } from "./editors/VideoEditor";
import { GalleryEditor } from "./editors/GalleryEditor";
import { VenueMapEditor } from "./editors/VenueMapEditor";
import { RegistryEditor } from "./editors/RegistryEditor";

// ---------------------------------------------------------------------------
// BlockContentPanel — public export, switch-dispatches to per-type editors
// ---------------------------------------------------------------------------

interface Props {
  block: Block;
  updateBlock: (id: string, updates: Partial<Block>) => void;
}

export function BlockContentPanel({ block, updateBlock }: Props) {
  const cfg = parseCfg(block.config);

  function updateConfig(patch: Record<string, unknown>) {
    updateBlock(block.id, { config: { ...cfg, ...patch } });
  }

  switch (block.type) {
    case "faq":
    case "fun-facts":
    case "travel":
    case "content-card":
      return <ContentCardEditor cfg={cfg} updateConfig={updateConfig} />;
    case "schedule":
      return <ScheduleEditor cfg={cfg} updateConfig={updateConfig} />;
    case "video":
      return <VideoEditor cfg={{ ...cfg, _type: "video" }} updateConfig={updateConfig} />;
    case "media-video":
      return <VideoEditor cfg={{ ...cfg, _type: "media-video" }} updateConfig={updateConfig} />;
    case "gallery":
    case "images":
      return <GalleryEditor cfg={cfg} updateConfig={updateConfig} />;
    case "countdown":
      return <CountdownEditor cfg={cfg} updateConfig={updateConfig} />;
    case "venue-map":
      return <VenueMapEditor cfg={cfg} updateConfig={updateConfig} />;
    case "registry":
      return <RegistryEditor cfg={cfg} updateConfig={updateConfig} />;
    default:
      return (
        <p className="p-4 text-xs text-muted-foreground italic">
          No content editor for this block type.
        </p>
      );
  }
}
