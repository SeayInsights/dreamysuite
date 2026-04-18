"use client";

import { useMemo, createElement, type ReactNode } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { getEffectComponent } from "@/lib/effects/loader";

interface Props {
  as: "h1" | "h2" | "h3";
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

const HEADING_LEVEL: Record<string, number> = { h1: 1, h2: 2, h3: 3 };

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return extractText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

export function TextEffectWrapper({ as: Tag, children, className, style, ...rest }: Props) {
  const effectText = useEditorStore((s) => s.settings.effectText);
  const c1 = useEditorStore((s) => s.settings.effectColor1);
  const c2 = useEditorStore((s) => s.settings.effectColor2);
  const c3 = useEditorStore((s) => s.settings.effectColor3);
  const headingColor = useEditorStore((s) => s.settings.headingColor);
  const accentColor = useEditorStore((s) => s.settings.accentColor);

  const TextEffect = useMemo(
    () => (effectText ? getEffectComponent(effectText) : null),
    [effectText],
  );

  const textContent = useMemo(() => extractText(children), [children]);

  const effectProps = useMemo(() => {
    const color1 = c1 ?? headingColor ?? accentColor ?? "#B8921A";
    const color2 = c2 ?? accentColor ?? "#B8921A";
    const color3 = c3 ?? accentColor ?? "#B8921A";
    return {
      children: textContent,
      text: textContent,
      sentence: textContent,
      marqueeText: textContent,
      label: textContent,
      texts: [textContent],
      color: color1,
      colors: [color1, color2, color3],
      textColor: color1,
      className: "",
    };
  }, [textContent, c1, c2, c3, headingColor, accentColor]);

  if (!TextEffect) {
    return createElement(Tag, { className, style, ...rest }, children);
  }

  return (
    <div
      role="heading"
      aria-level={HEADING_LEVEL[Tag]}
      className={className}
      style={style}
      {...rest}
      data-ds-effect={effectText}
    >
      <TextEffect {...effectProps} />
    </div>
  );
}
