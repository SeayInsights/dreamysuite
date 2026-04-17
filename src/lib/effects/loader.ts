import { lazy, Suspense, createElement, type ComponentType } from "react";
import { getEffectById } from "./registry";
import type { EffectCategory } from "./types";

const CATEGORY_DIR: Record<EffectCategory, string> = {
  background: "backgrounds",
  text: "text",
  transition: "transitions",
  cursor: "cursors",
  decoration: "decorations",
  card: "cards",
  nav: "nav",
};

const componentCache = new Map<string, ComponentType<any>>();

export async function loadEffect(
  id: string,
): Promise<ComponentType<any> | null> {
  const cached = componentCache.get(id);
  if (cached) return cached;

  const entry = getEffectById(id);
  if (!entry) return null;

  const dir = CATEGORY_DIR[entry.category];
  try {
    const mod = await import(
      /* webpackInclude: /\.tsx$/ */
      `@/lib/effects/components/${dir}/${entry.name}`
    );
    const component = mod.default;
    componentCache.set(id, component);
    return component;
  } catch {
    return null;
  }
}

export function getEffectComponent(id: string): ComponentType<any> | null {
  const entry = getEffectById(id);
  if (!entry) return null;

  const dir = CATEGORY_DIR[entry.category];
  const LazyComponent = lazy(
    () =>
      import(
        /* webpackInclude: /\.tsx$/ */
        `@/lib/effects/components/${dir}/${entry.name}`
      ),
  );

  const Wrapper = (props: any) =>
    createElement(
      Suspense,
      { fallback: null },
      createElement(LazyComponent, props),
    );
  Wrapper.displayName = `Effect(${id})`;

  return Wrapper;
}

export function isEffectAvailable(id: string): boolean {
  return !!getEffectById(id);
}
