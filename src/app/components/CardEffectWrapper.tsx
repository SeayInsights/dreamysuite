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
      {children}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          borderRadius: "inherit",
        }}
      >
        <CardEffect color={color} />
      </div>
    </div>
  );
}
