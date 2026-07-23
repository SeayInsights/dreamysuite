"use client";

import { useCallback } from "react";
import { Sparkles } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";
import { runPreviewAnimation } from "@/app/animations/preview";
// Ensure the preset registry is populated (idempotent — DesignTab imports it too).
import "@/app/animations/presets/index";

/** Resolve a block config's animation preset id + options (string or object form). */
function readAnim(config: unknown): {
  presetId: string;
  opts: { duration?: number; delay?: number; easing?: string };
} {
  const a = parseCfg(config).animation as
    | string
    | {
        presetId?: string;
        duration?: number;
        delay?: number;
        easing?: string;
      }
    | undefined;
  if (a && typeof a === "object") {
    return {
      presetId: a.presetId ?? "",
      opts: { duration: a.duration, delay: a.delay, easing: a.easing },
    };
  }
  return { presetId: typeof a === "string" ? a : "", opts: {} };
}

/**
 * Replays every animated block on the current page. The editor canvas has no
 * standing entrance-animation runtime (unlike the published site), and picking a
 * preset only previews it once — so without this, authors can't see their
 * animations while editing. Plays them on demand rather than on every scroll
 * (which would be distracting mid-edit).
 */
export function ReplayAnimations() {
  const blocks = useEditorStore((s) => s.blocks);

  const hasAnimated = blocks.some((b) => readAnim(b.config).presetId);

  const replay = useCallback(() => {
    const doc = useEditorStore.getState().contentDocument;
    for (const block of useEditorStore.getState().blocks) {
      const { presetId, opts } = readAnim(block.config);
      if (presetId) runPreviewAnimation(block.id, presetId, opts, doc);
    }
  }, []);

  return (
    <button
      type="button"
      onClick={replay}
      disabled={!hasAnimated}
      title="Replay animations"
      aria-label="Replay animations"
      className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <Sparkles className="size-4" />
      <span className="hidden sm:inline">Replay</span>
    </button>
  );
}
