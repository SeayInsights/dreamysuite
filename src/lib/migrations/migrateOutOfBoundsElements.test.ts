import { describe, expect, it } from "vitest";
import {
  migrateOutOfBoundsElements,
  needsMigration,
} from "./migrateOutOfBoundsElements";

// Helper: a text block with the given config object.
const blk = (config: Record<string, unknown>) => ({
  id: "b",
  type: "text",
  config,
});

describe("migrateOutOfBoundsElements", () => {
  it("skips blocks without full positioning data", () => {
    const result = migrateOutOfBoundsElements([
      blk({ content: "hi" }), // no positioning at all
      blk({ top: 10, left: 10 }), // partial — missing width/height
    ]);
    expect(result.fixed).toBe(0);
    expect(result.unchanged).toBe(2);
  });

  it("leaves in-bounds elements untouched", () => {
    const config = {
      top: 100,
      left: 100,
      width: 200,
      height: 150,
      color: "red",
    };
    const result = migrateOutOfBoundsElements([blk(config)]);
    expect(result.fixed).toBe(0);
    expect(result.blocks[0].config).toEqual(config);
  });

  it("constrains negative and overflowing elements back in-bounds", () => {
    const result = migrateOutOfBoundsElements([
      blk({ top: -50, left: 100, width: 200, height: 150 }), // negative top
      blk({ top: 100, left: 1200, width: 200, height: 150 }), // left+width > 1280
    ]);
    expect(result.fixed).toBe(2);
    for (const b of result.blocks) {
      // constrained result must no longer be out of bounds
      expect(needsMigration(b)).toBe(false);
      expect(b.config.top as number).toBeGreaterThanOrEqual(0);
      expect(b.config.left as number).toBeGreaterThanOrEqual(0);
    }
  });

  it("preserves non-position config and block fields", () => {
    const [b] = migrateOutOfBoundsElements([
      {
        id: "x",
        type: "image",
        sortOrder: 4,
        config: { top: -10, left: 0, width: 100, height: 100, url: "p.jpg" },
      },
    ]).blocks;
    expect(b).toMatchObject({ id: "x", type: "image", sortOrder: 4 });
    expect(b.config.url).toBe("p.jpg");
  });

  it("is idempotent — a second pass fixes nothing", () => {
    const once = migrateOutOfBoundsElements([
      blk({ top: -50, left: -20, width: 200, height: 150 }),
    ]);
    const twice = migrateOutOfBoundsElements(once.blocks);
    expect(twice.fixed).toBe(0);
    expect(twice.blocks[0].config).toEqual(once.blocks[0].config);
  });
});

describe("needsMigration (bounds)", () => {
  it("is true only for positioned, out-of-bounds blocks", () => {
    expect(
      needsMigration(blk({ top: -1, left: 0, width: 10, height: 10 })),
    ).toBe(true);
    expect(
      needsMigration(blk({ top: 100, left: 100, width: 100, height: 100 })),
    ).toBe(false);
    expect(needsMigration(blk({ content: "x" }))).toBe(false);
  });
});
