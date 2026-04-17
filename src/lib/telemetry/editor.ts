type EditorEventName =
  | "editor.mount"
  | "editor.select"
  | "editor.save"
  | "editor.error";

interface EditorEvent {
  name: EditorEventName;
  ts: number;
  siteId?: string;
  props?: Record<string, unknown>;
}

let queue: EditorEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const FLUSH_INTERVAL_MS = 5_000;
const FLUSH_THRESHOLD = 10;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
}

function flush() {
  flushTimer = null;
  if (queue.length === 0) return;

  const batch = queue;
  queue = [];

  const body = JSON.stringify({ events: batch });

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/telemetry", body);
  } else {
    fetch("/api/telemetry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

function track(
  name: EditorEventName,
  siteId?: string,
  props?: Record<string, unknown>,
) {
  queue.push({ name, ts: Date.now(), siteId, props });
  if (queue.length >= FLUSH_THRESHOLD) {
    flush();
  } else {
    scheduleFlush();
  }
}

export function trackEditorMount(siteId: string) {
  track("editor.mount", siteId);
}

export function trackEditorSelect(
  siteId: string,
  blockId: string,
  latencyMs: number,
) {
  track("editor.select", siteId, { blockId, latencyMs });
}

export function trackEditorSave(
  siteId: string,
  ok: boolean,
  latencyMs: number,
) {
  track("editor.save", siteId, { ok, latencyMs });
}

export function trackEditorError(
  siteId: string,
  error: string,
  source: "boundary" | "canvas" | "save",
) {
  track("editor.error", siteId, { error, source });
}

export function flushEditorTelemetry() {
  flush();
}
