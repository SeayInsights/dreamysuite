import { describe, it, expect } from "vitest";
import { buildLazyVideoScript } from "./scripts";
import { renderBlock } from "./renderers";
import type { ParsedBlock, SiteSettingRow } from "./types";

describe("lazy video loading", () => {
  it("defers iframes via IntersectionObserver on data-lazy-src", () => {
    const s = buildLazyVideoScript();
    expect(s).toContain("data-lazy-src");
    expect(s).toContain("IntersectionObserver");
  });

  it("media-video renders a deferred iframe (data-lazy-src, no eager src)", async () => {
    const block = {
      id: "v",
      pageId: "p",
      siteId: "s",
      type: "media-video",
      config: { provider: "vimeo", url: "https://vimeo.com/12345" },
    } as unknown as ParsedBlock;
    const html = await renderBlock(
      block,
      { accentColor: "#000000" } as unknown as SiteSettingRow,
      undefined,
      "slug",
      {},
      "en",
      "en",
    );
    expect(html).toContain(
      'data-lazy-src="https://player.vimeo.com/video/12345',
    );
    // no eager src on the iframe (would defeat the deferral)
    expect(html).not.toMatch(/<iframe[^>]*\ssrc=/);
  });
});
