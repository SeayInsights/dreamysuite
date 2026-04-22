import type React from "react";
import { BLOCK_COMPONENTS } from "@/app/components/blocks";
import type { BlockType } from "@/lib/schemas/blocks";

export type BlockCategory = "Simple" | "Pro";

export interface BlockRegistryEntry {
  component: React.ComponentType<{ block: { id: string; type: string; [key: string]: unknown } }>;
  displayName: string;
  icon: string;
  category: BlockCategory;
  defaultData: Record<string, unknown>;
  visible: boolean;
}

// Default centered width: 8 of 12 columns (66.67%), centered with equal margins.
const CENTERED_BLOCK = { blockWidth: 66.6667, blockMarginLeft: 16.6667 } as const;

export const BLOCK_REGISTRY: Record<string, BlockRegistryEntry> = {
  // ── Core ─────────────────────────────────────────────────────────────────
  "home-hero": {
    component: BLOCK_COMPONENTS["home-hero"],
    displayName: "Hero",
    icon: "Sparkles",
    category: "Simple",
    defaultData: { coupleNames: "Name & Name", dateText: "", locationText: "", ...CENTERED_BLOCK },
    visible: true,
  },
  "header": {
    component: BLOCK_COMPONENTS["header"],
    displayName: "Header",
    icon: "Heading",
    category: "Simple",
    defaultData: { title: "Section Title", titleAlign: "center", ...CENTERED_BLOCK },
    visible: true,
  },
  "multi-text": {
    component: BLOCK_COMPONENTS["multi-text"],
    displayName: "Text",
    icon: "AlignLeft",
    category: "Simple",
    defaultData: { mode: "text", heading: "", body: "", ...CENTERED_BLOCK },
    visible: true,
  },
  "countdown": {
    component: BLOCK_COMPONENTS["countdown"],
    displayName: "Countdown",
    icon: "Timer",
    category: "Simple",
    defaultData: { label: "Until the big day", ...CENTERED_BLOCK },
    visible: true,
  },
  "spacer": {
    component: BLOCK_COMPONENTS["spacer"],
    displayName: "Spacer",
    icon: "Minus",
    category: "Simple",
    defaultData: { height: "48px", ...CENTERED_BLOCK },
    visible: true,
  },
  "venue-map": {
    component: BLOCK_COMPONENTS["venue-map"],
    displayName: "Venue Map",
    icon: "MapPin",
    category: "Simple",
    defaultData: { heading: "Venue", hotels: [], ...CENTERED_BLOCK },
    visible: true,
  },
  // ── Legacy (existing DB records — hidden from block picker) ───────────────
  "couple": {
    component: BLOCK_COMPONENTS["couple"],
    displayName: "Couple",
    icon: "Heart",
    category: "Simple",
    defaultData: { coupleNames: "", dateText: "", locationText: "" },
    visible: false,
  },
  "video": {
    component: BLOCK_COMPONENTS["video"],
    displayName: "Video",
    icon: "Video",
    category: "Simple",
    defaultData: {},
    visible: false,
  },
  "images": {
    component: BLOCK_COMPONENTS["images"],
    displayName: "Images",
    icon: "Images",
    category: "Simple",
    defaultData: {},
    visible: false,
  },
  "photo-split": {
    component: BLOCK_COMPONENTS["photo-split"],
    displayName: "Photo Split",
    icon: "Columns",
    category: "Simple",
    defaultData: {},
    visible: false,
  },
  "registry-card": {
    component: BLOCK_COMPONENTS["registry-card"],
    displayName: "Registry Card",
    icon: "CreditCard",
    category: "Simple",
    defaultData: {},
    visible: false,
  },
  "hotel-card": {
    component: BLOCK_COMPONENTS["hotel-card"],
    displayName: "Hotel Card",
    icon: "Building",
    category: "Simple",
    defaultData: {},
    visible: false,
  },
  "youtube": {
    component: BLOCK_COMPONENTS["youtube"],
    displayName: "YouTube",
    icon: "Video",
    category: "Simple",
    defaultData: {},
    visible: false,
  },
  "rsvp": {
    component: BLOCK_COMPONENTS["rsvp"],
    displayName: "RSVP",
    icon: "ClipboardCheck",
    category: "Simple",
    defaultData: {},
    visible: false,
  },
  // ── Consolidated ─────────────────────────────────────────────────────────
  "media-video": {
    component: BLOCK_COMPONENTS["media-video"],
    displayName: "Video",
    icon: "Video",
    category: "Simple",
    defaultData: { provider: "youtube", url: "", ...CENTERED_BLOCK },
    visible: true,
  },
  "gallery": {
    component: BLOCK_COMPONENTS["gallery"],
    displayName: "Gallery",
    icon: "Images",
    category: "Simple",
    defaultData: { layout: "grid", urls: [], ...CENTERED_BLOCK },
    visible: true,
  },
  "info-card": {
    component: BLOCK_COMPONENTS["info-card"],
    displayName: "Info Card",
    icon: "CreditCard",
    category: "Simple",
    defaultData: { variant: "registry", name: "", url: "", ...CENTERED_BLOCK },
    visible: true,
  },
  // ── New blocks ────────────────────────────────────────────────────────────
  "rsvp-form": {
    component: BLOCK_COMPONENTS["rsvp-form"],
    displayName: "RSVP Form",
    icon: "ClipboardCheck",
    category: "Simple",
    defaultData: { heading: "RSVP", subheading: "We hope to see you there!", ...CENTERED_BLOCK },
    visible: true,
  },
  "story-timeline": {
    component: BLOCK_COMPONENTS["story-timeline"],
    displayName: "Story Timeline",
    icon: "BookOpen",
    category: "Simple",
    defaultData: { heading: "Our Story", events: [], ...CENTERED_BLOCK },
    visible: true,
  },
  "guest-book": {
    component: BLOCK_COMPONENTS["guest-book"],
    displayName: "Guest Book",
    icon: "BookHeart",
    category: "Pro",
    defaultData: { heading: "Guest Book", placeholder: "Leave a message for the happy couple…", ...CENTERED_BLOCK },
    visible: true,
  },
  "faq": {
    component: BLOCK_COMPONENTS["faq"],
    displayName: "FAQ",
    icon: "HelpCircle",
    category: "Simple",
    defaultData: { heading: "Frequently Asked Questions", displayMode: "faq", cardStyle: "bordered", items: [], ...CENTERED_BLOCK },
    visible: true,
  },
  "schedule": {
    component: BLOCK_COMPONENTS["schedule"],
    displayName: "Schedule",
    icon: "Clock",
    category: "Simple",
    defaultData: { heading: "The Day", events: [], ...CENTERED_BLOCK },
    visible: true,
  },
  "fun-facts": {
    component: BLOCK_COMPONENTS["fun-facts"],
    displayName: "Fun Facts",
    icon: "Lightbulb",
    category: "Simple",
    defaultData: { heading: "Fun Facts About Us", displayMode: "facts", columns: "auto", cardStyle: "card", items: [], ...CENTERED_BLOCK },
    visible: true,
  },
  "travel": {
    component: BLOCK_COMPONENTS["travel"],
    displayName: "Travel",
    icon: "MapPin",
    category: "Simple",
    defaultData: { heading: "Travel Guide", displayMode: "travel", cardStyle: "card", items: [], ...CENTERED_BLOCK },
    visible: true,
  },
  "content-card": {
    component: BLOCK_COMPONENTS["content-card"],
    displayName: "Content Card",
    icon: "LayoutGrid",
    category: "Simple",
    defaultData: { heading: "Content", displayMode: "general", columns: "auto", cardStyle: "card", items: [], ...CENTERED_BLOCK },
    visible: true,
  },
  "registry": {
    component: BLOCK_COMPONENTS["registry"],
    displayName: "Registry",
    icon: "Gift",
    category: "Simple",
    defaultData: {
      heading: "Registry",
      subheading: "Your presence is the greatest gift. But if you'd like to give something, we're registered at the following places.",
      displayMode: "grid",
      items: [],
      ...CENTERED_BLOCK,
    },
    visible: true,
  },
};

// Compile-time check: every BlockType must have a registry entry.
// Adding a key to BLOCK_TYPES without a corresponding entry here produces a TS error on the next line.
const _registryCheck: Record<BlockType, BlockRegistryEntry> = BLOCK_REGISTRY;
void _registryCheck;

export function getVisibleBlocks(category?: BlockCategory): [string, BlockRegistryEntry][] {
  return Object.entries(BLOCK_REGISTRY).filter(([, entry]) => {
    if (!entry.visible) return false;
    if (category && entry.category !== category) return false;
    return true;
  });
}
