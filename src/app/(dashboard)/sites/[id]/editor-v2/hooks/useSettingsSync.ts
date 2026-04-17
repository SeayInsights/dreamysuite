"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/app/stores/editorStore";

const DEBOUNCE_MS = 1_500;

export function useSettingsSync(siteId: string) {
  const loadSettings = useEditorStore((s) => s.loadSettings);
  const saveSettings = useEditorStore((s) => s.saveSettings);
  const settingsDirty = useEditorStore((s) => s.settingsDirty);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(saveSettings);
  saveRef.current = saveSettings;

  useEffect(() => {
    loadSettings(siteId);
  }, [siteId, loadSettings]);

  useEffect(() => {
    if (!settingsDirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveRef.current(siteId);
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [settingsDirty, siteId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        saveRef.current(siteId);
      }
    };
  }, [siteId]);
}
