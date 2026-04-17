import type { StateCreator } from "zustand";
import type { Settings, SettingsPatch } from "@/lib/schemas/settings";
import { DEFAULTS } from "@/lib/schemas/settings";

export interface SettingsSlice {
  settings: Settings;
  settingsLoaded: boolean;
  settingsDirty: boolean;
  loadSettings: (siteId: string) => Promise<void>;
  updateSettings: (patch: SettingsPatch) => void;
  saveSettings: (siteId: string) => Promise<void>;
  markSettingsClean: () => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set, get) => ({
  settings: { ...DEFAULTS },
  settingsLoaded: false,
  settingsDirty: false,

  loadSettings: async (siteId) => {
    try {
      const res = await fetch(`/api/sites/${siteId}/settings`);
      if (!res.ok) return;
      const { settings } = (await res.json()) as { settings: Settings };
      set({ settings: { ...DEFAULTS, ...settings }, settingsLoaded: true, settingsDirty: false });
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
      await fetch(`/api/sites/${siteId}/settings`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      set({ settingsDirty: false });
    } catch {
      // Save failed — stays dirty, will retry on next debounce
    }
  },

  markSettingsClean: () => set({ settingsDirty: false }),
});
