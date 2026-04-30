"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import type { PendingOps, Block } from "@/app/stores/slices/document";

// Strip char-spread numeric keys (e.g. {"0":"{","1":"\"" ...}) from a config
// object before serializing. These appear when a corrupted JSON string is spread
// character-by-character into the store and would blow past the 64 KB keepalive limit.
function cleanConfig(cfg: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(cfg).filter(([k]) => !/^\d+$/.test(k)));
}

const DEBOUNCE_MS = 1_500;
const DEBUG_SYNC = false;

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
          config: cleanConfig(block.config),
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
    const payload: Record<string, unknown> = { type: block.type, config: cleanConfig(block.config) };
    if (block.isVisible !== undefined) payload.isVisible = block.isVisible !== 0;
    if (block.overrides !== undefined) payload.overrides = block.overrides;
    if (DEBUG_SYNC) {
      console.log(`[useBlockSync] PUT block=${id} type=${block.type} config=`, JSON.parse(JSON.stringify(block.config)));
    }
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

  if (DEBUG_SYNC) {
    console.group(`[useBlockSync] flushOps — ${promises.length} request(s)`);
    console.log("updated:", [...ops.updated]);
    console.log("inserted:", [...ops.inserted]);
    console.log("removed:", [...ops.removed]);
    console.log("reordered:", ops.reordered);
  }

  const results = await Promise.allSettled(promises);

  const failures = results.filter(
    (r): r is PromiseRejectedResult | PromiseFulfilledResult<Response> =>
      r.status === "rejected" ||
      (r.status === "fulfilled" && !r.value.ok),
  );

  if (DEBUG_SYNC) {
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "rejected") {
        console.error(`[useBlockSync] request ${i} rejected:`, r.reason);
      } else if (!r.value.ok) {
        r.value.text().then((body) => {
          console.error(`[useBlockSync] request ${i} HTTP ${r.value.status}:`, body);
        });
      }
    }
    console.log(`[useBlockSync] result: ${failures.length === 0 ? "SUCCESS" : `FAILED (${failures.length} failures)`}`);
    console.groupEnd();
  }

  return failures.length === 0;
}

export function useBlockSync(siteId: string) {
  const isDirty = useEditorStore((s) => s.isDirty);
  const markFlushed = useEditorStore((s) => s.markFlushed);
  const setSaveError = useEditorStore((s) => s.setSaveError);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const siteIdRef = useRef(siteId);
  // eslint-disable-next-line react-hooks/refs
  siteIdRef.current = siteId;

  const flushNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const state = useEditorStore.getState();
    const pageId = state.currentPageId;
    if (!state.isDirty || !pageId) return;
    flushOps(siteIdRef.current, pageId, state.pendingOps, state.blocks);
  }, []);

  const debouncedFlushRef = useRef<() => void>(() => undefined);
  const debouncedFlush = useCallback(() => {
    const state = useEditorStore.getState();
    const pageId = state.currentPageId;
    if (!state.isDirty || !pageId) return;
    const opsSnapshot: PendingOps = {
      updated: new Set(state.pendingOps.updated),
      inserted: new Set(state.pendingOps.inserted),
      removed: new Set(state.pendingOps.removed),
      reordered: state.pendingOps.reordered,
    };
    flushOps(siteIdRef.current, pageId, opsSnapshot, state.blocks).then(
      (allSucceeded) => {
        if (allSucceeded) {
          markFlushed(opsSnapshot);
          setSaveError(null);
        } else {
          setSaveError("Some changes could not be saved. Retrying…");
          retryRef.current = setTimeout(() => debouncedFlushRef.current(), DEBOUNCE_MS * 2);
        }
      },
      () => {
        setSaveError("Save failed — retrying…");
        retryRef.current = setTimeout(() => debouncedFlushRef.current(), DEBOUNCE_MS * 2);
      },
    );
  }, [markFlushed, setSaveError]);
  // eslint-disable-next-line react-hooks/refs
  debouncedFlushRef.current = debouncedFlush;

  useEffect(() => {
    if (!isDirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      debouncedFlush();
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, debouncedFlush]);

  useEffect(() => {
    window.addEventListener("beforeunload", flushNow);
    return () => {
      window.removeEventListener("beforeunload", flushNow);
      flushNow();
    };
  }, [flushNow]);

  useEffect(() => {
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []);
}
