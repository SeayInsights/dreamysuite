export type EffectCategory =
  | "background"
  | "nav"
  | "nav-style"
  | "text"
  | "card"
  | "transition"
  | "cursor"
  | "decoration";

export type Mood =
  | "romantic"
  | "elegant"
  | "modern"
  | "playful"
  | "dramatic"
  | "whimsical";

export type EventType =
  | "wedding"
  | "anniversary"
  | "vow-renewal"
  | "engagement"
  | "elopement"
  | "celebration";

export type EffectSource = "reactbits" | "21st";

export type EffectIntensity = "subtle" | "medium" | "dramatic";

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
}

export interface NavStyleItem {
  label: string;
  href: string;
  icon: string;
  onClick?: (e?: React.MouseEvent) => void;
  color: string;
  isActive?: boolean;
}

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
}

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
