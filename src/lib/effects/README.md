# Effects System

Comprehensive visual effects library for DreamySuite wedding sites.

---

## Overview

The effects system provides 100+ visual effect components organized by category, with a registry for discovery, presets for common combinations, and performance gating for smooth experiences across devices.

### Architecture

```
src/lib/effects/
├── components/          # 100+ React effect components
│   ├── backgrounds/    # 30+ background effects (Aurora, Galaxy, Particles, etc.)
│   ├── cards/          # 15+ card layout effects (AnimatedList, BorderGlow, etc.)
│   ├── text/           # 6 text effects (GlitchText, GradientText, etc.)
│   ├── transitions/    # 5 page transitions (GradualBlur, PixelTransition, etc.)
│   ├── nav/            # Navigation effects (GlassMorph, MagneticHover, etc.)
│   ├── decorations/    # Decorative elements (StarBorder, LaserFlow, etc.)
│   └── cursors/        # Custom cursor effects (GhostCursor, PixelTrail, etc.)
├── registry.ts         # Effect catalog with metadata
├── presets.ts          # Pre-configured effect combinations
├── loader.ts           # Dynamic effect loader
├── performance.ts      # Performance gating (disable on low-end devices)
├── types.ts            # TypeScript definitions
└── index.ts            # Barrel export
```

---

## Quick Start

### Using Registry

```typescript
import { EFFECT_REGISTRY, getEffectById } from "@/lib/effects";

// Get effect metadata
const effect = getEffectById("aurora");
// {
//   id: "aurora",
//   name: "Aurora",
//   category: "backgrounds",
//   intensity: "medium",
//   tags: ["ambient", "gradient", "modern"],
//   ...
// }
```

### Using Presets

```typescript
import { EFFECT_PRESETS, getPresetsForEventType } from "@/lib/effects";

// Get recommended presets for event type
const presets = getPresetsForEventType("wedding");
// [
//   { name: "Romantic Aurora", effects: [...], mood: "romantic" },
//   { name: "Elegant Minimal", effects: [...], mood: "elegant" },
//   ...
// ]
```

### Loading Effect Components

```typescript
import { getEffectComponent } from "@/lib/effects";

// Dynamically import effect component
const AuroraEffect = await getEffectComponent("aurora");

// Render
<AuroraEffect intensity={0.7} />
```

---

## Effect Categories

### Backgrounds (30+)

Fullscreen or section background effects.

**Popular:**
- **Aurora** - Colorful gradient waves
- **Galaxy** - Animated star field
- **Particles** - Floating particle system
- **Grainient** - Grainy gradient background
- **Plasma** - Plasma wave animation

**Use cases:**
- Hero sections
- Page backgrounds
- Section dividers

### Cards (15+)

Card layout and interaction effects.

**Popular:**
- **AnimatedList** - List with stagger animations
- **BorderGlow** - Glowing border on hover
- **GlassSurface** - Glassmorphism effect
- **SpotlightCard** - Spotlight follows cursor
- **DomeGallery** - 3D dome gallery layout

**Use cases:**
- Photo galleries
- Content cards
- Registry items

### Text (6)

Text transformation effects.

**Popular:**
- **GlitchText** - Glitch animation on hover
- **GradientText** - Animated gradient text
- **FuzzyText** - Fuzzy/blurred text reveal
- **TextPressure** - Pressure-sensitive text

**Use cases:**
- Headings
- Call-to-action text
- Decorative typography

### Transitions (5)

Page/section transition effects.

**Popular:**
- **GradualBlur** - Gradual blur transition
- **PixelTransition** - Pixelated transition
- **StickerPeel** - Peel-off sticker effect
- **AnimatedContent** - Content fade/slide

**Use cases:**
- Page transitions
- Section reveals
- Modal animations

### Decorations (10+)

Decorative UI elements.

**Popular:**
- **StarBorder** - Animated star border
- **LaserFlow** - Laser line animation
- **MagicRings** - Expanding ring effect
- **Counter** - Animated number counter

**Use cases:**
- Countdown blocks
- Decorative accents
- Interactive elements

### Cursors (3)

Custom cursor effects.

**Popular:**
- **GhostCursor** - Ghost trail cursor
- **PixelTrail** - Pixelated cursor trail
- **SplashCursor** - Splash effect on click

**Use cases:**
- Interactive sections
- Unique UX touches

---

## Using Effects

### 1. Find an Effect

**By Category:**
```typescript
import { getEffectsByCategory } from "@/lib/effects";

const backgrounds = getEffectsByCategory("backgrounds");
```

**By ID:**
```typescript
import { getEffectById } from "@/lib/effects";

const aurora = getEffectById("aurora");
```

**By Tag:**
```typescript
import { EFFECT_REGISTRY } from "@/lib/effects";

const romanticEffects = EFFECT_REGISTRY.filter(e =>
  e.tags.includes("romantic")
);
```

### 2. Load the Component

```typescript
import { getEffectComponent } from "@/lib/effects";

const EffectComponent = await getEffectComponent("aurora");
```

### 3. Render with Props

```typescript
<EffectComponent
  intensity={0.7}         // 0-1 intensity (optional)
  color="#ff6b6b"         // Custom color (optional)
  speed={1.0}             // Animation speed multiplier (optional)
  // ... effect-specific props
/>
```

---

## Performance

### Automatic Gating

Effects are automatically disabled on low-end devices:

```typescript
import { shouldEnableEffects } from "@/lib/effects";

if (shouldEnableEffects()) {
  // Render effect
} else {
  // Render fallback (static content)
}
```

### Performance Check Criteria

Effects are disabled if:
- `prefers-reduced-motion` is enabled
- Device has < 4 CPU cores
- Device is low-end mobile
- Network connection is slow (save-data header)

### Manual Override

```typescript
import { useEffectsEnabled } from "@/lib/effects";

function MyComponent() {
  const effectsEnabled = useEffectsEnabled();

  return effectsEnabled ? <EffectComponent /> : <StaticFallback />;
}
```

---

## Adding New Effects

### 1. Create Effect Component

```typescript
// src/lib/effects/components/<category>/<EffectName>.tsx

"use client";

import { useEffect, useRef } from "react";

interface EffectNameProps {
  intensity?: number;
  color?: string;
  speed?: number;
}

export function EffectName({ intensity = 0.5, color = "#ffffff", speed = 1.0 }: EffectNameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Effect implementation
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Animation loop
    let animationId: number;
    function animate() {
      // Render effect
      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => cancelAnimationFrame(animationId);
  }, [intensity, color, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
}
```

### 2. Register in Registry

```typescript
// src/lib/effects/registry.ts

export const EFFECT_REGISTRY: EffectEntry[] = [
  // ... existing effects
  {
    id: "effect-name",
    name: "Effect Name",
    category: "backgrounds",
    description: "Brief description of the effect",
    tags: ["tag1", "tag2"],
    intensity: "medium",
    source: "original",
    component: "backgrounds/EffectName",
  },
];
```

### 3. (Optional) Add to Presets

```typescript
// src/lib/effects/presets.ts

export const EFFECT_PRESETS: EffectPreset[] = [
  // ... existing presets
  {
    name: "Custom Preset",
    mood: "playful",
    eventType: "birthday",
    effects: [
      { id: "effect-name", intensity: 0.7 },
      // ... other effects
    ],
  },
];
```

### 4. Build Public Version

```bash
npm run build:effects
# Compiles effect to Preact runtime for public sites
```

---

## Effect Props (Common)

Most effects support these common props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `intensity` | `number` | `0.5` | Effect strength (0-1) |
| `color` | `string` | varies | Primary color (hex/rgb) |
| `speed` | `number` | `1.0` | Animation speed multiplier |
| `className` | `string` | `""` | Additional CSS classes |
| `style` | `CSSProperties` | `{}` | Inline styles |

Check each effect's component file for effect-specific props.

---

## Best Practices

### 1. Performance First
- Always check `shouldEnableEffects()` before rendering
- Use lazy loading via `getEffectComponent()`
- Limit simultaneous effects (2-3 max per page)

### 2. Accessibility
- Provide static fallbacks for low-end devices
- Respect `prefers-reduced-motion`
- Don't rely on effects for critical content

### 3. Visual Hierarchy
- Use high-intensity effects (0.7-1.0) sparingly
- Background effects should be subtle (0.3-0.5)
- Combine effects thoughtfully (don't overwhelm)

### 4. Testing
- Test on mobile devices
- Test with reduced motion enabled
- Test network throttling (slow 3G)
- Verify canvas cleanup (no memory leaks)

---

## Animation Systems Overview

DreamySuite uses THREE animation systems:

| System | Purpose | Bundle Size | Usage |
|--------|---------|-------------|-------|
| **Effects** (this) | Guest visual effects | Lazy-loaded | Complex canvas effects |
| **Motion One** | Editor UI transitions | ~5KB | Editor chrome animations |
| **GSAP** | Scroll reveals | ~30KB | Automatic scroll animations |

### Decision Tree

- **Complex visual effect?** → Use Effects System (this)
- **Editor UI transition?** → Use Motion One (`@/lib/motion`)
- **Scroll-based reveal?** → Use GSAP (auto-configured)
- **Inline CSS transition?** → Use `@/lib/transitions` constants

---

## File Structure

```
effects/
├── components/
│   ├── backgrounds/
│   │   ├── Aurora.tsx           # Individual effect component
│   │   ├── Galaxy.tsx
│   │   └── ...
│   ├── cards/
│   ├── text/
│   ├── transitions/
│   ├── nav/
│   ├── decorations/
│   └── cursors/
├── registry.ts                  # Effect metadata catalog
├── presets.ts                   # Pre-configured combinations
├── loader.ts                    # Dynamic component loader
├── performance.ts               # Performance gating
├── types.ts                     # TypeScript definitions
├── index.ts                     # Barrel export
└── README.md                    # This file
```

---

## Resources

- **Registry:** Browse all effects in `registry.ts`
- **Presets:** See curated combinations in `presets.ts`
- **Examples:** Check `src/app/components/blocks/` for usage
- **Performance:** See `performance.ts` for gating logic

---

**Last Updated:** 2026-04-27  
**Maintained by:** DreamySuite Team  
**Effect Count:** 100+
