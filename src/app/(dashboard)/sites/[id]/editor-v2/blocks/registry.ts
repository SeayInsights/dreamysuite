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

export const BLOCK_REGISTRY: Record<string, BlockRegistryEntry> = {
  // ── Core ─────────────────────────────────────────────────────────────────
  "home-hero": {
    component: BLOCK_COMPONENTS["home-hero"],
    displayName: "Hero",
    icon: "Sparkles",
    category: "Simple",
    defaultData: { coupleNames: "Name & Name", dateText: "", locationText: "" },
    visible: true,
  },
  "header": {
    component: BLOCK_COMPONENTS["header"],
    displayName: "Header",
    icon: "Heading",
    category: "Simple",
    defaultData: { title: "Section Title", titleAlign: "center" },
    visible: true,
  },
  "multi-text": {
    component: BLOCK_COMPONENTS["multi-text"],
    displayName: "Text",
    icon: "AlignLeft",
    category: "Simple",
    defaultData: { mode: "text", heading: "", body: "" },
    visible: true,
  },
  "countdown": {
    component: BLOCK_COMPONENTS["countdown"],
    displayName: "Countdown",
    icon: "Timer",
    category: "Simple",
    defaultData: { label: "Until the big day" },
    visible: true,
  },
  "spacer": {
    component: BLOCK_COMPONENTS["spacer"],
    displayName: "Spacer",
    icon: "Minus",
    category: "Simple",
    defaultData: { height: "48px" },
    visible: true,
  },
  "venue-map": {
    component: BLOCK_COMPONENTS["venue-map"],
    displayName: "Venue Map",
    icon: "MapPin",
    category: "Simple",
    defaultData: { venueName: "", embedUrl: "", mapUrl: "" },
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
    defaultData: { provider: "youtube", url: "" },
    visible: true,
  },
  "gallery": {
    component: BLOCK_COMPONENTS["gallery"],
    displayName: "Gallery",
    icon: "Images",
    category: "Simple",
    defaultData: { layout: "grid", urls: [] },
    visible: true,
  },
  "info-card": {
    component: BLOCK_COMPONENTS["info-card"],
    displayName: "Info Card",
    icon: "CreditCard",
    category: "Simple",
    defaultData: { variant: "registry", name: "", url: "" },
    visible: true,
  },
  // ── New blocks ────────────────────────────────────────────────────────────
  "rsvp-form": {
    component: BLOCK_COMPONENTS["rsvp-form"],
    displayName: "RSVP Form",
    icon: "ClipboardCheck",
    category: "Simple",
    defaultData: { heading: "RSVP", subheading: "We hope to see you there!" },
    visible: true,
  },
  "story-timeline": {
    component: BLOCK_COMPONENTS["story-timeline"],
    displayName: "Story Timeline",
    icon: "BookOpen",
    category: "Simple",
    defaultData: { heading: "Our Story", events: [] },
    visible: true,
  },
  "guest-book": {
    component: BLOCK_COMPONENTS["guest-book"],
    displayName: "Guest Book",
    icon: "BookHeart",
    category: "Pro",
    defaultData: { heading: "Guest Book", placeholder: "Leave a message for the happy couple…" },
    visible: true,
  },
  "faq": {
    component: BLOCK_COMPONENTS["faq"],
    displayName: "FAQ",
    icon: "HelpCircle",
    category: "Simple",
    defaultData: { heading: "Questions & Answers", displayMode: "accordion", items: [] },
    visible: true,
  },
  "schedule": {
    component: BLOCK_COMPONENTS["schedule"],
    displayName: "Schedule",
    icon: "Clock",
    category: "Simple",
    defaultData: { heading: "The Day", events: [] },
    visible: true,
  },
  "fun-facts": {
    component: BLOCK_COMPONENTS["fun-facts"],
    displayName: "Fun Facts",
    icon: "Lightbulb",
    category: "Simple",
    defaultData: { heading: "Fun Facts", columns: "auto", cardStyle: "card", items: [] },
    visible: true,
  },
  "travel": {
    component: BLOCK_COMPONENTS["travel"],
    displayName: "Travel",
    icon: "MapPin",
    category: "Simple",
    defaultData: { heading: "Getting There", items: [] },
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
