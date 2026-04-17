"use client";

import { useMemo } from "react";

interface EffectsEnabled {
  backgrounds: boolean;
  animations: boolean;
  cursor: boolean;
}

export function shouldEnableEffects(): EffectsEnabled {
  if (typeof window === "undefined")
    return { backgrounds: false, animations: false, cursor: false };

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reducedMotion)
    return { backgrounds: false, animations: false, cursor: false };

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as any).deviceMemory ?? 4;
  const narrow = window.innerWidth < 768;
  const lowEnd = cores <= 2 || memory <= 2;

  return {
    backgrounds: !lowEnd,
    animations: !lowEnd || !narrow,
    cursor: !narrow,
  };
}

export function useEffectsEnabled(): EffectsEnabled {
  return useMemo(() => shouldEnableEffects(), []);
}
