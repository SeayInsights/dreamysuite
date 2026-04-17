# Effect System — Spec

## Problem
DreamySuite has access to 130+ visual effects (ReactBits + 21st Magic) spanning backgrounds, text animations, glass surfaces, transitions, and UI components. Adding them all as flat options would overwhelm event planners. We need a curation layer that surfaces the right effects at the right time based on event type and editor context.

## Chosen Approach
**Registry table + context-based pickers + preset bundles**

- **Registry table** (`effect_registry`): static JSON catalog of every available effect with metadata
- **Context pickers**: each editor section (nav, background, text, cards, transitions) has its own effect browser showing 3-5 recommended + "browse all"
- **Preset bundles** (`effect_preset`): curated combos of effects that work together, tagged per event type — "one click to style everything"

## Data Model

### effect_registry (static JSON file, not DB)
```
src/lib/effects/registry.ts
```
Each entry:
```ts
interface EffectEntry {
  id: string;                    // "silk", "blur-text", "glass-surface"
  name: string;                  // "Silk"
  source: "reactbits" | "21st";  // where it comes from
  category: EffectCategory;      // where it can be used
  mood: Mood[];                  // what vibe it creates
  eventTypes: EventType[] | "*"; // which events it suits ("*" = all)
  intensity: "subtle" | "medium" | "dramatic";
  description: string;           // one-liner for tooltip
  thumbnail?: string;            // preview image path
  props?: Record<string, unknown>; // default config for this effect
}
```

Categories (maps to editor contexts):
```ts
type EffectCategory =
  | "background"    // full-page or section backgrounds
  | "nav"           // navigation bar effects
  | "text"          // text entrance/display animations
  | "card"          // card/block surface treatments
  | "transition"    // section entrance animations
  | "cursor"        // cursor effects
  | "decoration";   // sparkles, ribbons, borders
```

Moods:
```ts
type Mood =
  | "romantic"    // soft, warm, intimate
  | "elegant"     // refined, minimal, luxe
  | "modern"      // clean, bold, architectural
  | "playful"     // fun, bouncy, colorful
  | "dramatic"    // high-contrast, cinematic
  | "whimsical";  // dreamy, ethereal, magical
```

Event types:
```ts
type EventType =
  | "wedding"
  | "anniversary"
  | "vow-renewal"
  | "engagement"
  | "elopement"
  | "celebration";
```

### effect_preset (static JSON, bundled in registry)
```ts
interface EffectPreset {
  id: string;                // "romantic-silk", "modern-glass"
  name: string;              // "Romantic Silk"
  description: string;       // "Flowing silk backdrop with gentle text reveals"
  mood: Mood;
  eventTypes: EventType[] | "*";
  effects: {
    background?: string;     // effect id
    nav?: string;
    text?: string;
    card?: string;
    transition?: string;
    cursor?: string;
    decoration?: string;
  };
  thumbnail?: string;
}
```

### Event Type -> Mood Mapping
```
wedding:      romantic, elegant, whimsical
anniversary:  elegant, romantic, dramatic
vow-renewal:  romantic, elegant
engagement:   playful, modern, romantic
elopement:    dramatic, modern, whimsical
celebration:  playful, modern, dramatic
```

### Recommended Effects per Event Type + Context

#### wedding
| Context | Recommended | Why |
|---------|-------------|-----|
| background | Silk, SoftAurora, Threads, Iridescence | Fabric/ethereal = bridal |
| text | BlurText, SplitText, GradientText, ScrollReveal | Elegant reveals |
| nav | PillNav (glass), frosted bar | Premium but subtle |
| card | GlassSurface, SpotlightCard, TiltedCard | Luxe info display |
| transition | FadeContent, AnimatedContent | Smooth, not distracting |
| decoration | StarBorder, Ribbons, ClickSpark | Celebratory accents |

#### anniversary
| Context | Recommended | Why |
|---------|-------------|-----|
| background | Aurora, LiquidEther, Grainient | Rich, warm, nostalgic |
| text | ScrollReveal, CountUp, ShinyText | Timeline/milestone emphasis |
| nav | frosted bar, solid pill | Classic, refined |
| card | ReflectiveCard, SpotlightCard | Retrospective premium feel |
| transition | GradualBlur, FadeContent | Gentle, nostalgic |

#### engagement
| Context | Recommended | Why |
|---------|-------------|-----|
| background | Particles, Ballpit, Aurora, Galaxy | Fun, energetic, sparkly |
| text | RotatingText, FallingText, ShinyText | Playful, dynamic |
| nav | GooeyNav, PillNav, BubbleMenu | Fun shapes |
| card | BounceCards, TiltedCard, ProfileCard | Interactive, social |
| transition | AnimatedContent, PixelTransition | Snappy, modern |
| decoration | ClickSpark, Ribbons, StarBorder | Party vibes |

#### elopement
| Context | Recommended | Why |
|---------|-------------|-----|
| background | Galaxy, LightPillar, Beams, LineWaves | Adventure/nature feel |
| text | BlurText, DecryptedText, TextType | Mystery, intimacy |
| nav | floating (glass), minimal solid | Unobtrusive |
| card | GlassSurface, DecayCard | Organic, editorial |
| transition | GradualBlur, ShapeBlur | Cinematic |

#### vow-renewal
| Context | Recommended | Why |
|---------|-------------|-----|
| background | Silk, FloatingLines, SoftAurora | Gentle, refined |
| text | ScrollReveal, BlurText, GradientText | Ceremonial reveals |
| nav | frosted bar, solid bar | Traditional, clean |
| card | GlassSurface, SpotlightCard | Warm, familiar |
| transition | FadeContent, AnimatedContent | Graceful |

#### celebration (general)
| Context | Recommended | Why |
|---------|-------------|-----|
| background | Particles, Lightning, Beams, Ballpit | High energy |
| text | GlitchText, RotatingText, FallingText | Bold, attention-grabbing |
| nav | GooeyNav, Dock | Modern, punchy |
| card | MagicBento, BounceCards, PixelCard | Interactive, dynamic |
| transition | PixelTransition, AnimatedContent | Energetic |
| decoration | Ribbons, ClickSpark | Party |

## Editor UX

### Quick Path: Preset Picker (new "Effects" tray)
1. Open Effects tray in editor sidebar
2. See 4-6 recommended presets for your event type (thumbnail + name + mood badge)
3. Click one to apply all effects at once
4. "Browse all presets" shows full list grouped by mood

### Granular Path: Per-Context Effect Pickers
Each existing tray gets an "Effect" section:
- **NavigationTray**: already has Shape + Material; add animated nav component option
- **StyleTab** (inspector): add Background Effect picker (3 recommended + browse)
- **SectionToolbar**: add Text Animation + Card Surface pickers per block
- **New: Transitions section** in inspector for section entrance animations

### Progressive Disclosure Pattern
```
[Recommended]          <- 3-5 thumbnails, event-type-aware
[Browse all (42)]      <- expandable, grouped by mood
[None]                 <- always available, removes effect
```

Each effect thumbnail shows a 3-second looping preview on hover.

## Scope

### In scope
- effect_registry.ts with all 130+ components cataloged
- effect_presets.ts with 12-18 curated presets (2-3 per event type)
- EffectPicker component (reusable across all contexts)
- EffectPresetPicker component (for Effects tray)
- Integration into: NavigationTray, StyleTab, SectionToolbar
- Event-type-aware recommendations

### Out of scope (future)
- Actual ReactBits component installation (separate per-component task)
- Custom effect creation by users
- Per-page effect overrides
- Effect intensity sliders
- A/B testing different effect combos
- Mobile-specific effect variants

## Implementation Order
1. **Registry + presets** — write the data files first
2. **EffectPicker component** — reusable picker UI
3. **Effects tray** — preset browser in sidebar
4. **Wire into existing trays** — per-context pickers
5. **Install effects one category at a time** — backgrounds first (highest impact), then text, then cards/transitions

## Risk Flags
- **Bundle size**: ReactBits components should be dynamically imported to avoid bloating the editor bundle
- **Performance**: animated backgrounds can tank mobile performance — need an auto-disable for low-power devices
- **Preview fidelity**: showing live previews of 130 effects in the picker could be heavy — use video thumbnails or static previews instead
- **Consistency**: effects from different sources may have different APIs/prop patterns — need a wrapper layer

## Dependencies
- ReactBits package installed
- Dynamic import infrastructure for code-splitting effects
- Thumbnail/preview assets for each effect (can generate with screenshots)
