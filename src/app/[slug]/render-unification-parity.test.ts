import { describe, it, expect } from "vitest";
import { renderBlock } from "./renderers";
import type { ParsedBlock, SiteSettingRow } from "./types";

/**
 * Render-pipeline unification parity.
 *
 * As block types migrate from the hand-written string renderer to React-SSR
 * (renderToStaticMarkup), the emitted bytes change cosmetically — React drops
 * inter-tag whitespace and encodes entities differently (&#39; -> &#x27;, and
 * ✸ literally instead of &#10038;). This test proves the change is cosmetic ONLY:
 * the new React output is normalized-equivalent to the exact published output the
 * legacy string renderer produced.
 *
 * `expectedLegacy` strings below are verbatim copies of the previous
 * `renderHomeHero` string-renderer output. The styled case additionally proves
 * `blockContainerStyle` (structured) matches the legacy inline `bsAttr` string.
 */

// Decode entities + strip inter-tag whitespace so we compare structure/content,
// not React-vs-hand-written cosmetic encoding. Intentionally does NOT collapse
// whitespace inside text/attributes, so real content differences still fail.
function normalizeHtml(html: string): string {
  return html
    .replace(/&#(\d+);/g, (_m, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, h: string) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/>\s+</g, "><")
    .trim();
}

const settings = {
  siteId: "s1",
  accentColor: "#B8921A",
  eventName: "Jane & John",
  eventDate: "June 2026",
  eventLocation: "Napa, CA",
  isLive: 1,
} as unknown as SiteSettingRow;

function makeBlock(id: string, config: Record<string, unknown>): ParsedBlock {
  return {
    id,
    siteId: "s1",
    pageId: "p1",
    type: "home-hero",
    config,
    sortOrder: 0,
    isVisible: 1,
  } as unknown as ParsedBlock;
}

describe("render unification — home-hero React-SSR parity", () => {
  it("plain config matches the legacy string output", () => {
    const expectedLegacy = `
        <section class="block block-home-hero" aria-label="Hero" data-block-id="hh1" data-block-type="home-hero">
          <div class="hero-inner">
            <p class="hero-eyebrow">We&#39;re getting married</p>
            <h1 class="hero-title" data-lang-field="couple">Jane &amp; John</h1>
            <p class="hero-date" data-lang-field="date">June 2026</p>
            <p class="hero-location" data-lang-field="location">Napa, CA</p>
            <div class="hero-divider" aria-hidden="true">&#10038;</div>
          </div>
        </section>`;
    const actual = renderBlock(makeBlock("hh1", {}), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("container-styled config matches the legacy bsAttr serialization", () => {
    const cfg = {
      blockWidth: 50,
      blockMarginLeft: 10,
      blockOffsetX: 20,
      blockOffsetY: 30,
      blockRotation: 5,
      blockZIndex: 3,
      textColor: "#111",
      backgroundColor: "#eee",
    };
    const expectedLegacy = `
        <section class="block block-home-hero" style="background:#eee;color:#111;--block-text:#111;width:50%;margin-left:10%;margin-right:0;transform:translate(20px,30px) rotate(5deg);z-index:3" data-bw="50" data-bml="10" data-box="20" data-boy="30" data-brot="5" aria-label="Hero" data-block-id="hh2" data-block-type="home-hero">
          <div class="hero-inner">
            <p class="hero-eyebrow">We&#39;re getting married</p>
            <h1 class="hero-title" data-lang-field="couple">Jane &amp; John</h1>
            <p class="hero-date" data-lang-field="date">June 2026</p>
            <p class="hero-location" data-lang-field="location">Napa, CA</p>
            <div class="hero-divider" aria-hidden="true">&#10038;</div>
          </div>
        </section>`;
    const actual = renderBlock(makeBlock("hh2", cfg), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("omits empty date/location (no editor placeholders leak to published)", () => {
    const bare = {
      siteId: "s1",
      accentColor: "#B8921A",
      eventName: "Solo",
    } as unknown as SiteSettingRow;
    const actual = renderBlock(makeBlock("hh3", {}), bare);
    expect(actual).not.toContain("hero-date");
    expect(actual).not.toContain("hero-location");
    expect(actual).not.toContain("Add wedding date");
    expect(actual).toContain('data-lang-field="couple"');
  });
});
