import type { EffectEntry } from "./types";

export const CURSOR_EFFECTS: EffectEntry[] = [
  {
    id: "crosshair",
    name: "Crosshair",
    source: "reactbits",
    category: "cursor",
    mood: ["modern"],
    eventTypes: ["celebration", "engagement"],
    intensity: "subtle",
    description: "Custom crosshair cursor replacement",
  },
  {
    id: "pixel-trail",
    name: "PixelTrail",
    source: "reactbits",
    category: "cursor",
    mood: ["playful", "modern"],
    eventTypes: ["celebration", "engagement"],
    intensity: "medium",
    description: "Pixelated trail follows cursor movement",
    disabled: true,
  },
  {
    id: "target-cursor",
    name: "TargetCursor",
    source: "reactbits",
    category: "cursor",
    mood: ["modern"],
    eventTypes: ["celebration"],
    intensity: "subtle",
    description: "Animated target reticle follows cursor",
  },
];
