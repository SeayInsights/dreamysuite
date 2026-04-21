import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  BLOCK_TYPES,
  parseBlockConfig,
  safeBlockConfig,
  type BlockType,
} from "./blocks";

/**
 * Minimal valid configs per block type. Every field is optional on these
 * schemas, so `{}` is always valid — we include a representative field so
 * `config.data` assertions below confirm round-trip worked.
 */
const MINIMAL: Record<BlockType, Record<string, unknown>> = {
  "home-hero": { coupleNames: "A & B" },
  couple: { coupleNames: "A & B" },
  header: { title: "hi" },
  "multi-text": { mode: "text" },
  video: { url: "https://example.com/v.mp4" },
  countdown: { label: "ceremony" },
  images: { urls: ["https://example.com/1.jpg"] },
  youtube: { url: "https://youtu.be/xyz" },
  spacer: { height: "40px" },
  "registry-card": { name: "Registry" },
  "hotel-card": { name: "Hotel" },
  "venue-map": { name: "Venue" },
  "photo-split": { heading: "Us" },
  rsvp: { heading: "RSVP" },
  // Consolidated (Task 18)
  "media-video": { provider: "youtube", url: "https://youtu.be/xyz" },
  gallery: { layout: "grid", urls: ["https://example.com/1.jpg"] },
  "info-card": { variant: "registry", name: "Registry" },
  // New (Task 19)
  "rsvp-form": { heading: "RSVP", siteId: "site_001" },
  "story-timeline": { heading: "Our Story", events: [] },
  "guest-book": { heading: "Guest Book" },
  // Format-picker (Task 3)
  faq: { heading: "FAQ", items: [] },
  schedule: { heading: "Schedule", events: [] },
  "fun-facts": { heading: "Fun Facts", items: [] },
  travel: { heading: "Getting Here", items: [] },
};

/**
 * Invalid-type patches per block type: each forces a wrong type on one
 * field defined by that schema so `safeParse` returns ok:false.
 */
const INVALID: Record<BlockType, Record<string, unknown>> = {
  "home-hero": { coupleNames: 123 },
  couple: { coupleNames: 123 },
  header: { titleAlign: "diagonal" },
  "multi-text": { mode: "not-a-mode" },
  video: { url: 42 },
  countdown: { label: false },
  images: { urls: "not-an-array" },
  youtube: { url: {} },
  spacer: { height: 0 },
  "registry-card": { name: [] },
  "hotel-card": { address: 5 },
  "venue-map": { embedUrl: {} },
  "photo-split": { layout: "upside-down" },
  rsvp: { heading: 42 },
  // Consolidated
  "media-video": { provider: "vimeo" },
  gallery: { layout: "masonry" },
  "info-card": { variant: "venue" },
  // New
  "rsvp-form": { heading: 42 },
  "story-timeline": { events: "not-an-array" },
  "guest-book": { heading: false },
  // Format-picker (Task 3)
  faq: { displayMode: "unknown" },
  schedule: { displayMode: "unknown" },
  "fun-facts": { cardStyle: "unknown" },
  travel: { displayMode: "unknown" },
};

describe("parseBlockConfig — per-type coverage", () => {
  for (const type of BLOCK_TYPES) {
    it(`${type}: valid minimal config parses`, () => {
      const res = parseBlockConfig(type, MINIMAL[type]);
      expect(res.ok).toBe(true);
    });

    it(`${type}: extra keys preserved via catchall`, () => {
      const res = parseBlockConfig(type, { ...MINIMAL[type], extraKey: "x" });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect((res.config as Record<string, unknown>).extraKey).toBe("x");
      }
    });

    it(`${type}: invalid field type fails with fallback`, () => {
      const res = parseBlockConfig(type, INVALID[type]);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.fallback).toBeTypeOf("object");
        expect(res.error).toBeTypeOf("string");
      }
    });
  }
});

describe("parseBlockConfig — edge cases", () => {
  it("unknown type + object config: forward-compat pass-through", () => {
    const res = parseBlockConfig("future-block-type", { anything: "goes" });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect((res.config as Record<string, unknown>).anything).toBe("goes");
    }
  });

  it("unknown type + non-object: fails", () => {
    const res = parseBlockConfig("future-block-type", 42);
    expect(res.ok).toBe(false);
  });

  it("invalid JSON string: fails with 'Invalid JSON' error", () => {
    const res = parseBlockConfig("home-hero", "not-json");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/Invalid JSON/);
    }
  });

  it("JSON string of valid config: parses", () => {
    const res = parseBlockConfig(
      "home-hero",
      JSON.stringify({ coupleNames: "X" }),
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect((res.config as Record<string, unknown>).coupleNames).toBe("X");
    }
  });

  it("empty string: treated as {}", () => {
    const res = parseBlockConfig("home-hero", "");
    expect(res.ok).toBe(true);
  });

  it("null/undefined raw: treated as {}", () => {
    expect(parseBlockConfig("home-hero", null).ok).toBe(true);
    expect(parseBlockConfig("home-hero", undefined).ok).toBe(true);
  });
});

describe("safeBlockConfig", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it("valid JSON string → returns parsed config", () => {
    const out = safeBlockConfig({
      id: "b1",
      type: "home-hero",
      config: '{"coupleNames":"X"}',
    });
    expect(out.coupleNames).toBe("X");
    expect(warn).not.toHaveBeenCalled();
  });

  it("invalid JSON string → returns {} and logs warning", () => {
    const out = safeBlockConfig({
      id: "b1",
      type: "home-hero",
      config: "{bad json",
    });
    expect(out).toEqual({});
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toMatch(/\[block:b1\] invalid config:/);
  });

  it("uses block.type when id missing", () => {
    safeBlockConfig({ type: "home-hero", config: "{bad" });
    expect(warn.mock.calls[0][0]).toMatch(/\[block:home-hero\]/);
  });
});
