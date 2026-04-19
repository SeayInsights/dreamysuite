"use client";

/**
 * VideoInlineEditor
 *
 * Activates on dblclick on any video block (media-video, video, youtube).
 * Shows a floating toolbar with a "Video" button that opens an inline panel
 * for selecting from the media library or pasting a YouTube/Vimeo/GIF URL.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Video, X } from "lucide-react";
import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";

// ─── Constants ────────────────────────────────────────────────────────────────

const VIDEO_BEARING_TYPES = new Set(["media-video", "video", "youtube"]);
const TOOLBAR_HEIGHT = 40;
const TOOLBAR_FLIP_THRESHOLD = TOOLBAR_HEIGHT + 8;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRelativeRect(element: HTMLElement, container: HTMLElement): DOMRect {
  const eBox = element.getBoundingClientRect();
  const cBox = container.getBoundingClientRect();
  return new DOMRect(
    eBox.left - cBox.left,
    eBox.top - cBox.top + container.scrollTop,
    eBox.width,
    eBox.height,
  );
}

function detectProvider(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/vimeo\.com/.test(url)) return "vimeo";
  if (/\.gif(\?|$)/i.test(url)) return "gif";
  return "direct";
}

// ─── InlineVideoPanel ─────────────────────────────────────────────────────────

function InlineVideoPanel({
  blockId,
  style,
  onDismiss,
}: {
  blockId: string;
  style: React.CSSProperties;
  onDismiss: () => void;
}) {
  const siteId = useEditorStore((s) => s.siteId);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const [mediaVideos, setMediaVideos] = useState<{ id: string; url: string; title: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    if (!siteId) return;
    fetch(`/api/sites/${siteId}/media?type=video`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setMediaVideos((d as { items: { id: string; url: string; title: string | null }[] }).items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  function apply(url: string, provider?: string) {
    const block = useEditorStore.getState().blocks.find((b) => b.id === blockId);
    const cfg = parseCfg(block?.config);
    updateBlock(blockId, {
      config: { ...cfg, url, provider: provider ?? detectProvider(url) },
    });
    onDismiss();
  }

  function applyUrlInput() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    apply(trimmed);
  }

  const currentUrl = (() => {
    const block = useEditorStore.getState().blocks.find((b) => b.id === blockId);
    return String(parseCfg(block?.config).url ?? "");
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      data-video-editor-overlay
      className="absolute z-30 w-60 rounded-lg border border-border bg-popover shadow-xl"
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[11px] font-medium text-foreground">Select video</span>
        <button type="button" onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto p-2 space-y-2">
        {/* Media library */}
        {loading ? (
          <p className="py-2 text-center text-[10px] text-muted-foreground">Loading...</p>
        ) : mediaVideos.length > 0 ? (
          <div className="space-y-1">
            <p className="px-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Media library</p>
            {mediaVideos.map((v) => {
              const isSelected = currentUrl === v.url;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => apply(v.url)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[10px] transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Video className="size-3 shrink-0" />
                  <span className="flex-1 truncate">{v.title ?? v.url.split("/").pop()}</span>
                  {isSelected && <span className="shrink-0 text-primary text-[9px]">✓</span>}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* URL input */}
        <div className="space-y-1">
          <p className="px-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Paste a URL
          </p>
          <p className="px-1 text-[9px] text-muted-foreground">YouTube, Vimeo, GIF, or direct link</p>
          <div className="flex gap-1">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applyUrlInput(); }}
              placeholder="https://..."
              className="h-7 flex-1 rounded border border-input bg-background px-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={applyUrlInput}
              className="h-7 rounded bg-primary px-2 text-[10px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              Use
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── FloatingToolbar ─────────────────────────────────────────────────────────

function FloatingToolbar({
  blockRect,
  videoPanelOpen,
  onVideoToggle,
  onDismiss,
}: {
  blockRect: DOMRect;
  videoPanelOpen: boolean;
  onVideoToggle(): void;
  onDismiss(): void;
}) {
  const spaceAbove = blockRect.top;
  const showBelow = spaceAbove < TOOLBAR_FLIP_THRESHOLD;

  const style: React.CSSProperties = showBelow
    ? { top: blockRect.top + blockRect.height + 8, left: blockRect.left + blockRect.width / 2, transform: "translateX(-50%)" }
    : { top: blockRect.top - TOOLBAR_HEIGHT - 8, left: blockRect.left + blockRect.width / 2, transform: "translateX(-50%)" };

  return (
    <motion.div
      initial={{ opacity: 0, y: showBelow ? -4 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: showBelow ? -4 : 4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={style}
      className="absolute z-30 flex items-center gap-0.5 rounded-lg px-1.5 py-1 bg-neutral-900/95 shadow-xl ring-1 ring-white/10 backdrop-blur-sm"
    >
      <button
        type="button"
        aria-label="Change video"
        aria-pressed={videoPanelOpen}
        onClick={onVideoToggle}
        className={[
          "flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          videoPanelOpen
            ? "bg-primary text-primary-foreground"
            : "text-white hover:bg-white/20",
        ].join(" ")}
      >
        <Video className="h-3.5 w-3.5" />
        Video
      </button>
      <div className="mx-1 h-4 w-px bg-white/20" />
      <button
        type="button"
        aria-label="Exit video editor"
        onClick={onDismiss}
        className="flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

// ─── VideoInlineEditor (main export) ─────────────────────────────────────────

interface Props {
  containerRef: RefObject<HTMLElement | null>;
}

export function VideoInlineEditor({ containerRef }: Props) {
  const blocks = useEditorStore((s) => s.blocks);

  const [active, setActive] = useState<{ blockId: string; blockRect: DOMRect } | null>(null);
  const [videoPanel, setVideoPanel] = useState(false);
  const rafRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    setActive(null);
    setVideoPanel(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (videoPanel) { setVideoPanel(false); } else { dismiss(); }
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [active, videoPanel, dismiss]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handler = (e: MouseEvent) => {
      const blockRoot = (e.target as HTMLElement).closest<HTMLElement>("[data-block-id]");
      if (!blockRoot) return;
      const blockId = blockRoot.dataset.blockId;
      const blockType = blockRoot.dataset.blockType;
      if (!blockId || !blockType || !VIDEO_BEARING_TYPES.has(blockType)) return;

      e.preventDefault();
      e.stopPropagation();

      const blockRect = getRelativeRect(blockRoot, container);
      setActive({ blockId, blockRect });
      setVideoPanel(false);
    };

    container.addEventListener("dblclick", handler);
    return () => container.removeEventListener("dblclick", handler);
  }, [containerRef]);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const recompute = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const blockRoot = container.querySelector<HTMLElement>(`[data-block-id="${active.blockId}"]`);
        if (!blockRoot) return;
        const blockRect = getRelativeRect(blockRoot, container);
        setActive((prev) => prev ? { ...prev, blockRect } : prev);
      });
    };

    window.addEventListener("resize", recompute);
    container.addEventListener("scroll", recompute);
    return () => {
      window.removeEventListener("resize", recompute);
      container.removeEventListener("scroll", recompute);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, containerRef]);

  useEffect(() => {
    if (!active || videoPanel) return;
    const handler = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const blockRoot = container.querySelector<HTMLElement>(`[data-block-id="${active.blockId}"]`);
      if (blockRoot && blockRoot.contains(e.target as Node)) return;
      const overlay = document.querySelector<HTMLElement>("[data-video-editor-overlay]");
      if (overlay && overlay.contains(e.target as Node)) return;
      dismiss();
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [active, videoPanel, dismiss, containerRef]);

  const blockExists = active !== null && blocks.some((b) => b.id === active.blockId);
  if (!blockExists && active) {
    Promise.resolve().then(dismiss);
    return null;
  }

  const panelStyle: React.CSSProperties | null = active
    ? (() => {
        const { blockRect } = active;
        const spaceAbove = blockRect.top;
        const showBelow = spaceAbove < TOOLBAR_FLIP_THRESHOLD;
        const toolbarBottom = showBelow
          ? blockRect.top + blockRect.height + 8 + TOOLBAR_HEIGHT + 4
          : blockRect.top - TOOLBAR_HEIGHT - 8 + TOOLBAR_HEIGHT + 4;
        return {
          top: toolbarBottom,
          left: blockRect.left + blockRect.width / 2,
          transform: "translateX(-50%)",
        };
      })()
    : null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      aria-hidden
    >
      <div className="pointer-events-auto">
        <AnimatePresence>
          {active && (
            <FloatingToolbar
              key="toolbar"
              blockRect={active.blockRect}
              videoPanelOpen={videoPanel}
              onVideoToggle={() => setVideoPanel((v) => !v)}
              onDismiss={dismiss}
            />
          )}
          {active && videoPanel && panelStyle && (
            <InlineVideoPanel
              key="video-panel"
              blockId={active.blockId}
              style={panelStyle}
              onDismiss={() => setVideoPanel(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
