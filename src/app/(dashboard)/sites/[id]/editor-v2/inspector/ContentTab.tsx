"use client";

import { useEditorStore } from "@/app/stores/editorStore";
import { PageSettingsPanel } from "./PageSettingsPanel";
import { BlockContentPanel } from "./BlockContentPanel";

// ---------------------------------------------------------------------------
// ContentTab — Orchestrates between Page Settings and Block Settings
// ---------------------------------------------------------------------------

/**
 * ContentTab — Smart switcher between page-level and block-level editing.
 *
 * - When no block is selected → shows PageSettingsPanel (global settings)
 * - When a content block is selected → shows BlockContentPanel (block properties)
 *
 * This separation makes it clear to users:
 * - Page settings = global, no cascading
 * - Block settings = cascading breakpoints supported
 */

const CONTENT_BLOCK_TYPES = new Set([
  "faq",
  "schedule",
  "fun-facts",
  "travel",
  "video",
  "media-video",
  "content-card",
  "countdown",
  "venue-map",
  "gallery",
  "images",
  "registry",
]);

export function ContentTab() {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);

  const selectedBlock = selectedBlockId
    ? blocks.find((b) => b.id === selectedBlockId) ?? null
    : null;

  const showBlockPanel =
    selectedBlock !== null && CONTENT_BLOCK_TYPES.has(selectedBlock.type);

  // Block settings view
  if (showBlockPanel) {
    return (
      <div>
        <div className="border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={() => selectBlock(null)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-testid="back-to-page-settings"
          >
            ← Back to page settings
          </button>
        </div>
        <BlockContentPanel block={selectedBlock} updateBlock={updateBlock} />
      </div>
    );
  }

  // Page settings view (default)
  return <PageSettingsPanel />;
}
