export type {
  EffectEntry,
  EffectPreset,
  EffectCategory,
  Mood,
  EventType,
  EffectSource,
  EffectIntensity,
} from "./types";

export {
  EFFECT_REGISTRY,
  getEffectsByCategory,
  getRecommended,
  getEffectById,
} from "./registry";

export {
  EFFECT_PRESETS,
  getPresetsForEventType,
} from "./presets";

export {
  getEffectComponent,
} from "./loader";

export {
  shouldEnableEffects,
  useEffectsEnabled,
} from "./performance";
