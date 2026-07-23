import { describe, it, expect } from "vitest";
import {
  STARTERS,
  STARTER_SUMMARIES,
  getStarter,
  applyStarter,
  withEntranceAnimation,
  prepareStarterBlock,
} from "./starters";
import { VALID_PRESET_IDS } from "@/app/[slug]/scripts";

const STOCK_URL = /^\/stock\/[\w-]+\.svg$/;

type ApplyDb = Parameters<typeof applyStarter>[0];

function mockDb() {
  const calls: { sql: string; args: unknown[] }[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind: (...args: unknown[]) => ({
          run: async () => {
            calls.push({ sql, args });
          },
        }),
      };
    },
  };
  return { db: db as unknown as ApplyDb, calls };
}

describe("starter templates", () => {
  it("has unique ids and includes blank", () => {
    const ids = STARTERS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("blank");
  });

  it("summaries mirror the starters", () => {
    expect(STARTER_SUMMARIES.length).toBe(STARTERS.length);
    expect(STARTER_SUMMARIES.map((s) => s.id)).toEqual(
      STARTERS.map((s) => s.id),
    );
  });

  it("blank has no pages; every other starter has typed blocks", () => {
    for (const s of STARTERS) {
      if (s.id === "blank") {
        expect(s.pages.length).toBe(0);
        continue;
      }
      expect(s.pages.length).toBeGreaterThan(0);
      for (const p of s.pages) {
        expect(p.slug).toBeTruthy();
        expect(p.label).toBeTruthy();
        for (const b of p.blocks) expect(b.type).toBeTruthy();
      }
    }
  });

  it("applyStarter is a no-op for blank / unknown ids", async () => {
    const a = mockDb();
    await applyStarter(a.db, "site1", "blank", 1700000000000);
    expect(a.calls.length).toBe(0);
    const b = mockDb();
    await applyStarter(b.db, "site1", "does-not-exist", 1700000000000);
    expect(b.calls.length).toBe(0);
  });

  it("applyStarter inserts settings + all pages + all blocks", async () => {
    const { db, calls } = mockDb();
    const starter = getStarter("classic-wedding")!;
    await applyStarter(db, "site1", "classic-wedding", 1700000000000);
    const pages = calls.filter((c) => c.sql.includes("INSERT INTO page"));
    const blocks = calls.filter((c) => c.sql.includes("INSERT INTO block"));
    const settings = calls.filter((c) =>
      c.sql.includes("INSERT INTO site_setting"),
    );
    expect(settings.length).toBe(1);
    expect(pages.length).toBe(starter.pages.length);
    expect(blocks.length).toBe(
      starter.pages.reduce((n, p) => n + p.blocks.length, 0),
    );
  });

  it("applyStarter persists a valid entrance animation on every block", async () => {
    const { db, calls } = mockDb();
    await applyStarter(db, "site1", "classic-wedding", 1700000000000);
    const blocks = calls.filter((c) => c.sql.includes("INSERT INTO block"));
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) {
      // config is the 5th bound arg (0-indexed 4): id, siteId, pageId, type, config
      const cfg = JSON.parse(b.args[4] as string) as {
        animation?: unknown;
      };
      expect(typeof cfg.animation).toBe("string");
      expect(VALID_PRESET_IDS.has(cfg.animation as string)).toBe(true);
    }
  });
});

describe("withEntranceAnimation", () => {
  it("assigns a valid on-view preset when none is set", () => {
    const out = withEntranceAnimation({ type: "text", config: {} });
    expect(VALID_PRESET_IDS.has(out.config.animation as string)).toBe(true);
  });

  it("does not override an explicit animation", () => {
    const out = withEntranceAnimation({
      type: "text",
      config: { animation: "spring-in" },
    });
    expect(out.config.animation).toBe("spring-in");
  });

  it("uses a type-specific preset for galleries", () => {
    expect(
      withEntranceAnimation({ type: "gallery", config: {} }).config.animation,
    ).toBe("blur-in");
  });

  it("does not mutate the input block", () => {
    const input = { type: "text", config: {} };
    withEntranceAnimation(input);
    expect(input.config).toEqual({});
  });

  it("every default preset it can assign is valid", () => {
    for (const type of ["home-hero", "images", "gallery", "photo-split", "x"]) {
      const preset = withEntranceAnimation({ type, config: {} }).config
        .animation as string;
      expect(VALID_PRESET_IDS.has(preset)).toBe(true);
    }
  });
});

describe("prepareStarterBlock (hero eyebrow)", () => {
  const starter = getStarter("golden-anniversary")!;

  it("injects the template hero eyebrow onto a home-hero block", () => {
    const out = prepareStarterBlock({ type: "home-hero", config: {} }, starter);
    expect(out.config.eyebrow).toBe(starter.heroEyebrow);
    // still gets an entrance animation
    expect(typeof out.config.animation).toBe("string");
  });

  it("does not override a block's explicit eyebrow", () => {
    const out = prepareStarterBlock(
      { type: "home-hero", config: { eyebrow: "Custom" } },
      starter,
    );
    expect(out.config.eyebrow).toBe("Custom");
  });

  it("leaves non-hero blocks' eyebrow unset", () => {
    const out = prepareStarterBlock({ type: "text", config: {} }, starter);
    expect(out.config.eyebrow).toBeUndefined();
  });

  it("no-ops eyebrow for a starter without heroEyebrow", () => {
    const wedding = getStarter("classic-wedding")!;
    expect(wedding.heroEyebrow).toBeUndefined();
    const out = prepareStarterBlock({ type: "home-hero", config: {} }, wedding);
    expect(out.config.eyebrow).toBeUndefined();
  });
});

describe("template aesthetics", () => {
  it("non-wedding templates set a hero eyebrow", () => {
    for (const id of [
      "golden-anniversary",
      "engagement-party",
      "vow-renewal",
      "garden-party",
    ]) {
      expect(getStarter(id)!.heroEyebrow, `${id} eyebrow`).toBeTruthy();
    }
  });

  it("any starter bgImage points at a bundled stock asset", () => {
    for (const s of STARTERS) {
      const bg = s.settings?.bgImage as string | undefined;
      if (bg) expect(bg, `${s.id} bgImage`).toMatch(STOCK_URL);
    }
  });

  it("applyStarter persists the template bgImage into site_setting", async () => {
    const { db, calls } = mockDb();
    await applyStarter(db, "site1", "classic-wedding", 1700000000000);
    const setting = calls.find((c) =>
      c.sql.includes("INSERT INTO site_setting"),
    )!;
    // bgImage is bound right after siteTextColor (8th positional arg, index 7)
    expect(setting.args).toContain("/stock/texture-marble.svg");
  });
});
