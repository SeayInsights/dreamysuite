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
import { Video, X, Maximize, Minimize2, Square, Move } from "lucide-react";
import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";

// ─── Constants ────────────────────────────────────────────────────────────────

const VIDEO_BEARING_TYPES = new Set(["media-video", "video", "youtube"]);
const TOOLBAR_HEIGHT = 40;
const TOOLBAR_FLIP_THRESHOLD = TOOLBAR_HEIGHT + 8;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getViewportRect(element: HTMLElement): DOMRect {
  return element.getBoundingClientRect();
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

// ─── ToolbarButton ────────────────────────────────────────────────────────────

function ToolbarButton({
  label,
  icon,
  active = false,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={[
        "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-primary text-primary-foreground" : "text-white hover:bg-white/20",
      ].join(" ")}
    >
      {icon}
    </button>
  );
}

// ─── Fit options ─────────────────────────────────────────────────────────────

const VIDEO_FIT_OPTIONS = [
  { id: "fill", label: "Fill", icon: Maximize },
  { id: "contain", label: "Fit", icon: Minimize2 },
  { id: "cover", label: "Crop", icon: Square },
  { id: "none", label: "None", icon: Move },
] as const;

// ─── FloatingToolbar ─────────────────────────────────────────────────────────

function FloatingToolbar({
  blockRect,
  videoPanelOpen,
  currentFit,
  onVideoToggle,
  onFitChange,
  onDismiss,
}: {
  blockRect: DOMRect;
  videoPanelOpen: boolean;
  currentFit: string;
  onVideoToggle(): void;
  onFitChange(fit: string): void;
  onDismiss(): void;
}) {
  const [showFitMenu, setShowFitMenu] = useState(false);
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
      data-video-editor-overlay
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-30 flex items-center gap-0.5 rounded-lg px-1.5 py-1 bg-neutral-900/95 shadow-xl ring-1 ring-white/10 backdrop-blur-sm"
    >
      <ToolbarButton
        label="Change video"
        icon={<Video className="h-3.5 w-3.5" />}
        active={videoPanelOpen}
        onClick={onVideoToggle}
      />
      <div className="mx-1 h-4 w-px bg-white/20" />
      <div className="relative">
        <ToolbarButton
          label="Video fit"
          icon={<Minimize2 className="h-3.5 w-3.5" />}
          active={showFitMenu}
          onClick={() => setShowFitMenu((v) => !v)}
        />
        {showFitMenu && (
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex gap-0.5 rounded-lg px-1 py-1 bg-neutral-900/95 shadow-xl ring-1 ring-white/10 backdrop-blur-sm"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {VIDEO_FIT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <ToolbarButton
                  key={opt.id}
                  label={opt.label}
                  icon={<Icon className="h-3.5 w-3.5" />}
                  active={currentFit === opt.id}
                  onClick={() => { onFitChange(opt.id); setShowFitMenu(false); }}
                />
              );
            })}
          </div>
        )}
      </div>
      <div className="mx-1 h-4 w-px bg-white/20" />
      <ToolbarButton label="Exit video editor" icon={<X className="h-3.5 w-3.5" />} onClick={onDismiss} />
    </motion.div>
  );
}

// ─── VideoInlineEditor (main export) ─────────────────────────────────────────

interface Props {
  containerRef: RefObject<HTMLElement | null>;
}

export function VideoInlineEditor({ containerRef }: Props) {
  const blocks = useEditorStore((s) => s.blocks);
  const updateBlock = useEditorStore((s) => s.updateBlock);

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

      const blockRect = getViewportRect(blockRoot);
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
        const blockRect = getViewportRect(blockRoot);
        setActive((prev) => prev ? { ...prev, blockRect } : prev);
      });
    };

    window.addEventListener("resize", recompute);
    document.addEventListener("scroll", recompute, true);
    return () => {
      window.removeEventListener("resize", recompute);
      document.removeEventListener("scroll", recompute, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, containerRef]);

  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const blockRoot = container.querySelector<HTMLElement>(`[data-block-id="${active.blockId}"]`);
      if (blockRoot && blockRoot.contains(e.target as Node)) return;
      // Both FloatingToolbar and InlineVideoPanel carry data-video-editor-overlay,
      // so any click inside either stops propagation before reaching here.
      // The querySelectorAll handles the case where both are mounted simultaneously.
      for (const overlay of document.querySelectorAll<HTMLElement>("[data-video-editor-overlay]")) {
        if (overlay.contains(e.target as Node)) return;
      }
      dismiss();
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [active, dismiss, containerRef]);

  const activeBlock = active ? blocks.find((b) => b.id === active.blockId) : null;
  const activeCfg = parseCfg(activeBlock?.config);
  const currentFit = typeof activeCfg.objectFit === "string" ? activeCfg.objectFit : "cover";

  const handleFitChange = useCallback((fit: string) => {
    if (!active) return;
    const block = useEditorStore.getState().blocks.find((b) => b.id === active.blockId);
    const cfg = parseCfg(block?.config);
    updateBlock(active.blockId, { config: { ...cfg, objectFit: fit } });
  }, [active, updateBlock]);

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
      className="pointer-events-none fixed inset-0 z-[100]"
      aria-hidden
    >
      <div className="pointer-events-auto">
        <AnimatePresence>
          {active && (
            <FloatingToolbar
              key="toolbar"
              blockRect={active.blockRect}
              videoPanelOpen={videoPanel}
              currentFit={currentFit}
              onVideoToggle={() => setVideoPanel((v) => !v)}
              onFitChange={handleFitChange}
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
