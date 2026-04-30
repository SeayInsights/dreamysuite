import type { EffectEntry, EffectCategory, EventType } from "./types";
import { BACKGROUND_EFFECTS } from "./registry-backgrounds";
import { TEXT_EFFECTS } from "./registry-text";
import { CURSOR_EFFECTS } from "./registry-cursors";
import { DECORATION_EFFECTS } from "./registry-decorations";
import { NAV_EFFECTS } from "./registry-nav";

export const EFFECT_REGISTRY: EffectEntry[] = [
  ...BACKGROUND_EFFECTS,
  ...TEXT_EFFECTS,
  ...CURSOR_EFFECTS,
  ...DECORATION_EFFECTS,
  ...NAV_EFFECTS,
];

export function getEffectsByCategory(category: EffectCategory): EffectEntry[] {
  return EFFECT_REGISTRY.filter((e) => e.category === category && !e.disabled);
}

export function getRecommended(
  category: EffectCategory,
  eventType: EventType,
): EffectEntry[] {
  return EFFECT_REGISTRY.filter(
    (e) =>
      e.category === category &&
      !e.disabled &&
      (e.eventTypes === "*" || e.eventTypes.includes(eventType)),
  );
}

export function getEffectById(id: string): EffectEntry | undefined {
  return EFFECT_REGISTRY.find((e) => e.id === id);
}
