/* eslint-disable react-hooks/static-components */
"use client";

import {
  Suspense,
  useMemo,
  useRef,
  useState,
  useEffect,
  createElement,
  type ReactNode,
} from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { getEffectComponent } from "@/lib/effects/loader";
import { EffectErrorBoundary } from "./EffectErrorBoundary";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [layoutReady, setLayoutReady] = useState(false);

  useEffect(() => {
    if (!TextEffect) return;
    const el = containerRef.current;
    if (!el) return;

    setLayoutReady(false);

    const check = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setLayoutReady(true);
        return true;
      }
      return false;
    };

    if (check()) return;

    const ro = new ResizeObserver(() => {
      if (check()) ro.disconnect();
    });
    ro.observe(el);

    document.fonts?.ready?.then(() => check());

    return () => ro.disconnect();
  }, [TextEffect, effectText]);

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
      ref={containerRef}
      role="heading"
      aria-level={HEADING_LEVEL[Tag]}
      className={className}
      style={{ minHeight: "1em", ...style }}
      {...rest}
      data-ds-effect={effectText}
    >
      {layoutReady ? (
        <EffectErrorBoundary fallback={<span>{children}</span>}>
          <Suspense fallback={<span>{children}</span>}>
            <TextEffect key={effectText} {...effectProps} />
          </Suspense>
        </EffectErrorBoundary>
      ) : (
        <span>{children}</span>
      )}
    </div>
  );
}
