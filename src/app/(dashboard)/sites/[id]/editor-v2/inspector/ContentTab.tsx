"use client";

import { useEditorStore } from "@/app/stores/editorStore";
import { BlockContentPanel } from "./BlockContentPanel";

// ---------------------------------------------------------------------------
// ContentTab — shows BlockContentPanel for the selected block (E009)
//
// - No block selected → "Select a block" placeholder (E014)
// - Block selected    → BlockContentPanel dispatches to per-type editor
// ---------------------------------------------------------------------------

export function ContentTab() {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const selectedBlock = selectedBlockId
    ? blocks.find((b) => b.id === selectedBlockId) ?? null
    : null;

  if (!selectedBlock) {
    return (
      <p className="p-6 text-xs text-muted-foreground italic text-center">
        Select a block to edit its content.
      </p>
    );
  }

  return <BlockContentPanel block={selectedBlock} updateBlock={updateBlock} />;
}
