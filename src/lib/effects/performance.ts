"use client";

import { useMemo, useSyncExternalStore } from "react";

interface EffectsEnabled {
  backgrounds: boolean;
  text: boolean;
  cards: boolean;
  transitions: boolean;
  animations: boolean;
  cursor: boolean;
  decorations: boolean;
}

function getWidth(): number {
  return typeof window === "undefined" ? 1280 : window.innerWidth;
}

let listeners: Array<() => void> = [];
if (typeof window !== "undefined") {
  window.addEventListener("resize", () => {
    for (const fn of listeners) fn();
  });
}
function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => { listeners = listeners.filter((fn) => fn !== cb); };
}

export function shouldEnableEffects(width = getWidth()): EffectsEnabled {
  if (typeof window === "undefined")
    return { backgrounds: false, text: false, cards: false, transitions: false, animations: false, cursor: false, decorations: false };

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reducedMotion)
    return { backgrounds: false, text: false, cards: false, transitions: false, animations: false, cursor: false, decorations: false };

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as any).deviceMemory ?? 4;
  const narrow = width < 768;
  const lowEnd = cores <= 2 || memory <= 2;

  return {
    backgrounds: !lowEnd,
    text: true,
    cards: true,
    transitions: !lowEnd || !narrow,
    animations: !lowEnd || !narrow,
    cursor: !narrow,
    decorations: !lowEnd,
  };
}

export function useEffectsEnabled(): EffectsEnabled {
  const width = useSyncExternalStore(subscribe, getWidth, () => 1280);
  return useMemo(() => shouldEnableEffects(width), [width]);
}
