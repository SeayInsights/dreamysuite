"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import type { PendingOps, Block } from "@/app/stores/slices/document";

const DEBOUNCE_MS = 1_500;

/**
 * Returns true if all operations succeeded, false if any failed.
 * A failure means the store should remain dirty so the next flush retries.
 */
export async function flushOps(
  siteId: string,
  pageId: string,
  ops: PendingOps,
  blocks: Block[],
): Promise<boolean> {
  const promises: Promise<Response>[] = [];

  for (const id of ops.removed) {
    promises.push(
      fetch(`/api/sites/${siteId}/blocks/${id}`, {
        method: "DELETE",
        keepalive: true,
      }),
    );
  }

  for (const id of ops.inserted) {
    const block = blocks.find((b) => b.id === id);
    if (!block) continue;
    const idx = blocks.indexOf(block);
    promises.push(
      fetch(`/api/sites/${siteId}/blocks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: block.id,
          pageId,
          type: block.type,
          config: block.config,
          sortOrder: idx,
        }),
        keepalive: true,
      }),
    );
  }

  for (const id of ops.updated) {
    if (ops.inserted.has(id)) continue;
    const block = blocks.find((b) => b.id === id);
    if (!block) continue;
    const payload: Record<string, unknown> = { type: block.type, config: block.config };
    if (block.isVisible !== undefined) payload.isVisible = block.isVisible !== 0;
    promises.push(
      fetch(`/api/sites/${siteId}/blocks/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }),
    );
  }

  if (ops.reordered) {
    const reorderPayload = blocks
      .filter((b) => !ops.inserted.has(b.id))
      .map((b, i) => ({ id: b.id, sortOrder: i }));
    if (reorderPayload.length > 0) {
      promises.push(
        fetch(`/api/sites/${siteId}/blocks/reorder`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ blocks: reorderPayload }),
          keepalive: true,
        }),
      );
    }
  }

  const results = await Promise.allSettled(promises);

  const failures = results.filter(
    (r): r is PromiseRejectedResult | PromiseFulfilledResult<Response> =>
      r.status === "rejected" ||
      (r.status === "fulfilled" && !r.value.ok),
  );

  return failures.length === 0;
}

export function useBlockSync(siteId: string) {
  const isDirty = useEditorStore((s) => s.isDirty);
  const markClean = useEditorStore((s) => s.markClean);
  const setSaveError = useEditorStore((s) => s.setSaveError);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const siteIdRef = useRef(siteId);
  siteIdRef.current = siteId;

  const flushNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const state = useEditorStore.getState();
    const pageId = state.currentPageId;
    if (!state.isDirty || !pageId) return;
    flushOps(siteIdRef.current, pageId, state.pendingOps, state.blocks);
    // markClean intentionally omitted — keepalive fetch continues after unload;
    // debounce path awaits before marking clean on normal navigation.
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const state = useEditorStore.getState();
      const pageId = state.currentPageId;
      if (!state.isDirty || !pageId) return;
      flushOps(siteIdRef.current, pageId, state.pendingOps, state.blocks).then(
        (allSucceeded) => {
          if (allSucceeded) {
            markClean();
            setSaveError(null);
          } else {
            // Leave the store dirty so the next debounce cycle retries.
            setSaveError("Some changes could not be saved. Retrying…");
          }
        },
      );
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, markClean, setSaveError]);

  useEffect(() => {
    window.addEventListener("beforeunload", flushNow);
    return () => {
      window.removeEventListener("beforeunload", flushNow);
      flushNow();
    };
  }, [flushNow]);

  // Safety net: flush every 10s if dirty in case debounce or beforeunload missed
  useEffect(() => {
    const id = setInterval(() => {
      if (useEditorStore.getState().isDirty) flushNow();
    }, 10_000);
    return () => clearInterval(id);
  }, [flushNow]);
}
