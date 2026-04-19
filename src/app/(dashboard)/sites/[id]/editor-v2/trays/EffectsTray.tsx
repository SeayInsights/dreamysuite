"use client";

import { useEditorStore } from "@/app/stores/editorStore";
import { EffectPresetPicker } from "../EffectPresetPicker";
import { EffectPicker } from "../EffectPicker";
import type { EventType, EffectPreset } from "@/lib/effects/types";

export function EffectsTray() {
  const effectPreset = useEditorStore((s) => s.settings.effectPreset);
  const effectDecoration = useEditorStore((s) => s.settings.effectDecoration);
  const effectCursor = useEditorStore((s) => s.settings.effectCursor);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const eventType = useEditorStore((s) => s.eventType) as EventType | null;

  const handleApplyPreset = (effects: EffectPreset["effects"], presetId: string) => {
    updateSettings({
      effectPreset: presetId,
      effectBg: effects.background ?? null,
      effectNav: effects.nav ?? null,
      effectNavStyle: effects.navStyle ?? null,
      effectText: effects.text ?? null,
      effectCursor: effects.cursor ?? null,
      effectDecoration: effects.decoration ?? null,
    });
  };

  const handleClearPreset = () => {
    updateSettings({
      effectPreset: null,
      effectBg: null,
      effectNav: null,
      effectNavStyle: null,
      effectText: null,
      effectCursor: null,
      effectDecoration: null,
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Effects
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-5">
          <EffectPresetPicker
            eventType={eventType}
            activePresetId={effectPreset}
            onApply={handleApplyPreset}
            onClear={handleClearPreset}
          />

          <div className="h-px bg-border" />

          <EffectPicker
            category="decoration"
            value={effectDecoration}
            onChange={(id) =>
              updateSettings({ effectDecoration: id, effectPreset: null })
            }
            label="Decorations"
          />

          <EffectPicker
            category="cursor"
            value={effectCursor}
            onChange={(id) =>
              updateSettings({ effectCursor: id, effectPreset: null })
            }
            label="Cursor"
          />
        </div>
      </div>
    </div>
  );
}
