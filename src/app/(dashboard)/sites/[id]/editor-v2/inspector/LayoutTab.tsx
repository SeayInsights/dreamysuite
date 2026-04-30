"use client";

import { useState, useEffect, useMemo } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";
import { X } from "lucide-react";

function SettingsInput({
  label,
  value,
  onChange,
  placeholder,
  unit = "px",
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  unit?: string;
}) {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  function commit() {
    const trimmed = draft.trim();
    onChange(trimmed === "" ? null : trimmed);
  }

  return (
    <div className="flex items-center gap-2">
      <label className="w-14 shrink-0 text-[10px] uppercase text-muted-foreground">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={draft}
        placeholder={placeholder ?? "auto"}
        onChange={(e) => {
          setDraft(e.target.value);
          const trimmed = e.target.value.trim();
          onChange(trimmed === "" ? null : trimmed);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          e.stopPropagation();
        }}
        className="h-7 w-full rounded border border-input bg-background px-2 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <span className="shrink-0 text-[10px] text-muted-foreground">{unit}</span>
    </div>
  );
}

export function LayoutTab() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const blocks = useEditorStore((s) => s.blocks);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const breakpoint = useEditorStore((s) => s.breakpoint);
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const selectedBlock = useMemo(() => {
    return selectedBlockId ? blocks.find((b) => b.id === selectedBlockId) : null;
  }, [blocks, selectedBlockId]);

  const hasOrderOverride = useMemo(() => {
    if (!selectedBlock || breakpoint === "desktop") return false;
    return selectedBlock.overrides?.[breakpoint]?.sortOrder !== undefined;
  }, [selectedBlock, breakpoint]);

  const hasCustomPositioning = useMemo(() => {
    return blocks.some((b) => {
      const cfg = parseCfg(b.config);
      return (
        (typeof cfg.blockOffsetX === "number" && cfg.blockOffsetX !== 0) ||
        (typeof cfg.blockOffsetY === "number" && cfg.blockOffsetY !== 0)
      );
    });
  }, [blocks]);

  function resetOrderOverride() {
    if (!selectedBlock || breakpoint === "desktop") return;

    // Clone overrides and remove sortOrder for the current breakpoint
    const newOverrides = { ...selectedBlock.overrides };
    if (newOverrides[breakpoint]) {
      const { sortOrder: _, ...rest } = newOverrides[breakpoint] as Record<string, unknown>;

      // If no other overrides remain for this breakpoint, remove the breakpoint key entirely
      if (Object.keys(rest).length === 0) {
        delete newOverrides[breakpoint];
      } else {
        newOverrides[breakpoint] = rest;
      }
    }

    // Update the block with the cleaned overrides
    updateBlock(selectedBlock.id, { overrides: newOverrides });
  }

  return (
    <div className="space-y-4 p-4">
      {/* Block Order Override Indicator */}
      {selectedBlock && hasOrderOverride && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tile Order
          </p>
          <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950">
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                Custom order on {breakpoint}
              </p>
              <p className="text-[10px] text-blue-700 dark:text-blue-300">
                This tile has a different position on {breakpoint} breakpoint
              </p>
            </div>
            <button
              type="button"
              onClick={resetOrderOverride}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-blue-300 bg-white text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
              title="Reset to inherited order"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className={selectedBlock && hasOrderOverride ? "border-t border-border pt-4" : ""}>
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Page Margins
          </p>
          <div className="grid grid-cols-2 gap-2">
            <SettingsInput
              label="Top"
              value={settings.marginTop}
              onChange={(v) => updateSettings({ marginTop: v })}
            />
            <SettingsInput
              label="Right"
              value={settings.marginRight}
              onChange={(v) => updateSettings({ marginRight: v })}
            />
            <SettingsInput
              label="Bottom"
              value={settings.marginBottom}
              onChange={(v) => updateSettings({ marginBottom: v })}
            />
            <SettingsInput
              label="Left"
              value={settings.marginLeft}
              onChange={(v) => updateSettings({ marginLeft: v })}
            />
          </div>
        </div>
      </div>

      <div className={`space-y-2 border-t border-border pt-4 ${hasCustomPositioning ? "opacity-40 pointer-events-none" : ""}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Section Spacing
        </p>
        <SettingsInput
          label="Gap"
          value={settings.sectionSpacing}
          onChange={(v) => updateSettings({ sectionSpacing: v })}
          placeholder="0"
        />
        {hasCustomPositioning && (
          <p className="text-[10px] text-muted-foreground">
            Gap is disabled because one or more blocks use custom positioning. Reset block offsets to re-enable.
          </p>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <button
          type="button"
          disabled
          className="flex h-9 w-full items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground"
        >
          Templates — coming soon
        </button>
      </div>
    </div>
  );
}
