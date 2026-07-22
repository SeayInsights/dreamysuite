import { describe, it, expect, vi } from "vitest";

// Mock the block dispatcher so we can force one block to throw during
// server-render (mirrors the workerd runtime failure that blank-500'd the
// entire published site for any content-rich page). buildHtml must catch it
// per-block and still render the rest of the document.
vi.mock("./renderers", () => ({
  renderBlock: vi.fn((block: { id: string; type: string }) => {
    if (block.type === "boom")
      throw new Error("simulated server-render failure");
    return `<section class="ok" data-id="${block.id}">rendered:${block.type}</section>`;
  }),
}));

import { buildHtml } from "./html-builder";
import type {
  ParsedBlock,
  SiteSettingRow,
  PageWithBlocks,
  ContentMap,
} from "./types";

function block(id: string, type: string): ParsedBlock {
  return {
    id,
    pageId: "page-1",
    siteId: "site-1",
    type,
    config: {},
  } as unknown as ParsedBlock;
}

const settings = {
  siteId: "site-1",
  accentColor: "#B8921A",
  mainLanguage: "en",
} as unknown as SiteSettingRow;

const site = {
  id: "site-1",
  name: "Test",
  slug: "test",
} as unknown as Parameters<typeof buildHtml>[0];

describe("published renderer resilience", () => {
  it("does not blank-500 when a single block throws; renders the rest", async () => {
    const pages = [
      {
        id: "page-1",
        slug: "home",
        isVisible: 1,
        label: "Home",
        blocks: [
          block("good-1", "ok"),
          block("boom-1", "boom"),
          block("good-2", "ok"),
        ],
      },
    ] as unknown as PageWithBlocks[];

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const html = await buildHtml(
      site,
      settings,
      pages,
      new Map() as ContentMap,
      {},
      "test",
      null,
      new Set(),
    );

    // Surviving blocks rendered
    expect(html).toContain("rendered:ok");
    expect(html).toContain('data-id="good-1"');
    expect(html).toContain('data-id="good-2"');
    // Failing block degraded to a placeholder, not a thrown 500
    expect(html).toContain("block-render-error");
    expect(html).toContain('data-block-id="boom-1"');
    // The failure was logged for diagnosis
    expect(errSpy).toHaveBeenCalledTimes(1);
    errSpy.mockRestore();
  });
});
