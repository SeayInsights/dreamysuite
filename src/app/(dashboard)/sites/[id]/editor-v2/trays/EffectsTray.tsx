"use client";

import { useEditorStore } from "@/app/stores/editorStore";
import { EffectPresetPicker } from "../EffectPresetPicker";
import { EffectPicker } from "../EffectPicker";
import type { EventType, EffectPreset } from "@/lib/effects/types";

export function EffectsTray() {
  const settings = useEditorStore((s) => s.settings);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const eventType = useEditorStore((s) => s.eventType) as EventType | null;
  const mode = useEditorStore((s) => s.mode);

  const handleApplyPreset = (effects: EffectPreset["effects"], presetId: string) => {
    updateSettings({
      effectPreset: presetId,
      effectBg: effects.background ?? null,
      effectNav: effects.nav ?? null,
      effectNavStyle: effects.navStyle ?? null,
      effectText: effects.text ?? null,
      effectCard: effects.card ?? null,
      effectTransition: effects.transition ?? null,
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
      effectCard: null,
      effectTransition: null,
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
            activePresetId={settings.effectPreset}
            onApply={handleApplyPreset}
            onClear={handleClearPreset}
          />

          <div className="h-px bg-border" />

          {mode === "pro" && (
            <>
              <EffectPicker
                category="background"
                value={settings.effectBg}
                onChange={(id) =>
                  updateSettings({ effectBg: id, effectPreset: null })
                }
                label="Background"
              />

              <EffectPicker
                category="text"
                value={settings.effectText}
                onChange={(id) =>
                  updateSettings({ effectText: id, effectPreset: null })
                }
                label="Text Style"
              />

              <EffectPicker
                category="nav-style"
                value={settings.effectNavStyle}
                onChange={(id) =>
                  updateSettings({ effectNavStyle: id, effectPreset: null })
                }
                label="Nav Style"
              />

              <EffectPicker
                category="card"
                value={settings.effectCard}
                onChange={(id) =>
                  updateSettings({ effectCard: id, effectPreset: null })
                }
                label="Card Style"
              />

              <EffectPicker
                category="transition"
                value={settings.effectTransition}
                onChange={(id) =>
                  updateSettings({ effectTransition: id, effectPreset: null })
                }
                label="Transitions"
              />

              <EffectPicker
                category="decoration"
                value={settings.effectDecoration}
                onChange={(id) =>
                  updateSettings({ effectDecoration: id, effectPreset: null })
                }
                label="Decorations"
              />

              <EffectPicker
                category="cursor"
                value={settings.effectCursor}
                onChange={(id) =>
                  updateSettings({ effectCursor: id, effectPreset: null })
                }
                label="Cursor"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
