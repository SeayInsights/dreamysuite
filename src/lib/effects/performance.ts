"use client";

import { useMemo } from "react";

interface EffectsEnabled {
  backgrounds: boolean;
  text: boolean;
  cards: boolean;
  transitions: boolean;
  animations: boolean;
  cursor: boolean;
  decorations: boolean;
}

export function shouldEnableEffects(): EffectsEnabled {
  if (typeof window === "undefined")
    return { backgrounds: false, text: false, cards: false, transitions: false, animations: false, cursor: false, decorations: false };

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reducedMotion)
    return { backgrounds: false, text: false, cards: false, transitions: false, animations: false, cursor: false, decorations: false };

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as any).deviceMemory ?? 4;
  const narrow = window.innerWidth < 768;
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
  return useMemo(() => shouldEnableEffects(), []);
}
