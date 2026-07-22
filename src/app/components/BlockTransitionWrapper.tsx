"use client";

import { Suspense, useMemo, type ReactNode } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { getEffectComponent } from "@/lib/effects/loader";
import { useEffectsEnabled } from "@/lib/effects/performance";
import { EffectErrorBoundary } from "./EffectErrorBoundary";

const WRAPPER_TRANSITIONS = new Set(["animated-content", "fade-content"]);

interface Props {
  children: ReactNode;
}

export function BlockTransitionWrapper({ children }: Props) {
  const effectTransition = useEditorStore((s) => s.settings.effectTransition);
  const effectsEnabled = useEffectsEnabled();
  const isWrapper = WRAPPER_TRANSITIONS.has(effectTransition ?? "");

  const TransitionEffect = useMemo(
    () =>
      effectsEnabled.transitions && effectTransition && isWrapper
        ? getEffectComponent(effectTransition)
        : null,
    [effectsEnabled.transitions, effectTransition, isWrapper],
  );

  if (!TransitionEffect) return <>{children}</>;

  return (
    <EffectErrorBoundary fallback={<>{children}</>}>
      <Suspense fallback={<>{children}</>}>
        {/* eslint-disable-next-line react-hooks/static-components -- dynamic effect from the module-cached registry (effects/loader), stable per id, not recreated per render */}
        <TransitionEffect>{children}</TransitionEffect>
      </Suspense>
    </EffectErrorBoundary>
  );
}
