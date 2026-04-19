import { useEditorStore } from "@/app/stores/editorStore";
import type { Block } from "@/app/stores/editorStore";

/**
 * Returns only the currently-selected block, or null if nothing is selected.
 *
 * Using a single selector that combines blocks + selectedBlockId into one
 * derived value means only the component holding the selected block's data
 * re-renders when that block changes — not all 18 subscribers.
 */
export function useSelectedBlock(): Block | null {
  return useEditorStore(
    (s) => s.blocks.find((b) => b.id === s.selectedBlockId) ?? null,
  );
}
