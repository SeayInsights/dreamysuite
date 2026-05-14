import type { StateCreator } from "zustand";
import type {
  MergedSettings,
  MergedSettingsPatch,
} from "@/lib/schemas/settings";
import { MERGED_DEFAULTS } from "@/lib/schemas/settings";
import { settingsToTheme } from "./theme";
import type { ThemeSlice } from "./theme";

const NUMBER_FIELDS = new Set([
  "isLive",
  "showNavBrand",
  "popupEnabled",
  "popupTicker",
  "popupAfterAnimation",
  "popupBundle",
  "pageBgDisabled",
  "bgImageBleed",
  "effectBleed",
  "bgImageOpacity",
  "bgImageZoom",
  "bgImagePositionX",
  "bgImagePositionY",
  "defaultAnimDuration",
  "defaultAnimDelay",
]);

function coerceDbRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === "number" && !NUMBER_FIELDS.has(k) ? String(v) : v;
  }
  return out;
}

export interface SettingsSlice {
  settings: MergedSettings;
  settingsLoaded: boolean;
  settingsDirty: boolean;
  settingsPendingPatch: MergedSettingsPatch;
  loadSettings: (siteId: string) => Promise<void>;
  updateSettings: (patch: MergedSettingsPatch) => void;
  saveSettings: (siteId: string) => Promise<void>;
  markSettingsClean: () => void;
}

function hasPatch(patch: MergedSettingsPatch): boolean {
  return Object.keys(patch).length > 0;
}

function remainingPendingPatch(
  pending: MergedSettingsPatch,
  sentPatch: MergedSettingsPatch,
): MergedSettingsPatch {
  const remaining = { ...pending };
  for (const rawKey of Object.keys(sentPatch)) {
    const key = rawKey as keyof MergedSettingsPatch;
    if (Object.is(remaining[key], sentPatch[key])) {
      delete remaining[key];
    }
  }
  return remaining;
}

export const createSettingsSlice: StateCreator<
  SettingsSlice & ThemeSlice,
  [],
  [],
  SettingsSlice
> = (set, get) => ({
  settings: { ...MERGED_DEFAULTS },
  settingsLoaded: false,
  settingsDirty: false,
  settingsPendingPatch: {},

  loadSettings: async (siteId) => {
    try {
      const res = await fetch(`/api/sites/${siteId}/settings`);
      if (!res.ok) {
        console.error("[settings:load] GET failed", res.status);
        return;
      }
      const { settings: raw } = (await res.json()) as {
        settings: Record<string, unknown>;
      };
      const settings = coerceDbRow(raw) as MergedSettings;
      const merged = { ...MERGED_DEFAULTS, ...settings };
      set({
        settings: merged,
        settingsLoaded: true,
        settingsDirty: false,
        settingsPendingPatch: {},
        themeTokens: settingsToTheme(merged),
      });
    } catch (e) {
      console.error("[settings:load] error:", e);
    }
  },

  updateSettings: (patch) => {
    const prev = get().settings;
    const next = { ...prev, ...patch };
    set((state) => ({
      settings: next,
      settingsDirty: true,
      settingsPendingPatch: { ...state.settingsPendingPatch, ...patch },
      themeTokens: settingsToTheme(next),
    }));
  },

  saveSettings: async (siteId) => {
    if (!get().settingsDirty) return;
    const sentPatch = { ...get().settingsPendingPatch };
    if (!hasPatch(sentPatch)) return;
    try {
      const res = await fetch(`/api/sites/${siteId}/settings`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sentPatch),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[settings:save] PUT failed", res.status, text);
        return;
      }
      const remaining = remainingPendingPatch(
        get().settingsPendingPatch,
        sentPatch,
      );
      set({
        settingsPendingPatch: remaining,
        settingsDirty: hasPatch(remaining),
      });
      if (hasPatch(remaining)) {
        await get().saveSettings(siteId);
      }
    } catch (e) {
      console.error("[settings:save] network error:", e);
    }
  },

  markSettingsClean: () =>
    set({ settingsDirty: false, settingsPendingPatch: {} }),
});
