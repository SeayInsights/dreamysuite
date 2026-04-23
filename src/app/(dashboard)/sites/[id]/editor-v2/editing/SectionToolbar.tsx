"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { animate } from "motion/mini";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/app/stores/editorStore";
import { useSelectedBlock } from "../hooks/useSelectedBlock";
import { parseCfg } from "@/lib/editableField";
import { themeSwatches, themeGradients } from "../lib/themeSwatches";
import { BackgroundPopover } from "./popovers/BackgroundPopover";
import { PaddingPopover, type PaddingValue } from "./popovers/PaddingPopover";
import { AnimationPopoverContent, DEFAULT_ANIM, type AnimationConfig } from "./popovers/AnimationPopover";
import { FormatPopover, FORMAT_OPTIONS } from "./popovers/FormatPopover";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Position {
  top: number;
  left: number;
}

// ---------------------------------------------------------------------------
// (Swatches are now theme-derived — see themeSwatches utility)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Popover primitive (shared, portal-less, position:fixed)
// ---------------------------------------------------------------------------

interface PopoverProps {
  open: boolean;
  top: number;
  left: number;
  onClose: () => void;
  toolbarRef?: React.RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

function FloatingPopover({ open, top, left, onClose, toolbarRef, children }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        if (toolbarRef?.current?.contains(target)) return;
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, toolbarRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      className={cn(
        "fixed z-[9999] rounded-lg border border-border bg-popover p-3 shadow-lg",
        "text-popover-foreground",
      )}
      style={{ top, left }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function PaletteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4.5" cy="6" r="1" fill="currentColor" />
      <circle cx="7" cy="4" r="1" fill="currentColor" />
      <circle cx="9.5" cy="6" r="1" fill="currentColor" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="5.5" cy="8.5" r="1" fill="currentColor" />
    </svg>
  );
}

function PaddingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect
        x="2"
        y="2"
        width="10"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="2 1"
      />
      <rect x="4" y="4" width="6" height="6" rx="0.75" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function AnimationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2 7c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M7 4.5V7l1.5 1.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FormatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="2" width="5" height="5" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="8" y="2" width="5" height="5" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="1" y="9" width="5" height="3" rx="0.75" fill="currentColor" opacity="0.3" />
      <rect x="8" y="9" width="5" height="3" rx="0.75" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

function ArrangeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="1" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="5" y="5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="var(--popover)" />
    </svg>
  );
}

function DividerLine() {
  return <div className="h-5 w-px bg-border mx-0.5" aria-hidden />;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SectionToolbar({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}): React.JSX.Element | null {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const blockToolbarVisible = useEditorStore((s) => s.blockToolbarVisible);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const selectedBlock = useSelectedBlock();
  const mode = useEditorStore((s) => s.mode);
  const themeColors = useEditorStore((s) => s.themeTokens.colors);
  const bgSwatches = useMemo(() => themeSwatches(themeColors), [themeColors]);
  const bgGradients = useMemo(() => themeGradients(themeColors), [themeColors]);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [activePopover, setActivePopover] = useState<"bg" | "padding" | "animation" | "arrange" | "format" | null>(null);
  const [popoverPos, setPopoverPos] = useState<Position>({ top: 0, left: 0 });

  // Drag offset — added on top of auto-calculated renderPos so the toolbar
  // follows the block on scroll/resize while preserving the user's drag delta.
  const [dragOffset, setDragOffset] = useState<Position>({ top: 0, left: 0 });
  const dragOffsetRef = useRef<Position>({ top: 0, left: 0 });
  const toolbarDragRef = useRef<{ startX: number; startY: number; startOffset: Position } | null>(null);

  // Reset drag offset when block selection changes
  const prevSelectedRef = useRef(selectedBlockId);
  useEffect(() => {
    if (prevSelectedRef.current !== selectedBlockId) {
      dragOffsetRef.current = { top: 0, left: 0 };
      setDragOffset({ top: 0, left: 0 });
      prevSelectedRef.current = selectedBlockId;
    }
  }, [selectedBlockId]);

  const onToolbarPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    toolbarDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffset: { ...dragOffsetRef.current },
    };
  }, []);

  const onToolbarPointerMove = useCallback((e: React.PointerEvent) => {
    const session = toolbarDragRef.current;
    if (!session) return;
    e.stopPropagation();
    const next = {
      top: session.startOffset.top + (e.clientY - session.startY),
      left: session.startOffset.left + (e.clientX - session.startX),
    };
    dragOffsetRef.current = next;
    setDragOffset(next);
  }, []);

  const onToolbarPointerUp = useCallback((e: React.PointerEvent) => {
    toolbarDragRef.current = null;
    e.stopPropagation();
  }, []);

  const TOOLBAR_HEIGHT = 44;
  const TOOLBAR_MARGIN = 8;
  const ANIM_MS = 150;

  // Animation phase state machine — keeps toolbar mounted during exit animation
  type ToolbarPhase = "hidden" | "shown" | "exiting";
  const phaseRef = useRef<ToolbarPhase>("hidden");
  const [toolbarPhase, setToolbarPhaseState] = useState<ToolbarPhase>("hidden");
  const [renderPos, setRenderPos] = useState<Position | null>(null);
  const [renderBlockId, setRenderBlockId] = useState<string | null>(null);
  // Ref mirror of renderBlockId — avoids stale closure in effects
  const renderBlockIdRef = useRef<string | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Holds a pending enter when a block-switch exit is in flight
  const pendingShowRef = useRef<{ pos: Position; blockId: string } | null>(null);

  function setToolbarPhase(p: ToolbarPhase) {
    phaseRef.current = p;
    setToolbarPhaseState(p);
  }

  function showBlock(pos: Position, blockId: string) {
    renderBlockIdRef.current = blockId;
    setRenderPos(pos);
    setRenderBlockId(blockId);
    setToolbarPhase("shown");
  }

  // Measure and position the toolbar relative to the selected block
  const measurePosition = useCallback(() => {
    const container = containerRef.current;
    if (!container || !selectedBlockId) {
      setPosition(null);
      return;
    }
    const node = container.querySelector<HTMLElement>(
      `[data-block-id="${selectedBlockId}"]`,
    );
    if (!node) {
      setPosition(null);
      return;
    }
    const frameBox = container.getBoundingClientRect();
    const box = node.getBoundingClientRect();
    const relTop = box.top - frameBox.top + (container.scrollTop ?? 0);

    const TOOLBAR_WIDTH = 320;
    const rawLeft = (box.left - frameBox.left) + box.width / 2 - TOOLBAR_WIDTH / 2;
    const maxLeft = frameBox.width - TOOLBAR_WIDTH;
    const clampedLeft = Math.max(0, Math.min(rawLeft, Math.max(0, maxLeft)));

    const spaceAbove = box.top - frameBox.top;
    const fitsAbove = spaceAbove >= TOOLBAR_HEIGHT + TOOLBAR_MARGIN;
    const scrollTop = container.scrollTop ?? 0;
    const viewportBottom = scrollTop + container.clientHeight;

    let top: number;
    if (fitsAbove) {
      top = relTop - TOOLBAR_HEIGHT - TOOLBAR_MARGIN;
    } else {
      const belowPos = relTop + box.height + TOOLBAR_MARGIN;
      if (belowPos + TOOLBAR_HEIGHT <= viewportBottom) {
        top = belowPos;
      } else {
        top = scrollTop + TOOLBAR_MARGIN;
      }
    }

    setPosition({ top, left: clampedLeft });
  }, [containerRef, selectedBlockId]);

  // Re-measure on selection change or resize/scroll
  useEffect(() => {
    measurePosition();
  }, [measurePosition]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const raf = { id: 0 };
    const onUpdate = () => {
      cancelAnimationFrame(raf.id);
      raf.id = requestAnimationFrame(measurePosition);
    };
    const onScroll = () => {
      setActivePopover(null);
      onUpdate();
    };
    window.addEventListener("resize", onUpdate);
    container.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("resize", onUpdate);
      container.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf.id);
    };
  }, [containerRef, measurePosition]);

  // Enter animation — motion/mini animate() runs off React's render cycle,
  // so it doesn't suffer from React 18 batching issues. Fires whenever
  // renderBlockId changes (initial show or block switch after exit).
  useEffect(() => {
    if (toolbarPhase !== "shown") return;
    const el = toolbarRef.current;
    if (!el) return;
    el.style.opacity = "0";
    animate(
      el,
      { opacity: [0, 1], transform: ["translateY(8px)", "translateY(0px)"] },
      { duration: ANIM_MS / 1000, ease: [0.16, 1, 0.3, 1] },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderBlockId]);

  // Exit animation
  useEffect(() => {
    if (toolbarPhase !== "exiting") return;
    const el = toolbarRef.current;
    if (!el) return;
    animate(
      el,
      { opacity: [1, 0], transform: ["translateY(0px)", "translateY(-8px)"] },
      { duration: ANIM_MS / 1000, ease: "easeIn" },
    );
  }, [toolbarPhase]);

  // Main show/hide logic — position updates, block switching, exit to hidden.
  useEffect(() => {
    const shouldShow = !!(selectedBlockId && position && blockToolbarVisible);

    if (shouldShow) {
      const switchingBlock =
        phaseRef.current === "shown" &&
        selectedBlockId !== renderBlockIdRef.current;

      if (animTimerRef.current) { clearTimeout(animTimerRef.current); animTimerRef.current = null; }

      if (switchingBlock) {
        // Exit current block, then enter new block after the exit plays.
        pendingShowRef.current = { pos: position, blockId: selectedBlockId };
        setToolbarPhase("exiting");
        animTimerRef.current = setTimeout(() => {
          const pending = pendingShowRef.current;
          pendingShowRef.current = null;
          if (pending) showBlock(pending.pos, pending.blockId);
        }, ANIM_MS);
      } else if (phaseRef.current !== "shown") {
        // Fresh show (was hidden or mid-exit).
        showBlock(position, selectedBlockId);
      } else {
        // Same block — always update renderPos; drag offset handles user displacement.
        setRenderPos(position);
      }
    } else if (phaseRef.current !== "hidden" && phaseRef.current !== "exiting") {
      if (animTimerRef.current) { clearTimeout(animTimerRef.current); animTimerRef.current = null; }
      pendingShowRef.current = null;
      setToolbarPhase("exiting");
      animTimerRef.current = setTimeout(() => {
        phaseRef.current = "hidden";
        setToolbarPhaseState("hidden");
        renderBlockIdRef.current = null;
        setRenderPos(null);
        setRenderBlockId(null);
      }, ANIM_MS);
    }
  }, [selectedBlockId, blockToolbarVisible, position]);

  // Cleanup timers on unmount.
  useEffect(() => () => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
  }, []);

  if (toolbarPhase === "hidden" || !renderPos || !renderBlockId) return null;

  // Use selectedBlock from the hook for render — only re-renders when that
  // specific block changes, not when any unrelated block changes.
  // For bringToFront/sendToBack we read getState().blocks at call-time
  // (not reactive) since those functions are only called on user interaction.
  const block = selectedBlock?.id === renderBlockId ? selectedBlock : null;
  const config = parseCfg(block?.config);

  const currentBg =
    typeof config.backgroundColor === "string" ? config.backgroundColor : "#ffffff";

  const rawPadding = config.padding;
  const currentPadding: PaddingValue =
    rawPadding !== null &&
    typeof rawPadding === "object" &&
    !Array.isArray(rawPadding)
      ? {
          top: typeof (rawPadding as Record<string, unknown>).top === "number"
            ? ((rawPadding as Record<string, unknown>).top as number)
            : undefined,
          right: typeof (rawPadding as Record<string, unknown>).right === "number"
            ? ((rawPadding as Record<string, unknown>).right as number)
            : undefined,
          bottom: typeof (rawPadding as Record<string, unknown>).bottom === "number"
            ? ((rawPadding as Record<string, unknown>).bottom as number)
            : undefined,
          left: typeof (rawPadding as Record<string, unknown>).left === "number"
            ? ((rawPadding as Record<string, unknown>).left as number)
            : undefined,
        }
      : {};

  const rawAnim = config.animation;
  const currentAnim: AnimationConfig = {
    ...DEFAULT_ANIM,
    ...(rawAnim !== null && typeof rawAnim === "object" && !Array.isArray(rawAnim)
      ? (rawAnim as Partial<AnimationConfig>)
      : {}),
  };

  const currentZIndex = typeof config.blockZIndex === "number" ? config.blockZIndex : 0;
  const currentRotation = typeof config.blockRotation === "number" ? config.blockRotation : 0;

  const blockType = block?.type ?? "";
  const hasFormatPicker = blockType in FORMAT_OPTIONS;
  const currentFormat = typeof config.displayMode === "string" ? config.displayMode
    : blockType === "tidbits" ? (typeof config.cardStyle === "string" ? config.cardStyle : null)
    : null;

  function bringToFront() {
    const allBlocks = useEditorStore.getState().blocks;
    const maxZ = allBlocks.reduce((max, b) => {
      const c = parseCfg(b.config);
      const z = typeof c.blockZIndex === "number" ? c.blockZIndex : 0;
      return Math.max(max, z);
    }, 0);
    updateBlock(renderBlockId!, {
      config: { ...config, blockZIndex: maxZ + 1 },
    });
  }

  function sendToBack() {
    const allBlocks = useEditorStore.getState().blocks;
    const minZ = allBlocks.reduce((min, b) => {
      const c = parseCfg(b.config);
      const z = typeof c.blockZIndex === "number" ? c.blockZIndex : 0;
      return Math.min(min, z);
    }, 0);
    updateBlock(renderBlockId!, {
      config: { ...config, blockZIndex: minZ - 1 },
    });
  }

  function openPopover(which: "bg" | "padding" | "animation" | "arrange" | "format", btnEl: HTMLElement): void {
    const btnBox = btnEl.getBoundingClientRect();
    setPopoverPos({ top: btnBox.bottom + 6, left: btnBox.left });
    setActivePopover((prev) => (prev === which ? null : which));
  }

  return (
    // The container is position:relative so toolbar sits inside the scroll container
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Section toolbar"
      className={cn(
        "absolute z-50 flex items-center gap-0.5 rounded-lg border border-border",
        "bg-popover px-0 py-1 shadow-lg",
      )}
      style={{
        transform: `translate(${(renderPos?.left ?? 0) + dragOffset.left}px, ${(renderPos?.top ?? 0) + dragOffset.top}px)`,
        willChange: toolbarDragRef.current ? "transform" : undefined,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Grab handle */}
      <div
        className="flex items-center justify-center rounded-l-lg cursor-grab active:cursor-grabbing self-stretch px-1 hover:bg-muted/60 transition-colors"
        style={{ touchAction: "none" }}
        onPointerDown={onToolbarPointerDown}
        onPointerMove={onToolbarPointerMove}
        onPointerUp={onToolbarPointerUp}
      >
        <svg width="6" height="18" viewBox="0 0 6 18" fill="currentColor" className="text-muted-foreground/60" aria-hidden>
          <circle cx="1.5" cy="3" r="1" /><circle cx="4.5" cy="3" r="1" />
          <circle cx="1.5" cy="7" r="1" /><circle cx="4.5" cy="7" r="1" />
          <circle cx="1.5" cy="11" r="1" /><circle cx="4.5" cy="11" r="1" />
          <circle cx="1.5" cy="15" r="1" /><circle cx="4.5" cy="15" r="1" />
        </svg>
      </div>

      {/* Background button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        aria-label="Set section background"
        onClick={(e) => { e.stopPropagation(); openPopover("bg", e.currentTarget); }}
      >
        <PaletteIcon />
        Background
      </Button>

      <DividerLine />

      {/* Padding button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        aria-label="Set section padding"
        onClick={(e) => { e.stopPropagation(); openPopover("padding", e.currentTarget); }}
      >
        <PaddingIcon />
        Padding
      </Button>

      {hasFormatPicker && (
        <>
          <DividerLine />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            aria-label="Set block format"
            onClick={(e) => { e.stopPropagation(); openPopover("format", e.currentTarget); }}
          >
            <FormatIcon />
            Format
          </Button>
        </>
      )}

      <DividerLine />

      {/* Animation button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        aria-label="Set block animation"
        onClick={(e) => { e.stopPropagation(); openPopover("animation", e.currentTarget); }}
      >
        <AnimationIcon />
        Animation
      </Button>

      <DividerLine />

      {/* Arrange button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        aria-label="Arrange block layering"
        onClick={(e) => { e.stopPropagation(); openPopover("arrange", e.currentTarget); }}
      >
        <ArrangeIcon />
        Arrange
      </Button>

      {/* Background popover */}
      <FloatingPopover
        open={activePopover === "bg"}
        top={popoverPos.top}
        left={popoverPos.left}
        onClose={() => setActivePopover(null)}
        toolbarRef={toolbarRef}
      >
        <BackgroundPopover
          currentValue={currentBg}
          swatches={currentBg && currentBg !== "transparent" && !currentBg.startsWith("linear-gradient") && !currentBg.startsWith("radial-gradient") && !bgSwatches.includes(currentBg) ? [currentBg, ...bgSwatches.slice(1)] : bgSwatches}
          gradients={bgGradients}
          onSelect={(value) => {
            const freshBlock = useEditorStore.getState().blocks.find(b => b.id === renderBlockId);
            const freshCfg = parseCfg(freshBlock?.config);
            updateBlock(renderBlockId!, {
              config: { ...freshCfg, backgroundColor: value },
            });
          }}
        />
      </FloatingPopover>

      {/* Padding popover */}
      <FloatingPopover
        open={activePopover === "padding"}
        top={popoverPos.top}
        left={popoverPos.left}
        onClose={() => setActivePopover(null)}
        toolbarRef={toolbarRef}
      >
        <PaddingPopover
          current={currentPadding}
          onChange={(padding) => {
            const freshBlock = useEditorStore.getState().blocks.find(b => b.id === renderBlockId);
            const freshCfg = parseCfg(freshBlock?.config);
            updateBlock(renderBlockId!, {
              config: { ...freshCfg, padding },
            });
          }}
        />
      </FloatingPopover>

      {/* Animation popover */}
      <FloatingPopover
        open={activePopover === "animation"}
        top={popoverPos.top}
        left={popoverPos.left}
        onClose={() => setActivePopover(null)}
        toolbarRef={toolbarRef}
      >
        <AnimationPopoverContent
          blockId={renderBlockId!}
          anim={currentAnim}
          isPro={mode === "pro"}
          onUpdate={(patch) => {
            const freshBlock = useEditorStore.getState().blocks.find(b => b.id === renderBlockId);
            const freshCfg = parseCfg(freshBlock?.config);
            const freshAnim = {
              ...DEFAULT_ANIM,
              ...(freshCfg.animation !== null && typeof freshCfg.animation === "object" && !Array.isArray(freshCfg.animation)
                ? (freshCfg.animation as Partial<AnimationConfig>)
                : {}),
            };
            const next = { ...freshAnim, ...patch };
            updateBlock(renderBlockId!, {
              config: { ...freshCfg, animation: next },
            });
          }}
        />
      </FloatingPopover>

      {/* Format popover */}
      {hasFormatPicker && (
        <FloatingPopover
          open={activePopover === "format"}
          top={popoverPos.top}
          left={popoverPos.left}
          onClose={() => setActivePopover(null)}
          toolbarRef={toolbarRef}
        >
          <FormatPopover
            blockType={blockType}
            value={currentFormat}
            onChange={(id) => {
              if (blockType === "tidbits") {
                updateBlock(renderBlockId!, { config: { ...config, cardStyle: id } });
              } else {
                updateBlock(renderBlockId!, { config: { ...config, displayMode: id } });
              }
              setActivePopover(null);
            }}
          />
        </FloatingPopover>
      )}

      {/* Arrange popover */}
      <FloatingPopover
        open={activePopover === "arrange"}
        top={popoverPos.top}
        left={popoverPos.left}
        onClose={() => setActivePopover(null)}
        toolbarRef={toolbarRef}
      >
        <div className="w-48 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Layer Order
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={(e) => { e.stopPropagation(); bringToFront(); }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M7 2v10M4 4.5L7 2l3 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Bring to Front
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={(e) => { e.stopPropagation(); sendToBack(); }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M7 12V2M4 9.5L7 12l3-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Send to Back
          </Button>

          <div className="border-t border-border pt-2 mt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Rotation
            </p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={currentRotation}
                className="flex-1 h-1 accent-primary"
                onChange={(e) => {
                  e.stopPropagation();
                  updateBlock(renderBlockId!, {
                    config: { ...config, blockRotation: Number(e.target.value) },
                  });
                }}
              />
              <div className="flex items-center gap-0.5">
                <input
                  type="number"
                  min={-180}
                  max={180}
                  value={currentRotation}
                  className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-center tabular-nums"
                  onChange={(e) => {
                    e.stopPropagation();
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v)) {
                      updateBlock(renderBlockId!, {
                        config: { ...config, blockRotation: Math.max(-180, Math.min(180, v)) },
                      });
                    }
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                />
                <span className="text-[10px] text-muted-foreground">°</span>
              </div>
            </div>
            {currentRotation !== 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-xs mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  updateBlock(renderBlockId!, {
                    config: { ...config, blockRotation: 0 },
                  });
                }}
              >
                Reset rotation
              </Button>
            )}
          </div>
        </div>
      </FloatingPopover>

    </div>
  );
}
