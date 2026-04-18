"use client";

import { useMemo, type ReactNode } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { getEffectComponent } from "@/lib/effects/loader";
import { useEffectsEnabled } from "@/lib/effects/performance";

interface Props {
  children: ReactNode;
  className?: string;
}

export function CardEffectWrapper({ children, className }: Props) {
  const effectCard = useEditorStore((s) => s.settings.effectCard);
  const effectsEnabled = useEffectsEnabled();

  const CardEffect = useMemo(
    () => (effectsEnabled.cards && effectCard ? getEffectComponent(effectCard) : null),
    [effectsEnabled.cards, effectCard],
  );

  if (!CardEffect) return <>{children}</>;

  return (
    <CardEffect className={className}>
      {children}
    </CardEffect>
  );
}
