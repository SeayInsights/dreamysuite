"use client";

import React, { useCallback, useMemo, useState } from "react";
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
import {
  FloatingPopover,
  DividerLine,
  PaletteIcon,
  PaddingIcon,
  AnimationIcon,
  FormatIcon,
  ArrangeIcon,
} from "./ToolbarPrimitives";
import { ArrangePopoverContent } from "./ArrangePopoverContent";
import { useToolbarPosition } from "./useToolbarPosition";

// ---------------------------------------------------------------------------
// SectionToolbar — orchestrator
// ---------------------------------------------------------------------------

export function SectionToolbar({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}): React.JSX.Element | null {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const blockToolbarVisible = useEditorStore((s) => s.blockToolbarVisible);
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const selectedBlock = useSelectedBlock();
  const mode = useEditorStore((s) => s.mode);
  const themeColors = useEditorStore((s) => s.themeTokens.colors);
  const bgSwatches = useMemo(() => themeSwatches(themeColors), [themeColors]);
  const bgGradients = useMemo(() => themeGradients(themeColors), [themeColors]);

  const [activePopover, setActivePopover] = useState<"bg" | "padding" | "animation" | "arrange" | "format" | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const closePopover = useCallback(() => setActivePopover(null), []);

  const {
    toolbarRef,
    toolbarPhase,
    renderPos,
    renderBlockId,
    dragOffset,
    onToolbarPointerDown,
    onToolbarPointerMove,
    onToolbarPointerUp,
  } = useToolbarPosition({
    containerRef,
    selectedBlockId,
    blockToolbarVisible,
    onScroll: closePopover,
  });

  if (toolbarPhase === "hidden" || !renderPos || !renderBlockId) return null;

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
    updateBlock(renderBlockId!, { config: { ...config, blockZIndex: maxZ + 1 } });
  }

  function sendToBack() {
    const allBlocks = useEditorStore.getState().blocks;
    const minZ = allBlocks.reduce((min, b) => {
      const c = parseCfg(b.config);
      const z = typeof c.blockZIndex === "number" ? c.blockZIndex : 0;
      return Math.min(min, z);
    }, 0);
    updateBlock(renderBlockId!, { config: { ...config, blockZIndex: minZ - 1 } });
  }

  function openPopover(which: "bg" | "padding" | "animation" | "arrange" | "format", btnEl: HTMLElement) {
    const btnBox = btnEl.getBoundingClientRect();
    setPopoverPos({ top: btnBox.bottom + 6, left: btnBox.left });
    setActivePopover((prev) => (prev === which ? null : which));
  }

  return (
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
        willChange: undefined,
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

      {/* Toolbar buttons */}
      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" aria-label="Set section background"
        onClick={(e) => { e.stopPropagation(); openPopover("bg", e.currentTarget); }}>
        <PaletteIcon />Background
      </Button>

      <DividerLine />

      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" aria-label="Set section padding"
        onClick={(e) => { e.stopPropagation(); openPopover("padding", e.currentTarget); }}>
        <PaddingIcon />Padding
      </Button>

      {hasFormatPicker && (
        <>
          <DividerLine />
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" aria-label="Set block format"
            onClick={(e) => { e.stopPropagation(); openPopover("format", e.currentTarget); }}>
            <FormatIcon />Format
          </Button>
        </>
      )}

      <DividerLine />

      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" aria-label="Set block animation"
        onClick={(e) => { e.stopPropagation(); openPopover("animation", e.currentTarget); }}>
        <AnimationIcon />Animation
      </Button>

      <DividerLine />

      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" aria-label="Arrange block layering"
        onClick={(e) => { e.stopPropagation(); openPopover("arrange", e.currentTarget); }}>
        <ArrangeIcon />Arrange
      </Button>

      {/* Popovers */}
      <FloatingPopover open={activePopover === "bg"} top={popoverPos.top} left={popoverPos.left}
        onClose={closePopover} toolbarRef={toolbarRef}>
        <BackgroundPopover
          currentValue={currentBg}
          swatches={currentBg && currentBg !== "transparent" && !currentBg.startsWith("linear-gradient") && !currentBg.startsWith("radial-gradient") && !bgSwatches.includes(currentBg) ? [currentBg, ...bgSwatches.slice(1)] : bgSwatches}
          gradients={bgGradients}
          onSelect={(value) => {
            const freshBlock = useEditorStore.getState().blocks.find(b => b.id === renderBlockId);
            const freshCfg = parseCfg(freshBlock?.config);
            updateBlock(renderBlockId!, { config: { ...freshCfg, backgroundColor: value } });
          }}
        />
      </FloatingPopover>

      <FloatingPopover open={activePopover === "padding"} top={popoverPos.top} left={popoverPos.left}
        onClose={closePopover} toolbarRef={toolbarRef}>
        <PaddingPopover
          current={currentPadding}
          onChange={(padding) => {
            const freshBlock = useEditorStore.getState().blocks.find(b => b.id === renderBlockId);
            const freshCfg = parseCfg(freshBlock?.config);
            updateBlock(renderBlockId!, { config: { ...freshCfg, padding } });
          }}
        />
      </FloatingPopover>

      <FloatingPopover open={activePopover === "animation"} top={popoverPos.top} left={popoverPos.left}
        onClose={closePopover} toolbarRef={toolbarRef}>
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
            updateBlock(renderBlockId!, { config: { ...freshCfg, animation: { ...freshAnim, ...patch } } });
          }}
        />
      </FloatingPopover>

      {hasFormatPicker && (
        <FloatingPopover open={activePopover === "format"} top={popoverPos.top} left={popoverPos.left}
          onClose={closePopover} toolbarRef={toolbarRef}>
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

      <FloatingPopover open={activePopover === "arrange"} top={popoverPos.top} left={popoverPos.left}
        onClose={closePopover} toolbarRef={toolbarRef}>
        <ArrangePopoverContent
          currentRotation={currentRotation}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onRotationChange={(degrees) => updateBlock(renderBlockId!, { config: { ...config, blockRotation: degrees } })}
          onRotationReset={() => updateBlock(renderBlockId!, { config: { ...config, blockRotation: 0 } })}
        />
      </FloatingPopover>
    </div>
  );
}
