"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/app/stores/editorStore";

const DEBOUNCE_MS = 1_500;

export function useSettingsSync(siteId: string) {
  const loadSettings = useEditorStore((s) => s.loadSettings);
  const saveSettings = useEditorStore((s) => s.saveSettings);
  const settingsDirty = useEditorStore((s) => s.settingsDirty);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const siteIdRef = useRef(siteId);
  siteIdRef.current = siteId;

  const flushNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const state = useEditorStore.getState();
    if (!state.settingsDirty) return;
    fetch(`/api/sites/${siteIdRef.current}/settings`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state.settings),
      keepalive: true,
    });
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
    window.addEventListener("beforeunload", flushNow);
    return () => {
      window.removeEventListener("beforeunload", flushNow);
      flushNow();
    };
  }, [flushNow]);
}
