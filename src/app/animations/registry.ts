/**
 * GSAP Animation Preset Registry
 *
 * Provides a lightweight registry that maps preset IDs to dynamic import loaders.
 * This keeps the main bundle small — only presets actually used on a page are
 * ever fetched by the browser.
 */

export interface AnimOpts {
  duration?: number;
  delay?: number;
  easing?: string;
  scrub?: boolean;
}

export type PresetFn = (el: Element, opts?: AnimOpts) => void;

const registry = new Map<string, () => Promise<PresetFn>>();

export function registerPreset(id: string, loader: () => Promise<PresetFn>): void {
  registry.set(id, loader);
}

export function getPreset(id: string): (() => Promise<PresetFn>) | undefined {
  return registry.get(id);
}
