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

// Compare structure/content, not React-vs-hand-written cosmetic encoding:
//  - sort attributes within each tag (attribute order is irrelevant to the DOM,
//    and React may emit a different order than the hand-written string)
//  - lowercase attribute names (HTML attribute names are case-insensitive;
//    React 19 emits frameBorder/allowFullScreen/referrerPolicy in camelCase)
//  - treat boolean `x` and empty `x=""` attributes as equal (React emits `x=""`)
//  - decode entities (React uses &#x27; where the string used &#39;, etc.)
//  - strip inter-tag whitespace (React emits none; the string was indented)
// Intentionally does NOT collapse whitespace inside text, so real content
// differences still fail.
function normalizeHtml(html: string): string {
  const attrSorted = html.replace(
    /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s=/>]+(?:=(?:"[^"]*"|'[^']*'))?)*)\s*(\/?)>/g,
    (_m, tag: string, attrs: string, sc: string) => {
      const toks = (
        attrs.match(/[^\s=/>]+(?:=(?:"[^"]*"|'[^']*'))?/g) ?? []
      ).map((t) => {
        const eq = t.indexOf("=");
        const name = (eq === -1 ? t : t.slice(0, eq)).toLowerCase();
        const val = eq === -1 ? "" : t.slice(eq);
        return (name + val).replace(/=""$/, "");
      });
      toks.sort();
      // Drop the self-closing slash: `<br>`/`<br/>` and `<img ...>`/`<img .../>`
      // are equivalent in HTML. React self-closes void elements; the string didn't.
      void sc;
      return `<${tag}${toks.length ? " " + toks.join(" ") : ""}>`;
    },
  );
  return (
    attrSorted
      .replace(/>\s+</g, "><")
      // React drops trailing semicolons in style values (`x:y;` -> `x:y`); the
      // hand-written string kept them. Strip a trailing `;` before a closing quote.
      .replace(/;"/g, '"')
      .replace(/&#(\d+);/g, (_m, n: string) => String.fromCodePoint(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_m, h: string) =>
        String.fromCodePoint(parseInt(h, 16)),
      )
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .trim()
  );
}

const settings = {
  siteId: "s1",
  accentColor: "#B8921A",
  eventName: "Jane & John",
  eventDate: "June 2026",
  eventLocation: "Napa, CA",
  isLive: 1,
} as unknown as SiteSettingRow;

function makeBlock(
  id: string,
  type: string,
  config: Record<string, unknown>,
): ParsedBlock {
  return {
    id,
    siteId: "s1",
    pageId: "p1",
    type,
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
    const actual = renderBlock(makeBlock("hh1", "home-hero", {}), settings);
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
    const actual = renderBlock(makeBlock("hh2", "home-hero", cfg), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("omits empty date/location (no editor placeholders leak to published)", () => {
    const bare = {
      siteId: "s1",
      accentColor: "#B8921A",
      eventName: "Solo",
    } as unknown as SiteSettingRow;
    const actual = renderBlock(makeBlock("hh3", "home-hero", {}), bare);
    expect(actual).not.toContain("hero-date");
    expect(actual).not.toContain("hero-location");
    expect(actual).not.toContain("Add wedding date");
    expect(actual).toContain('data-lang-field="couple"');
  });
});

describe("render unification — batch A (spacer, youtube, venue-map)", () => {
  it("spacer matches the legacy string output", () => {
    const expectedLegacy = `<div class="block-spacer" style="height:100px" aria-hidden="true"></div>`;
    const actual = renderBlock(
      makeBlock("sp1", "spacer", { height: 100 }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("spacer defaults to 60px", () => {
    const expectedLegacy = `<div class="block-spacer" style="height:60px" aria-hidden="true"></div>`;
    const actual = renderBlock(makeBlock("sp2", "spacer", {}), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("youtube (with video) matches the legacy string output", () => {
    const expectedLegacy = `
        <section class="block block-youtube" aria-label="YouTube video" data-block-id="yt1" data-block-type="youtube">
          <div class="video-wrap">
                   <iframe
                     src="https://www.youtube-nocookie.com/embed/abc123"
                     title="YouTube video"
                     frameborder="0"
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                     allowfullscreen
                     class="youtube-iframe"
                   ></iframe>
                 </div>
        </section>`;
    const actual = renderBlock(
      makeBlock("yt1", "youtube", { videoId: "abc123" }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("youtube (empty) renders the media placeholder", () => {
    const expectedLegacy = `
        <section class="block block-youtube" aria-label="YouTube video" data-block-id="yt2" data-block-type="youtube">
          <div class="media-placeholder" aria-label="YouTube Video placeholder">
    <span class="media-placeholder-icon" aria-hidden="true">&#9654;</span>
    <p>YouTube Video will appear here once added.</p>
  </div>
        </section>`;
    const actual = renderBlock(makeBlock("yt2", "youtube", {}), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("venue-map (embed url) matches the legacy string output", () => {
    const expectedLegacy = `
        <section class="block block-venue-map" aria-label="Venue location" data-block-id="vm1" data-block-type="venue-map">
          <h2 class="section-heading">Venue</h2>
          <div class="section-rule" aria-hidden="true"></div>
          <p class="venue-name">Grand Hall</p>
          <p class="venue-note">Come</p>
          <div class="map-wrap">
                   <iframe
                     src="https://maps.example.com/e"
                     title="123 Main St"
                     frameborder="0"
                     loading="lazy"
                     referrerpolicy="no-referrer-when-downgrade"
                     class="map-iframe"
                     aria-label="Google Maps showing 123 Main St"
                   ></iframe>
                 </div>
                 <p class="venue-address">123 Main St</p>
        </section>`;
    const actual = renderBlock(
      makeBlock("vm1", "venue-map", {
        embedUrl: "https://maps.example.com/e",
        name: "Grand Hall",
        note: "Come",
        address: "123 Main St",
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("venue-map (empty) renders the placeholder", () => {
    const expectedLegacy = `
        <section class="block block-venue-map" aria-label="Venue location" data-block-id="vm2" data-block-type="venue-map">
          <h2 class="section-heading">Venue</h2>
          <div class="section-rule" aria-hidden="true"></div>
          <p class="placeholder-text">Venue address and map will appear here.</p>
        </section>`;
    const actual = renderBlock(makeBlock("vm2", "venue-map", {}), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });
});

describe("render unification — batch B (cards)", () => {
  it("registry-card (populated) matches the legacy string output", () => {
    const expectedLegacy = `
        <section class="block block-registry-card" aria-label="Gift registry" data-block-id="rc1" data-block-type="registry-card">
          <h2 class="section-heading">Registry</h2>
          <div class="section-rule" aria-hidden="true"></div>
          <div class="info-card">
                   <p class="card-title">Our Registry</p>
                   <p class="card-note">Thanks!</p>
                   <a href="https://registry.example.com" target="_blank" rel="noopener noreferrer" class="card-link" style="color:#B8921A">View Registry</a>
                 </div>
        </section>`;
    const actual = renderBlock(
      makeBlock("rc1", "registry-card", {
        name: "Our Registry",
        url: "https://registry.example.com",
        note: "Thanks!",
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("registry-card (empty) renders the placeholder", () => {
    const expectedLegacy = `
        <section class="block block-registry-card" aria-label="Gift registry" data-block-id="rc2" data-block-type="registry-card">
          <h2 class="section-heading">Registry</h2>
          <div class="section-rule" aria-hidden="true"></div>
          <p class="placeholder-text">Registry details will appear here once added.</p>
        </section>`;
    const actual = renderBlock(makeBlock("rc2", "registry-card", {}), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("hotel-card (populated) matches the legacy string output", () => {
    const expectedLegacy = `
        <section class="block block-hotel-card" aria-label="Hotel and accommodations" data-block-id="hc1" data-block-type="hotel-card">
          <h2 class="section-heading">Hotels &amp; Accommodations</h2>
          <div class="section-rule" aria-hidden="true"></div>
          <div class="info-card">
                   <p class="card-title">Grand Hotel</p>
                   <p class="card-note">1 Main St</p>
                   <p class="card-note">Block rate</p>
                   <a href="https://hotel.example.com" target="_blank" rel="noopener noreferrer" class="card-link" style="color:#B8921A">Book Now</a>
                 </div>
        </section>`;
    const actual = renderBlock(
      makeBlock("hc1", "hotel-card", {
        name: "Grand Hotel",
        address: "1 Main St",
        url: "https://hotel.example.com",
        note: "Block rate",
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("info-card (hotel variant, with image) matches the legacy string output", () => {
    const expectedLegacy = `
        <section class="block block-info-card" aria-label="Hotels &amp;amp; Accommodations" data-block-id="ic1" data-block-type="info-card">
          <h2 class="section-heading">Hotels &amp; Accommodations</h2>
          <div class="section-rule" aria-hidden="true"></div>
          <div class="info-card" style="text-align:center;">
            <img src="https://img.example.com/i.jpg" alt="Seaside Inn" loading="lazy" style="max-width:200px;border-radius:8px;margin-bottom:0.75rem;" />
            <p class="card-title">Seaside Inn</p>
            <p class="card-note">2 Beach Rd</p>
            <a href="https://inn.example.com" target="_blank" rel="noopener noreferrer" class="card-link" style="color:#B8921A">Book Now</a>
          </div>
        </section>`;
    const actual = renderBlock(
      makeBlock("ic1", "info-card", {
        variant: "hotel",
        name: "Seaside Inn",
        address: "2 Beach Rd",
        url: "https://inn.example.com",
        imageUrl: "https://img.example.com/i.jpg",
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("info-card (registry variant, defaults) matches the legacy string output", () => {
    const expectedLegacy = `
        <section class="block block-info-card" aria-label="Registry" data-block-id="ic2" data-block-type="info-card">
          <h2 class="section-heading">Registry</h2>
          <div class="section-rule" aria-hidden="true"></div>
          <div class="info-card" style="text-align:center;">
            <p class="card-title">Registry</p>
          </div>
        </section>`;
    const actual = renderBlock(makeBlock("ic2", "info-card", {}), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });
});

describe("render unification — batch C (header, text)", () => {
  it("header (styled title) matches the legacy string output", () => {
    const expectedLegacy = `
        <section class="block block-header" data-block-id="hd1" data-block-type="header">
          <h2 class="section-heading" style="font-size:2rem;text-align:center;font-weight:700;font-style:italic;text-decoration:underline">Welcome</h2>
          <div class="section-rule" aria-hidden="true"></div>
        </section>`;
    const actual = renderBlock(
      makeBlock("hd1", "header", {
        title: "Welcome",
        titleSize: "2rem",
        titleAlign: "center",
        titleBold: true,
        titleItalic: true,
        titleUnderline: true,
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("header (no style, default text) matches the legacy string output", () => {
    const expectedLegacy = `
        <section class="block block-header" data-block-id="hd2" data-block-type="header">
          <h2 class="section-heading">Section</h2>
          <div class="section-rule" aria-hidden="true"></div>
        </section>`;
    const actual = renderBlock(makeBlock("hd2", "header", {}), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("text (heading + multiline body) matches the legacy string output", () => {
    const expectedLegacy = `
        <section class="block block-text" data-block-id="tx1" data-block-type="text">
          <h2 class="section-heading" style="font-size:1.5rem">Our Story</h2><div class="section-rule" aria-hidden="true"></div>
          <div class="text-body">
            <p>Line one<br>Line two</p>
          </div>
        </section>`;
    const actual = renderBlock(
      makeBlock("tx1", "text", {
        heading: "Our Story",
        headingSize: "1.5rem",
        body: "Line one\nLine two",
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("text (contentKey lang fields) matches the legacy string output", () => {
    const expectedLegacy = `
        <section class="block block-text" data-block-id="tx2" data-block-type="text">
          <h2 class="section-heading" data-lang-field="story_heading">Chapter</h2><div class="section-rule" aria-hidden="true"></div>
          <div class="text-body">
            <p data-lang-field="story">Body text</p>
          </div>
        </section>`;
    const actual = renderBlock(
      makeBlock("tx2", "text", { contentKey: "story" }),
      {
        siteId: "s1",
        accentColor: "#B8921A",
        story: "Body text",
        story_heading: "Chapter",
      } as unknown as SiteSettingRow,
      { story: "Body text", story_heading: "Chapter" },
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("text (empty) renders the placeholder", () => {
    const expectedLegacy = `
        <section class="block block-text" data-block-id="tx3" data-block-type="text">
          <div class="text-body">
            <p class="placeholder-text">Story text will appear here once added.</p>
          </div>
        </section>`;
    const actual = renderBlock(makeBlock("tx3", "text", {}), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });
});
