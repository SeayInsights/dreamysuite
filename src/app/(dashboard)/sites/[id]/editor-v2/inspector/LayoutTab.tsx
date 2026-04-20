"use client";

import { useState, useEffect, useMemo } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";

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

  const hasCustomPositioning = useMemo(() => {
    return blocks.some((b) => {
      const cfg = parseCfg(b.config);
      return (
        (typeof cfg.blockOffsetX === "number" && cfg.blockOffsetX !== 0) ||
        (typeof cfg.blockOffsetY === "number" && cfg.blockOffsetY !== 0)
      );
    });
  }, [blocks]);

  return (
    <div className="space-y-4 p-4">
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
