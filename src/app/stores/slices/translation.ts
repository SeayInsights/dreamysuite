import type { StateCreator } from "zustand";

interface TranslationRow {
  blockId: string;
  lang: string;
  field: string;
  value: string;
}

export interface TranslationSlice {
  translations: Record<string, Record<string, Record<string, string>>>;
  translationsLoaded: boolean;
  translationsDirty: Set<string>;

  loadTranslations: (siteId: string) => Promise<void>;
  getTranslation: (blockId: string, lang: string, field: string) => string;
  setTranslation: (blockId: string, lang: string, field: string, value: string) => void;
  saveTranslations: (siteId: string) => Promise<void>;
  clearBlockTranslations: (blockId: string) => void;
}

export const createTranslationSlice: StateCreator<TranslationSlice, [], [], TranslationSlice> = (set, get) => ({
  translations: {},
  translationsLoaded: false,
  translationsDirty: new Set(),

  loadTranslations: async (siteId) => {
    try {
      const res = await fetch(`/api/sites/${siteId}/translations`);
      if (!res.ok) return;
      const { rows } = (await res.json()) as { rows: TranslationRow[] };
      const map: Record<string, Record<string, Record<string, string>>> = {};
      for (const r of rows) {
        if (!map[r.blockId]) map[r.blockId] = {};
        if (!map[r.blockId][r.lang]) map[r.blockId][r.lang] = {};
        map[r.blockId][r.lang][r.field] = r.value;
      }
      set({ translations: map, translationsLoaded: true, translationsDirty: new Set() });
    } catch {
      // keep empty state
    }
  },

  getTranslation: (blockId, lang, field) => {
    return get().translations[blockId]?.[lang]?.[field] ?? "";
  },

  setTranslation: (blockId, lang, field, value) => {
    const prev = get().translations;
    const blockMap = { ...(prev[blockId] ?? {}) };
    blockMap[lang] = { ...(blockMap[lang] ?? {}), [field]: value };
    const dirty = new Set(get().translationsDirty);
    dirty.add(`${blockId}:${lang}:${field}`);
    set({ translations: { ...prev, [blockId]: blockMap }, translationsDirty: dirty });
  },

  saveTranslations: async (siteId) => {
    const dirty = get().translationsDirty;
    if (dirty.size === 0) return;
    const translations = get().translations;
    const rows: TranslationRow[] = [];
    for (const key of dirty) {
      const [blockId, lang, field] = key.split(":");
      const value = translations[blockId]?.[lang]?.[field] ?? "";
      rows.push({ blockId, lang, field, value });
    }
    try {
      const res = await fetch(`/api/sites/${siteId}/translations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      if (res.ok) set({ translationsDirty: new Set() });
    } catch {
      console.error("[translations:save] network error");
    }
  },

  clearBlockTranslations: (blockId) => {
    const prev = get().translations;
    if (!prev[blockId]) return;
    const next = { ...prev };
    delete next[blockId];
    set({ translations: next });
  },
});
