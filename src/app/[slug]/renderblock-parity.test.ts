import { describe, it, expect } from "vitest";
import { renderBlock } from "./renderers";
import type { ParsedBlock, SiteSettingRow } from "./types";

/**
 * Behavior lock for the renderBlock registry refactor. renderBlock is a pure
 * (parsed inputs -> HTML string) function, so we snapshot its output for every
 * block type BEFORE the refactor and assert byte-identical output after. Any
 * change to the produced HTML fails the snapshot.
 */

const TYPES = [
  "home-hero",
  "couple",
  "header",
  "text",
  "countdown",
  "schedule",
  "faq",
  "rsvp",
  "images",
  "video",
  "youtube",
  "registry-card",
  "hotel-card",
  "venue-map",
  "tidbits",
  "fun-facts",
  "travel-section",
  "travel",
  "spacer",
  "photo-split",
  "multi-text",
  "media-video",
  "gallery",
  "info-card",
  "rsvp-form",
  "story-timeline",
  "guest-book",
  "__unknown_type__",
];

// Minimal per-type config to exercise the list/collection branches safely.
const CONFIG: Record<string, Record<string, unknown>> = {
  images: { images: [], layout: "grid-2" },
  gallery: { images: [] },
  "multi-text": { items: [] },
  schedule: { events: [] },
  faq: { items: [] },
  tidbits: { items: [] },
  "fun-facts": { facts: [] },
  "travel-section": { items: [] },
  "story-timeline": { items: [] },
};

const settings = {
  siteId: "s1",
  accentColor: "#B8921A",
  eventName: "Jane & John",
  eventDate: "June 2026",
  eventLocation: "Napa, CA",
  isLive: 1,
} as unknown as SiteSettingRow;

function makeBlock(type: string): ParsedBlock {
  return {
    id: `blk-${type}`,
    siteId: "s1",
    pageId: "p1",
    type,
    config: CONFIG[type] ?? {},
    sortOrder: 0,
    isVisible: 1,
  } as unknown as ParsedBlock;
}

describe("renderBlock output parity", () => {
  for (const type of TYPES) {
    it(`renders '${type}' identically`, () => {
      const html = renderBlock(
        makeBlock(type),
        settings,
        undefined,
        "test-slug",
        undefined,
        undefined,
        undefined,
      );
      expect(typeof html).toBe("string");
      expect(html).toMatchSnapshot();
    });
  }
});
