import { describe, expect, it } from "vitest";
import { consolidateBlocks, needsMigration } from "./blockConsolidation";

// Migrated blocks always carry a serialized (string) config.
const cfgOf = (block: { config?: unknown }) =>
  JSON.parse(block.config as string) as Record<string, unknown>;

describe("consolidateBlocks", () => {
  it("maps each simple legacy type to its consolidated type + flag", () => {
    const result = consolidateBlocks([
      { id: "1", type: "video", config: "{}" },
      { id: "2", type: "youtube", config: "{}" },
      { id: "3", type: "images", config: "{}" },
      { id: "4", type: "registry-card", config: "{}" },
      { id: "5", type: "hotel-card", config: "{}" },
      { id: "6", type: "rsvp", config: "{}" },
      { id: "7", type: "tidbits", config: "{}" },
      { id: "8", type: "travel-section", config: "{}" },
    ]);

    expect(result.blocks.map((b) => b.type)).toEqual([
      "media-video",
      "media-video",
      "gallery",
      "info-card",
      "info-card",
      "rsvp-form",
      "fun-facts",
      "travel",
    ]);
    expect(cfgOf(result.blocks[0]).provider).toBe("direct");
    expect(cfgOf(result.blocks[1]).provider).toBe("youtube");
    expect(cfgOf(result.blocks[2]).layout).toBe("grid");
    expect(cfgOf(result.blocks[3]).variant).toBe("registry");
    expect(cfgOf(result.blocks[4]).variant).toBe("hotel");
    expect(result.migrated).toBe(8);
    expect(result.unchanged).toBe(0);
  });

  it("migrates photo-split with an imageLayout default and preserved config", () => {
    const [withDefault] = consolidateBlocks([
      {
        id: "1",
        type: "photo-split",
        config: JSON.stringify({ caption: "hi" }),
      },
    ]).blocks;
    expect(withDefault.type).toBe("gallery");
    expect(cfgOf(withDefault)).toMatchObject({
      layout: "split",
      imageLayout: "left",
      caption: "hi",
    });

    const [withLayout] = consolidateBlocks([
      {
        id: "2",
        type: "photo-split",
        config: JSON.stringify({ layout: "right" }),
      },
    ]).blocks;
    // the legacy `layout` becomes `imageLayout`; the new `layout` is "split"
    expect(cfgOf(withLayout)).toMatchObject({
      layout: "split",
      imageLayout: "right",
    });
  });

  it("does not clobber existing config values", () => {
    const [block] = consolidateBlocks([
      {
        id: "1",
        type: "video",
        config: JSON.stringify({ src: "clip.mp4", provider: "custom" }),
      },
    ]).blocks;
    const cfg = cfgOf(block);
    expect(cfg.src).toBe("clip.mp4");
    expect(cfg.provider).toBe("custom"); // existing value wins over the default
  });

  it("maps multi-text by mode and leaves unknown modes unchanged", () => {
    const result = consolidateBlocks([
      {
        id: "1",
        type: "multi-text",
        config: JSON.stringify({ mode: "schedule" }),
      },
      {
        id: "2",
        type: "multi-text",
        config: JSON.stringify({ mode: "tidbits" }),
      },
      { id: "3", type: "multi-text", config: JSON.stringify({ mode: "faq" }) },
      {
        id: "4",
        type: "multi-text",
        config: JSON.stringify({ mode: "mystery" }),
      },
      { id: "5", type: "multi-text", config: "{}" },
    ]);

    expect(result.blocks.map((b) => b.type)).toEqual([
      "schedule",
      "fun-facts",
      "faq",
      "multi-text",
      "multi-text",
    ]);
    expect(result.migrated).toBe(3);
    expect(result.unchanged).toBe(2);
  });

  it("leaves current/unknown block types untouched and counts them", () => {
    const result = consolidateBlocks([
      { id: "1", type: "countdown", config: "{}" },
      { id: "2", type: "media-video", config: "{}" },
    ]);
    expect(result.migrated).toBe(0);
    expect(result.unchanged).toBe(2);
    expect(result.blocks.map((b) => b.type)).toEqual([
      "countdown",
      "media-video",
    ]);
  });

  it("is idempotent — a second pass migrates nothing", () => {
    const once = consolidateBlocks([
      { id: "1", type: "video", config: "{}" },
      { id: "2", type: "photo-split", config: "{}" },
      { id: "3", type: "multi-text", config: JSON.stringify({ mode: "faq" }) },
    ]);
    const twice = consolidateBlocks(once.blocks);

    expect(twice.migrated).toBe(0);
    expect(twice.blocks.map((b) => b.type)).toEqual(
      once.blocks.map((b) => b.type),
    );
  });

  it("preserves non-config fields and handles object/missing config", () => {
    const [fromObject] = consolidateBlocks([
      {
        id: "x",
        type: "images",
        sortOrder: 3,
        isVisible: 1,
        config: { cols: 2 } as Record<string, unknown>,
      },
    ]).blocks;
    expect(fromObject).toMatchObject({ id: "x", sortOrder: 3, isVisible: 1 });
    expect(cfgOf(fromObject)).toMatchObject({ layout: "grid", cols: 2 });

    const [fromMissing] = consolidateBlocks([
      { id: "y", type: "video" },
    ]).blocks;
    expect(cfgOf(fromMissing).provider).toBe("direct");
  });
});

describe("needsMigration", () => {
  it("is true for legacy types, false for current/unknown types", () => {
    for (const type of [
      "video",
      "youtube",
      "images",
      "photo-split",
      "registry-card",
      "hotel-card",
      "rsvp",
      "tidbits",
      "travel-section",
    ]) {
      expect(needsMigration({ id: "1", type, config: "{}" })).toBe(true);
    }
    for (const type of [
      "media-video",
      "gallery",
      "info-card",
      "countdown",
      "text",
    ]) {
      expect(needsMigration({ id: "1", type, config: "{}" })).toBe(false);
    }
  });

  it("checks multi-text against the mode map", () => {
    const mk = (mode: string) => ({
      id: "1",
      type: "multi-text",
      config: JSON.stringify({ mode }),
    });
    expect(needsMigration(mk("faq"))).toBe(true);
    expect(needsMigration(mk("travel"))).toBe(true);
    expect(needsMigration(mk("mystery"))).toBe(false);
    expect(needsMigration({ id: "1", type: "multi-text", config: "{}" })).toBe(
      false,
    );
  });
});
