import type { StateCreator } from "zustand";
import type { Settings, SettingsPatch } from "@/lib/schemas/settings";
import { DEFAULTS } from "@/lib/schemas/settings";
import { settingsToTheme, type EditorShellSlice } from "./editorShell";

export interface SettingsSlice {
  settings: Settings;
  settingsLoaded: boolean;
  settingsDirty: boolean;
  loadSettings: (siteId: string) => Promise<void>;
  updateSettings: (patch: SettingsPatch) => void;
  saveSettings: (siteId: string) => Promise<void>;
  markSettingsClean: () => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice & EditorShellSlice, [], [], SettingsSlice> = (set, get) => ({
  settings: { ...DEFAULTS },
  settingsLoaded: false,
  settingsDirty: false,

  loadSettings: async (siteId) => {
    try {
      const res = await fetch(`/api/sites/${siteId}/settings`);
      if (!res.ok) return;
      const { settings } = (await res.json()) as { settings: Settings };
      const merged = { ...DEFAULTS, ...settings };
      set({ settings: merged, settingsLoaded: true, settingsDirty: false, themeTokens: settingsToTheme(merged) });
    } catch {
      // Silently fail — editor still works with defaults
    }
  },

  updateSettings: (patch) => {
    const prev = get().settings;
    set({ settings: { ...prev, ...patch }, settingsDirty: true });
  },

  saveSettings: async (siteId) => {
    if (!get().settingsDirty) return;
    const settings = get().settings;
    try {
      const res = await fetch(`/api/sites/${siteId}/settings`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) return;
      set({ settingsDirty: false });
    } catch (e) {
      console.error("[settings:save] network error:", e);
    }
  },

  markSettingsClean: () => set({ settingsDirty: false }),
});
