import type { StateCreator } from "zustand";
import type { Settings, SettingsPatch } from "@/lib/schemas/settings";
import { DEFAULTS } from "@/lib/schemas/settings";
import { settingsToTheme } from "./theme";
import type { ThemeSlice } from "./theme";

const NUMBER_FIELDS = new Set([
  "isLive", "showNavBrand", "popupEnabled", "popupTicker",
  "popupAfterAnimation", "popupBundle", "pageBgDisabled", "bgImageBleed", "effectBleed",
  "bgImageOpacity", "defaultAnimDuration", "defaultAnimDelay",
]);

function coerceDbRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === "number" && !NUMBER_FIELDS.has(k) ? String(v) : v;
  }
  return out;
}

export interface SettingsSlice {
  settings: Settings;
  settingsLoaded: boolean;
  settingsDirty: boolean;
  loadSettings: (siteId: string) => Promise<void>;
  updateSettings: (patch: SettingsPatch) => void;
  saveSettings: (siteId: string) => Promise<void>;
  markSettingsClean: () => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice & ThemeSlice, [], [], SettingsSlice> = (set, get) => ({
  settings: { ...DEFAULTS },
  settingsLoaded: false,
  settingsDirty: false,

  loadSettings: async (siteId) => {
    try {
      const res = await fetch(`/api/sites/${siteId}/settings`);
      if (!res.ok) {
        console.error("[settings:load] GET failed", res.status);
        return;
      }
      const { settings: raw } = (await res.json()) as { settings: Record<string, unknown> };
      const settings = coerceDbRow(raw) as Settings;
      const merged = { ...DEFAULTS, ...settings };
      set({ settings: merged, settingsLoaded: true, settingsDirty: false, themeTokens: settingsToTheme(merged) });
    } catch (e) {
      console.error("[settings:load] error:", e);
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
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[settings:save] PUT failed", res.status, text);
        return;
      }
      set({ settingsDirty: false });
    } catch (e) {
      console.error("[settings:save] network error:", e);
    }
  },

  markSettingsClean: () => set({ settingsDirty: false }),
});
