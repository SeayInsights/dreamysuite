import { describe, it, expect, vi } from "vitest";

vi.mock("./renderers", () => ({
  renderBlock: vi.fn(() => '<section class="block">x</section>'),
}));

import { buildHtml } from "./html-builder";
import type {
  ParsedBlock,
  SiteSettingRow,
  PageWithBlocks,
  ContentMap,
} from "./types";

describe("mobile reflow keeps one page visible", () => {
  it("scopes the reflow display rule to the active page-section", async () => {
    const pages = [
      {
        id: "p1",
        slug: "home",
        isVisible: 1,
        label: "Home",
        blocks: [
          { id: "b1", pageId: "p1", siteId: "s", type: "ok", config: {} },
        ] as unknown as ParsedBlock[],
      },
    ] as unknown as PageWithBlocks[];

    const html = await buildHtml(
      { id: "s", name: "T", slug: "t" } as unknown as Parameters<
        typeof buildHtml
      >[0],
      {
        siteId: "s",
        accentColor: "#000000",
        mainLanguage: "en",
      } as unknown as SiteSettingRow,
      pages,
      new Map() as ContentMap,
      {},
      "t",
      null,
      new Set(),
    );

    // Only the active section is shown under reflow (so nav still switches pages)...
    expect(html).toContain(".page-section.active{display:flex");
    // ...and the old unscoped rule (which forced every page visible) is gone.
    expect(html).not.toMatch(/ds-reflow \.page-section\{display:flex/);
  });
});
