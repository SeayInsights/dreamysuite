"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import type { PendingOps, Block } from "@/app/stores/slices/document";

const DEBOUNCE_MS = 1_500;

async function flushOps(
  siteId: string,
  pageId: string,
  ops: PendingOps,
  blocks: Block[],
) {
  const promises: Promise<unknown>[] = [];

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
    const payload: Record<string, unknown> = { config: block.config };
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
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (ops.inserted.has(b.id)) continue;
      promises.push(
        fetch(`/api/sites/${siteId}/blocks/${b.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sortOrder: i }),
          keepalive: true,
        }),
      );
    }
  }

  await Promise.allSettled(promises);
}

export function useBlockSync(siteId: string) {
  const isDirty = useEditorStore((s) => s.isDirty);
  const markClean = useEditorStore((s) => s.markClean);
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
    state.markClean();
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
        () => markClean(),
      );
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, markClean]);

  useEffect(() => {
    window.addEventListener("beforeunload", flushNow);
    return () => {
      window.removeEventListener("beforeunload", flushNow);
      flushNow();
    };
  }, [flushNow]);
}
