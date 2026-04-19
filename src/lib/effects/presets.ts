import type { EffectPreset, EventType } from "./types";

export const EFFECT_PRESETS: EffectPreset[] = [
  // ── Wedding (3) ──
  {
    id: "romantic-silk",
    name: "Romantic Silk",
    description: "Flowing silk backdrop with gentle text reveals and glass cards",
    mood: "romantic",
    eventTypes: ["wedding", "vow-renewal"],
    effects: {
      background: "silk",
      text: "blur-text",
      cursor: "crosshair",
      decoration: "ribbons",
    },
  },
  {
    id: "ethereal-aurora",
    name: "Ethereal Aurora",
    description: "Soft aurora lights with floating text and spotlight cards",
    mood: "whimsical",
    eventTypes: ["wedding"],
    effects: {
      background: "soft-aurora",
      text: "scroll-reveal",
      cursor: "crosshair",
      decoration: "ribbons",
    },
  },
  {
    id: "classic-elegance",
    name: "Classic Elegance",
    description: "Delicate threads with split text and reflective surfaces",
    mood: "elegant",
    eventTypes: ["wedding", "anniversary"],
    effects: {
      background: "threads",
      text: "split-text",
      cursor: "crosshair",
      decoration: "ribbons",
    },
  },

  // ── Anniversary (2) ──
  {
    id: "golden-nostalgia",
    name: "Golden Nostalgia",
    description: "Warm grainy gradients with milestone counters and spotlights",
    mood: "romantic",
    eventTypes: ["anniversary"],
    effects: {
      background: "grainient",
      text: "count-up",
      cursor: "crosshair",
      decoration: "magic-rings",
    },
  },
  {
    id: "timeless-glow",
    name: "Timeless Glow",
    description: "Liquid ether backdrop with shiny text and circular gallery",
    mood: "elegant",
    eventTypes: ["anniversary", "vow-renewal"],
    effects: {
      background: "liquid-ether",
      text: "shiny-text",
      cursor: "crosshair",
      decoration: "magic-rings",
    },
  },

  // ── Vow Renewal (2) ──
  {
    id: "intimate-glow",
    name: "Intimate Glow",
    description: "Soft floating lines with gentle reveals and glass surfaces",
    mood: "romantic",
    eventTypes: ["vow-renewal", "wedding"],
    effects: {
      background: "floating-lines",
      text: "scroll-float",
      cursor: "crosshair",
      decoration: "ribbons",
    },
  },
  {
    id: "gentle-ceremony",
    name: "Gentle Ceremony",
    description: "Iridescent shimmer with gradient text and clean transitions",
    mood: "elegant",
    eventTypes: ["vow-renewal"],
    effects: {
      background: "iridescence",
      text: "gradient-text",
      cursor: "crosshair",
      decoration: "magic-rings",
    },
  },

  // ── Engagement (2) ──
  {
    id: "party-spark",
    name: "Party Spark",
    description: "Energetic particles with rotating text and bouncing cards",
    mood: "playful",
    eventTypes: ["engagement", "celebration"],
    effects: {
      background: "particles",
      text: "rotating-text",
      cursor: "pixel-trail",
      decoration: "ribbons",
    },
  },
  {
    id: "modern-edge",
    name: "Modern Edge",
    description: "Bold aurora lights with glitch text and tilted cards",
    mood: "modern",
    eventTypes: ["engagement"],
    effects: {
      background: "aurora",
      text: "decrypted-text",
      cursor: "pixel-trail",
      decoration: "electric-border",
    },
  },

  // ── Elopement (2) ──
  {
    id: "adventure-night",
    name: "Adventure Night",
    description: "Deep galaxy sky with typewriter text and organic cards",
    mood: "dramatic",
    eventTypes: ["elopement"],
    effects: {
      background: "galaxy",
      text: "text-type",
      cursor: "pixel-trail",
      decoration: "magic-rings",
    },
  },
  {
    id: "cinematic-drift",
    name: "Cinematic Drift",
    description: "Light pillars with blur reveals and glass surfaces",
    mood: "dramatic",
    eventTypes: ["elopement", "wedding"],
    effects: {
      background: "light-pillar",
      text: "blur-text",
      cursor: "crosshair",
      decoration: "ribbons",
    },
  },

  // ── Celebration (2) ──
  {
    id: "bold-celebration",
    name: "Bold Celebration",
    description: "Lightning strikes with glitch text and magic bento grids",
    mood: "dramatic",
    eventTypes: ["celebration"],
    effects: {
      background: "lightning",
      text: "glitch-text",
      cursor: "pixel-trail",
      decoration: "ribbons",
    },
  },
  {
    id: "neon-energy",
    name: "Neon Energy",
    description: "Liquid chrome backdrop with scrambled text and glow borders",
    mood: "modern",
    eventTypes: ["celebration", "engagement"],
    effects: {
      background: "liquid-chrome",
      text: "scrambled-text",
      cursor: "pixel-trail",
      decoration: "electric-border",
    },
  },

  // ── Universal (3) ──
  {
    id: "minimal-motion",
    name: "Minimal Motion",
    description: "Clean dot field with type animation and stacked cards",
    mood: "modern",
    eventTypes: "*",
    effects: {
      background: "dot-field",
      text: "text-type",
      cursor: "crosshair",
      decoration: "magic-rings",
    },
  },
  {
    id: "dreamy-wave",
    name: "Dreamy Wave",
    description: "Gentle waves with floating text and profile cards",
    mood: "romantic",
    eventTypes: "*",
    effects: {
      background: "waves",
      text: "scroll-float",
      cursor: "crosshair",
      decoration: "ribbons",
    },
  },
  {
    id: "glass-luxe",
    name: "Glass Luxe",
    description: "Ripple grid with gradient text and glowing cards",
    mood: "elegant",
    eventTypes: "*",
    effects: {
      background: "ripple-grid",
      text: "gradient-text",
      cursor: "crosshair",
      decoration: "magic-rings",
    },
  },
];

export function getPresetsForEventType(eventType: EventType): EffectPreset[] {
  return EFFECT_PRESETS.filter(
    (p) => p.eventTypes === "*" || p.eventTypes.includes(eventType),
  );
}
