import { lazy, Suspense, createElement, type ComponentType } from "react";
import { getEffectById } from "./registry";
import type { EffectCategory } from "./types";

type Importer = (name: string) => Promise<{ default: ComponentType<any> }>;

const categoryImporter: Record<EffectCategory, Importer> = {
  background: (n) => import(`@/lib/effects/components/backgrounds/${n}`),
  text: (n) => import(`@/lib/effects/components/text/${n}`),
  transition: (n) => import(`@/lib/effects/components/transitions/${n}`),
  cursor: (n) => import(`@/lib/effects/components/cursors/${n}`),
  decoration: (n) => import(`@/lib/effects/components/decorations/${n}`),
  card: (n) => import(`@/lib/effects/components/cards/${n}`),
  nav: (n) => import(`@/lib/effects/components/nav/${n}`),
  "nav-style": (n) => import(`@/lib/effects/components/nav/${n}`),
};

const componentCache = new Map<string, ComponentType<any>>();

export function getEffectComponent(id: string): ComponentType<any> | null {
  const cached = componentCache.get(id);
  if (cached) return cached;

  const entry = getEffectById(id);
  if (!entry) return null;

  const importer = categoryImporter[entry.category];
  const LazyComponent = lazy(
    () => importer(entry.name).catch((err) => {
      console.warn(`[effects] Failed to load ${id}:`, err);
      return { default: () => null } as { default: ComponentType<any> };
    }),
  );

  const Wrapper = (props: any) =>
    createElement(
      Suspense,
      { fallback: null },
      createElement(LazyComponent, props),
    );
  Wrapper.displayName = `Effect(${id})`;

  componentCache.set(id, Wrapper);
  return Wrapper;
}
