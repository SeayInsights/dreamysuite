import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  STOCK_CATEGORIES,
  STOCK_IMAGES,
  isStockUrl,
  stockByKind,
  sceneUrlFor,
} from "./library";

const PUBLIC_DIR = join(process.cwd(), "public");
const CATEGORY_IDS = new Set(STOCK_CATEGORIES.map((c) => c.id));

describe("stock library manifest", () => {
  it("has at least one image", () => {
    expect(STOCK_IMAGES.length).toBeGreaterThan(0);
  });

  it("has unique ids and urls", () => {
    const ids = STOCK_IMAGES.map((i) => i.id);
    const urls = STOCK_IMAGES.map((i) => i.url);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("every image has a known category", () => {
    for (const img of STOCK_IMAGES) {
      expect(CATEGORY_IDS.has(img.category)).toBe(true);
    }
  });

  it("every url is a same-origin /stock path", () => {
    for (const img of STOCK_IMAGES) {
      expect(img.url.startsWith("/stock/")).toBe(true);
      expect(isStockUrl(img.url)).toBe(true);
    }
  });

  it("every referenced asset exists on disk", () => {
    for (const img of STOCK_IMAGES) {
      const filePath = join(PUBLIC_DIR, img.url.replace(/^\//, ""));
      expect(existsSync(filePath), `missing asset: ${img.url}`).toBe(true);
    }
  });

  it("every category has at least one image", () => {
    for (const cat of STOCK_CATEGORIES) {
      expect(
        STOCK_IMAGES.some((i) => i.category === cat.id),
        `category "${cat.id}" has no images`,
      ).toBe(true);
    }
  });
});

describe("stock kinds & scenes", () => {
  it("ships bold scene art (kind=scene), all present on disk", () => {
    const scenes = stockByKind("scene");
    expect(scenes.length).toBeGreaterThanOrEqual(6);
    for (const s of scenes) {
      const filePath = join(PUBLIC_DIR, s.url.replace(/^\//, ""));
      expect(existsSync(filePath), `missing scene: ${s.url}`).toBe(true);
    }
  });

  it("sceneUrlFor returns a scene for known categories", () => {
    expect(sceneUrlFor("romance")).toMatch(/^\/stock\/scene-.*\.svg$/);
    expect(sceneUrlFor("night")).toMatch(/^\/stock\/scene-.*\.svg$/);
    // even a category without its own scene falls back to some scene
    expect(sceneUrlFor("botanical")).toBeTruthy();
  });

  it("textures remain the default kind", () => {
    const marble = STOCK_IMAGES.find((i) => i.id === "texture-marble")!;
    expect(marble.kind).toBeUndefined(); // defaults to texture
  });
});

describe("isStockUrl", () => {
  it("recognizes stock urls", () => {
    expect(isStockUrl("/stock/x.svg")).toBe(true);
  });

  it("rejects non-stock and empty values", () => {
    expect(isStockUrl("/api/sites/a/photos/b")).toBe(false);
    expect(isStockUrl(null)).toBe(false);
    expect(isStockUrl(undefined)).toBe(false);
    expect(isStockUrl("")).toBe(false);
  });
});
