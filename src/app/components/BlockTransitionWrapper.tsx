"use client";

import { useMemo, type ReactNode } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { getEffectComponent } from "@/lib/effects/loader";
import { useEffectsEnabled } from "@/lib/effects/performance";

interface Props {
  children: ReactNode;
}

export function BlockTransitionWrapper({ children }: Props) {
  const effectTransition = useEditorStore((s) => s.settings.effectTransition);
  const effectsEnabled = useEffectsEnabled();

  const TransitionEffect = useMemo(
    () => (effectsEnabled.transitions && effectTransition ? getEffectComponent(effectTransition) : null),
    [effectsEnabled.transitions, effectTransition],
  );

  if (!TransitionEffect) return <>{children}</>;

  return <TransitionEffect>{children}</TransitionEffect>;
}
