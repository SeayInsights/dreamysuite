/**
 * Effect category - where the effect is applied
 * - background: Full-page backgrounds (particles, gradients)
 * - nav: Navigation animations and interactions
 * - nav-style: Navigation visual styles (colors, layouts)
 * - text: Text animations and effects
 * - card: Card/block animations
 * - transition: Page/section transitions
 * - cursor: Custom cursor effects
 * - decoration: Decorative elements (confetti, overlays)
 */
export type EffectCategory =
  | "background"
  | "nav"
  | "nav-style"
  | "text"
  | "card"
  | "transition"
  | "cursor"
  | "decoration";

/**
 * Visual mood/aesthetic of the effect
 * - romantic: Soft, warm, intimate
 * - elegant: Sophisticated, refined, luxurious
 * - modern: Clean, contemporary, minimal
 * - playful: Fun, energetic, whimsical
 * - dramatic: Bold, striking, theatrical
 * - whimsical: Dreamy, fantastical, imaginative
 */
export type Mood =
  | "romantic"
  | "elegant"
  | "modern"
  | "playful"
  | "dramatic"
  | "whimsical";

/**
 * Type of event the effect is suitable for
 * - wedding: Wedding ceremonies and receptions
 * - anniversary: Anniversary celebrations
 * - vow-renewal: Vow renewal ceremonies
 * - engagement: Engagement announcements
 * - elopement: Intimate elopement ceremonies
 * - celebration: General celebrations
 */
export type EventType =
  | "wedding"
  | "anniversary"
  | "vow-renewal"
  | "engagement"
  | "elopement"
  | "celebration";

/**
 * Effect source library
 * - reactbits: Effects from reactbits.dev
 * - 21st: Effects from 21st.dev (via @21st-ui/react)
 */
export type EffectSource = "reactbits" | "21st";

/**
 * Effect intensity level
 * - subtle: Minimal, background enhancement
 * - medium: Noticeable but not overwhelming
 * - dramatic: Bold, attention-grabbing
 */
export type EffectIntensity = "subtle" | "medium" | "dramatic";

/**
 * Effect registry entry - metadata for a single effect
 */
export interface EffectEntry {
  id: string;
  name: string;
  source: EffectSource;
  category: EffectCategory;
  mood: Mood[];
  eventTypes: EventType[] | "*";
  intensity: EffectIntensity;
  description: string;
  thumbnail?: string;
  props?: Record<string, unknown>;
  disabled?: boolean;
}

/**
 * Navigation item for nav-style effects
 */
export interface NavStyleItem {
  label: string;
  href: string;
  icon: string;
  onClick?: (e?: React.MouseEvent) => void;
  color: string;
  isActive?: boolean;
}

/**
 * Props for nav-style effects
 * Nav-style effects receive theme tokens and navigation items
 */
export interface NavStyleProps {
  items: NavStyleItem[];
  logo: string;
  logoAlt: string;
  accent: string;
  bg: string;
  textColor: string;
  brandColor: string;
  headingFont: string;
  bodyFont: string;
  brandName: string;
  compact?: boolean;
}

/**
 * Effect preset - a curated combination of effects for a specific mood/event
 */
export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  mood: Mood;
  eventTypes: EventType[] | "*";
  effects: {
    background?: string;
    nav?: string;
    navStyle?: string;
    text?: string;
    card?: string;
    transition?: string;
    cursor?: string;
    decoration?: string;
  };
  thumbnail?: string;
}
