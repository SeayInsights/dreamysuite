/* eslint-disable react-hooks/static-components */
"use client";

import { Suspense, useMemo, type ReactNode } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { getEffectComponent } from "@/lib/effects/loader";
import { useEffectsEnabled } from "@/lib/effects/performance";
import { EffectErrorBoundary } from "./EffectErrorBoundary";

interface Props {
  children: ReactNode;
  className?: string;
}

export function CardEffectWrapper({ children, className }: Props) {
  const effectCard = useEditorStore((s) => s.settings.effectCard);
  const c1 = useEditorStore((s) => s.settings.effectColor1);
  const accentColor = useEditorStore((s) => s.settings.accentColor);
  const effectsEnabled = useEffectsEnabled();

  const CardEffect = useMemo(
    () => (effectsEnabled.cards && effectCard ? getEffectComponent(effectCard) : null),
    [effectsEnabled.cards, effectCard],
  );

  if (!CardEffect) return <>{children}</>;

  const color = c1 ?? accentColor ?? "#B8921A";

  return (
    <div style={{ position: "relative" }} className={className}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          borderRadius: "inherit",
        }}
      >
        <EffectErrorBoundary>
          <Suspense fallback={null}>
            <CardEffect color={color} />
          </Suspense>
        </EffectErrorBoundary>
      </div>
      {children}
    </div>
  );
}
