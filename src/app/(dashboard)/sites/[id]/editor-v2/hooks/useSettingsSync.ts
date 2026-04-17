"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/app/stores/editorStore";

const DEBOUNCE_MS = 1_500;

export function useSettingsSync(siteId: string) {
  const loadSettings = useEditorStore((s) => s.loadSettings);
  const saveSettings = useEditorStore((s) => s.saveSettings);
  const settingsDirty = useEditorStore((s) => s.settingsDirty);
  const saveTranslations = useEditorStore((s) => s.saveTranslations);
  const translationsDirty = useEditorStore((s) => s.translationsDirty);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const siteIdRef = useRef(siteId);
  siteIdRef.current = siteId;

  const flushNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (transTimerRef.current) clearTimeout(transTimerRef.current);
    transTimerRef.current = null;
    const state = useEditorStore.getState();
    if (state.settingsDirty) {
      fetch(`/api/sites/${siteIdRef.current}/settings`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(state.settings),
        keepalive: true,
      });
    }
    if (state.translationsDirty.size > 0) {
      state.saveTranslations(siteIdRef.current);
    }
  }, []);

  useEffect(() => {
    loadSettings(siteId);
  }, [siteId, loadSettings]);

  useEffect(() => {
    if (!settingsDirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      saveSettings(siteId);
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [settingsDirty, siteId, saveSettings]);

  useEffect(() => {
    if (translationsDirty.size === 0) return;
    if (transTimerRef.current) clearTimeout(transTimerRef.current);
    transTimerRef.current = setTimeout(() => {
      transTimerRef.current = null;
      saveTranslations(siteId);
    }, DEBOUNCE_MS);
    return () => {
      if (transTimerRef.current) clearTimeout(transTimerRef.current);
    };
  }, [translationsDirty, siteId, saveTranslations]);

  useEffect(() => {
    window.addEventListener("beforeunload", flushNow);
    return () => {
      window.removeEventListener("beforeunload", flushNow);
      flushNow();
    };
  }, [flushNow]);
}
