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
  it("plain config matches the legacy string output", async () => {
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
    const actual = await renderBlock(
      makeBlock("hh1", "home-hero", {}),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("container-styled config matches the legacy bsAttr serialization", async () => {
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
    const actual = await renderBlock(
      makeBlock("hh2", "home-hero", cfg),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("omits empty date/location (no editor placeholders leak to published)", async () => {
    const bare = {
      siteId: "s1",
      accentColor: "#B8921A",
      eventName: "Solo",
    } as unknown as SiteSettingRow;
    const actual = await renderBlock(makeBlock("hh3", "home-hero", {}), bare);
    expect(actual).not.toContain("hero-date");
    expect(actual).not.toContain("hero-location");
    expect(actual).not.toContain("Add wedding date");
    expect(actual).toContain('data-lang-field="couple"');
  });

  it("renders a hero background image with scrim when imageUrl is set", async () => {
    const actual = await renderBlock(
      makeBlock("hh4", "home-hero", {
        imageUrl: "/stock/photos/wedding-hero.webp",
      }),
      settings,
    );
    expect(actual).toContain("hero-has-image");
    expect(actual).toContain('class="hero-scrim"');
    expect(actual).toContain("background-image");
    expect(actual).toContain("/stock/photos/wedding-hero.webp");
  });

  it("has no image markup when imageUrl is absent (parity preserved)", async () => {
    const actual = await renderBlock(
      makeBlock("hh5", "home-hero", {}),
      settings,
    );
    expect(actual).not.toContain("hero-has-image");
    expect(actual).not.toContain("hero-scrim");
  });

  it("rejects a javascript: hero imageUrl (safeUrl neutralizes it)", async () => {
    const actual = await renderBlock(
      makeBlock("hh6", "home-hero", { imageUrl: "javascript:alert(1)" }),
      settings,
    );
    expect(actual).not.toContain("javascript:");
  });
});

describe("render unification — batch A (spacer, youtube, venue-map)", () => {
  it("spacer matches the legacy string output", async () => {
    const expectedLegacy = `<div class="block-spacer" style="height:100px" aria-hidden="true"></div>`;
    const actual = await renderBlock(
      makeBlock("sp1", "spacer", { height: 100 }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("spacer defaults to 60px", async () => {
    const expectedLegacy = `<div class="block-spacer" style="height:60px" aria-hidden="true"></div>`;
    const actual = await renderBlock(makeBlock("sp2", "spacer", {}), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("youtube (with video) matches the legacy string output", async () => {
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
    const actual = await renderBlock(
      makeBlock("yt1", "youtube", { videoId: "abc123" }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("youtube (empty) renders the media placeholder", async () => {
    const expectedLegacy = `
        <section class="block block-youtube" aria-label="YouTube video" data-block-id="yt2" data-block-type="youtube">
          <div class="media-placeholder" aria-label="YouTube Video placeholder">
    <span class="media-placeholder-icon" aria-hidden="true">&#9654;</span>
    <p>YouTube Video will appear here once added.</p>
  </div>
        </section>`;
    const actual = await renderBlock(makeBlock("yt2", "youtube", {}), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("venue-map (embed url) matches the legacy string output", async () => {
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
    const actual = await renderBlock(
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

  it("venue-map (empty) renders the placeholder", async () => {
    const expectedLegacy = `
        <section class="block block-venue-map" aria-label="Venue location" data-block-id="vm2" data-block-type="venue-map">
          <h2 class="section-heading">Venue</h2>
          <div class="section-rule" aria-hidden="true"></div>
          <p class="placeholder-text">Venue address and map will appear here.</p>
        </section>`;
    const actual = await renderBlock(
      makeBlock("vm2", "venue-map", {}),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });
});

describe("render unification — batch B (cards)", () => {
  it("registry-card (populated) matches the legacy string output", async () => {
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
    const actual = await renderBlock(
      makeBlock("rc1", "registry-card", {
        name: "Our Registry",
        url: "https://registry.example.com",
        note: "Thanks!",
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("registry-card (empty) renders the placeholder", async () => {
    const expectedLegacy = `
        <section class="block block-registry-card" aria-label="Gift registry" data-block-id="rc2" data-block-type="registry-card">
          <h2 class="section-heading">Registry</h2>
          <div class="section-rule" aria-hidden="true"></div>
          <p class="placeholder-text">Registry details will appear here once added.</p>
        </section>`;
    const actual = await renderBlock(
      makeBlock("rc2", "registry-card", {}),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("hotel-card (populated) matches the legacy string output", async () => {
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
    const actual = await renderBlock(
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

  it("info-card (hotel variant, with image) matches the legacy string output", async () => {
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
    const actual = await renderBlock(
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

  it("info-card (registry variant, defaults) matches the legacy string output", async () => {
    const expectedLegacy = `
        <section class="block block-info-card" aria-label="Registry" data-block-id="ic2" data-block-type="info-card">
          <h2 class="section-heading">Registry</h2>
          <div class="section-rule" aria-hidden="true"></div>
          <div class="info-card" style="text-align:center;">
            <p class="card-title">Registry</p>
          </div>
        </section>`;
    const actual = await renderBlock(
      makeBlock("ic2", "info-card", {}),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });
});

describe("render unification — batch C (header, text)", () => {
  it("header (styled title) matches the legacy string output", async () => {
    const expectedLegacy = `
        <section class="block block-header" data-block-id="hd1" data-block-type="header">
          <h2 class="section-heading" style="font-size:2rem;text-align:center;font-weight:700;font-style:italic;text-decoration:underline">Welcome</h2>
          <div class="section-rule" aria-hidden="true"></div>
        </section>`;
    const actual = await renderBlock(
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

  it("header (no style, default text) matches the legacy string output", async () => {
    const expectedLegacy = `
        <section class="block block-header" data-block-id="hd2" data-block-type="header">
          <h2 class="section-heading">Section</h2>
          <div class="section-rule" aria-hidden="true"></div>
        </section>`;
    const actual = await renderBlock(makeBlock("hd2", "header", {}), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("text (heading + multiline body) matches the legacy string output", async () => {
    const expectedLegacy = `
        <section class="block block-text" data-block-id="tx1" data-block-type="text">
          <h2 class="section-heading" style="font-size:1.5rem">Our Story</h2><div class="section-rule" aria-hidden="true"></div>
          <div class="text-body">
            <p>Line one<br>Line two</p>
          </div>
        </section>`;
    const actual = await renderBlock(
      makeBlock("tx1", "text", {
        heading: "Our Story",
        headingSize: "1.5rem",
        body: "Line one\nLine two",
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("text (contentKey lang fields) matches the legacy string output", async () => {
    const expectedLegacy = `
        <section class="block block-text" data-block-id="tx2" data-block-type="text">
          <h2 class="section-heading" data-lang-field="story_heading">Chapter</h2><div class="section-rule" aria-hidden="true"></div>
          <div class="text-body">
            <p data-lang-field="story">Body text</p>
          </div>
        </section>`;
    const actual = await renderBlock(
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

  it("text (empty) renders the placeholder", async () => {
    const expectedLegacy = `
        <section class="block block-text" data-block-id="tx3" data-block-type="text">
          <div class="text-body">
            <p class="placeholder-text">Story text will appear here once added.</p>
          </div>
        </section>`;
    const actual = await renderBlock(makeBlock("tx3", "text", {}), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });
});

describe("render unification — batch D (tidbits, fun-facts)", () => {
  it("tidbits (populated, 2 cols) matches the legacy string output", async () => {
    const expectedLegacy = `
    <section class="block block-tidbits" aria-label="Fun facts" data-block-id="tb1" data-block-type="tidbits">
      <h2 class="section-heading">Fun Facts</h2><div class="section-rule" aria-hidden="true"></div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;">
             <div style="background:#fff;border:1px solid var(--site-border);border-radius:12px;padding:1.25rem;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.05);color:var(--block-text,var(--text));">
               <div style="font-size:2rem;margin-bottom:0.5rem;">🎉</div>
               <strong style="display:block;margin-bottom:0.375rem;">Fun</strong>
               <p style="color:var(--block-text,var(--site-muted));font-size:0.9375rem;margin:0;">A fact</p>
             </div>
           </div>
    </section>`;
    const actual = await renderBlock(
      makeBlock("tb1", "tidbits", {
        columns: "2",
        items: [{ icon: "🎉", title: "Fun", body: "A fact" }],
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("tidbits (empty) renders the placeholder with title", async () => {
    const expectedLegacy = `
    <section class="block block-tidbits" aria-label="Fun facts" data-block-id="tb2" data-block-type="tidbits">
      <h2 class="section-heading">Fun Facts</h2><div class="section-rule" aria-hidden="true"></div>
      <p class="placeholder-text">Fun facts will appear here once added in the Content tab.</p>
    </section>`;
    const actual = await renderBlock(makeBlock("tb2", "tidbits", {}), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("fun-facts (populated, 3 cols) matches the legacy string output", async () => {
    const expectedLegacy = `
    <section class="block block-tidbits" aria-label="Fun facts" data-block-id="ff1" data-block-type="fun-facts">
      <h2 class="section-heading">Fun Facts</h2><div class="section-rule" aria-hidden="true"></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;">
             <div style="background:#fff;border:1px solid var(--site-border);border-radius:12px;padding:1.25rem;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.05);color:var(--block-text,var(--text));">
               <div style="font-size:2rem;margin-bottom:0.5rem;">💍</div>
               <strong style="display:block;margin-bottom:0.375rem;font-size:0.8rem;font-weight:500;color:var(--site-accent,var(--site-muted));">How met?</strong>
               <p style="color:var(--block-text,var(--site-muted));font-size:0.9375rem;margin:0;">At a cafe</p>
             </div>
           </div>
    </section>`;
    const actual = await renderBlock(
      makeBlock("ff1", "fun-facts", {
        columns: "3",
        items: [{ icon: "💍", question: "How met?", body: "At a cafe" }],
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("fun-facts (showTitle:false, body-only item) matches the legacy string output", async () => {
    const expectedLegacy = `
    <section class="block block-tidbits" aria-label="Fun facts" data-block-id="ff2" data-block-type="fun-facts">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;">
             <div style="background:#fff;border:1px solid var(--site-border);border-radius:12px;padding:1.25rem;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.05);color:var(--block-text,var(--text));">
               <p style="color:var(--block-text,var(--site-muted));font-size:0.9375rem;margin:0;">x</p>
             </div>
           </div>
    </section>`;
    const actual = await renderBlock(
      makeBlock("ff2", "fun-facts", {
        showTitle: false,
        items: [{ body: "x" }],
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });
});

describe("render unification — multi-text (5 sub-modes)", () => {
  it("schedule mode matches the legacy string output", async () => {
    const expectedLegacy = `
  <section class="block block-schedule" aria-label="Schedule" data-block-id="mt1" data-block-type="multi-text">
    <h2 class="section-heading">Our Day</h2>
    <div class="section-rule" aria-hidden="true"></div>
    <ol class="timeline">
             <li class="timeline-item">
               <span class="timeline-time">2pm</span>
               <div class="timeline-content">
                 <strong>Ceremony</strong>
                 <p style="font-size:0.85em;color:var(--site-muted);margin:0.2rem 0 0;">June 1</p>
                 <p style="font-size:0.85em;color:var(--site-muted);margin:0.2rem 0 0;">📍 Chapel</p>
                 <p>Come early</p>
               </div>
             </li>
         </ol>
  </section>`;
    const actual = await renderBlock(
      makeBlock("mt1", "multi-text", { mode: "schedule", title: "Our Day" }),
      settings,
      {
        events: [
          {
            time: "2pm",
            name: "Ceremony",
            date: "June 1",
            location: "Chapel",
            description: "Come early",
          },
        ],
      },
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("faq mode matches the legacy string output", async () => {
    const expectedLegacy = `
  <section class="block block-faq" aria-label="Frequently asked questions" data-block-id="mt2" data-block-type="multi-text">
    <h2 class="section-heading">Questions &amp; Answers</h2>
    <div class="section-rule" aria-hidden="true"></div>
    <dl class="faq-list">
           <dt class="faq-question">When?</dt><dd class="faq-answer">June</dd>
         </dl>
  </section>`;
    const actual = await renderBlock(
      makeBlock("mt2", "multi-text", { mode: "faq" }),
      settings,
      {
        questions: [{ q: "When?", a: "June" }],
      },
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("tidbits mode (title override) matches the legacy string output", async () => {
    const expectedLegacy = `
  <section class="block block-tidbits" aria-label="Fun facts" data-block-id="mt3" data-block-type="multi-text">
    <h2 class="section-heading">Facts</h2><div class="section-rule" aria-hidden="true"></div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;">
           <div style="background:#fff;border:1px solid var(--site-border);border-radius:12px;padding:1.25rem;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.05);color:var(--block-text,var(--text));">
             <div style="font-size:2rem;margin-bottom:0.5rem;">🌟</div>
             <strong style="display:block;margin-bottom:0.375rem;">Note</strong>
             <p style="color:var(--block-text,var(--site-muted));font-size:0.9375rem;margin:0;">Text</p>
           </div>
         </div>
  </section>`;
    const actual = await renderBlock(
      makeBlock("mt3", "multi-text", {
        mode: "tidbits",
        title: "Facts",
        columns: "2",
      }),
      settings,
      { tidbits: [{ icon: "🌟", title: "Note", body: "Text" }] },
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("travel mode matches the legacy string output", async () => {
    const expectedLegacy = `
  <section class="block block-travel" aria-label="Travel information" data-block-id="mt4" data-block-type="multi-text">
    <h2 class="section-heading">Getting There</h2>
    <div class="section-rule" aria-hidden="true"></div>
          <div style="margin-bottom:1.5rem;">
            <h3 style="font-size:1.05rem;margin:0 0 0.4rem;">Flights</h3>
            <p style="margin:0 0 0.4rem;line-height:1.7;">Fly to X</p>
            <a href="https://book.example.com" target="_blank" rel="noopener noreferrer" style="color:var(--site-accent)">Book</a>
          </div>
  </section>`;
    const actual = await renderBlock(
      makeBlock("mt4", "multi-text", { mode: "travel" }),
      settings,
      {
        travelItems: [
          {
            heading: "Flights",
            body: "Fly to X",
            linkLabel: "Book",
            linkUrl: "https://book.example.com",
          },
        ],
      },
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("text mode (single heading/body, multiline) matches the legacy string output", async () => {
    const expectedLegacy = `
    <section class="block block-text" data-block-id="mt5" data-block-type="multi-text">
      <h2 class="section-heading" style="font-size:2rem">Title</h2><div class="section-rule" aria-hidden="true"></div>
      <div class="text-body"><p>a<br>b</p></div>
    </section>`;
    const actual = await renderBlock(
      makeBlock("mt5", "multi-text", {
        heading: "Title",
        headingSize: "2rem",
        body: "a\nb",
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("text mode (textItems array) matches the legacy string output", async () => {
    const expectedLegacy = `
    <section class="block block-text" data-block-id="mt6" data-block-type="multi-text">
      <h2 class="section-heading">H1</h2><div class="section-rule" aria-hidden="true"></div>
      <div class="text-body"><p>B1</p></div>
      <h2 class="section-heading">H2</h2>
      <div class="text-body" style="margin-top:1.5rem"><p>B2</p></div>
    </section>`;
    const actual = await renderBlock(
      makeBlock("mt6", "multi-text", {
        textItems: [
          { heading: "H1", body: "B1" },
          { heading: "H2", body: "B2" },
        ],
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });
});

describe("render unification — lists (schedule, faq, travel, travel-section)", () => {
  it("schedule (cfg.events) matches the legacy string output", async () => {
    const expectedLegacy = `
    <section class="block block-schedule" aria-label="Schedule" data-block-id="sc1" data-block-type="schedule">
      <h2 class="section-heading">The Day</h2>
      <div class="section-rule" aria-hidden="true"></div>
      <ol class="timeline">
               <li class="timeline-item">
                 <span class="timeline-time">3pm</span>
                 <div class="timeline-content">
                   <strong>Reception</strong>
                 </div>
               </li>
           </ol>
    </section>`;
    const actual = await renderBlock(
      makeBlock("sc1", "schedule", {
        events: [{ time: "3pm", name: "Reception" }],
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("schedule (empty) renders the placeholder", async () => {
    const expectedLegacy = `
    <section class="block block-schedule" aria-label="Schedule" data-block-id="sc2" data-block-type="schedule">
      <h2 class="section-heading">The Day</h2>
      <div class="section-rule" aria-hidden="true"></div>
      <p class="placeholder-text">The wedding day schedule will appear here once added in the Content tab.</p>
    </section>`;
    const actual = await renderBlock(
      makeBlock("sc2", "schedule", {}),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("faq (cfg.items question/answer) matches the legacy string output", async () => {
    const expectedLegacy = `
    <section class="block block-faq" aria-label="Frequently asked questions" data-block-id="fq1" data-block-type="faq">
      <h2 class="section-heading">Questions &amp; Answers</h2>
      <div class="section-rule" aria-hidden="true"></div>
      <dl class="faq-list">
               <dt class="faq-question">Q1</dt><dd class="faq-answer">A1</dd>
           </dl>
    </section>`;
    const actual = await renderBlock(
      makeBlock("fq1", "faq", {
        items: [{ question: "Q1", answer: "A1" }],
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("travel-section (nl2br body + link) matches the legacy string output", async () => {
    const expectedLegacy = `
    <section class="block block-travel" aria-label="Travel information" data-block-id="tv1" data-block-type="travel-section">
      <h2 class="section-heading">Travel</h2>
      <div class="section-rule" aria-hidden="true"></div>
            <div style="margin-bottom:1.5rem;">
              <h3 style="font-size:1.05rem;margin:0 0 0.4rem;">Air</h3>
              <p style="margin:0 0 0.4rem;line-height:1.7;">line1<br>line2</p>
              <a href="https://t.example.com" target="_blank" rel="noopener noreferrer" style="color:var(--site-accent)">Book</a>
            </div>
    </section>`;
    const actual = await renderBlock(
      makeBlock("tv1", "travel-section", {
        title: "Travel",
        items: [
          {
            heading: "Air",
            body: "line1\nline2",
            linkLabel: "Book",
            linkUrl: "https://t.example.com",
          },
        ],
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("travel (cfg.items only, default title) matches the legacy string output", async () => {
    const expectedLegacy = `
    <section class="block block-travel" aria-label="Travel information" data-block-id="tv2" data-block-type="travel">
      <h2 class="section-heading">Getting There</h2>
      <div class="section-rule" aria-hidden="true"></div>
            <div style="margin-bottom:1.5rem;">
              <h3 style="font-size:1.05rem;margin:0 0 0.4rem;">Car</h3>
            </div>
    </section>`;
    const actual = await renderBlock(
      makeBlock("tv2", "travel", { items: [{ heading: "Car" }] }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });
});

describe("render unification — media 1 (countdown, video, media-video)", () => {
  it("countdown (with date, no rsvp button) matches the legacy string output", async () => {
    const expectedLegacy = `
    <section class="block block-countdown" aria-label="Countdown" data-block-id="cd1" data-block-type="countdown">
      <p class="countdown-label">Until we say I do</p>
      <div class="countdown-units" data-cd-clock data-date="June 2026" data-block-id="cd1">
             <div class="countdown-unit"><span class="countdown-num" id="cd-days-cd1">--</span><span class="countdown-unit-label">Days</span></div>
             <div class="countdown-unit"><span class="countdown-num" id="cd-hours-cd1">--</span><span class="countdown-unit-label">Hours</span></div>
             <div class="countdown-unit"><span class="countdown-num" id="cd-mins-cd1">--</span><span class="countdown-unit-label">Minutes</span></div>
             <div class="countdown-unit"><span class="countdown-num" id="cd-secs-cd1">--</span><span class="countdown-unit-label">Seconds</span></div>
           </div>
      <div class="rsvp-wrap" style="text-align:center;margin-top:2rem;display:none;">
        <a href="#rsvp" class="rsvp-submit" style="background:#B8921A;color:#fff;text-decoration:none;display:inline-block">RSVP Now</a>
      </div>
    </section>`;
    const actual = await renderBlock(
      makeBlock("cd1", "countdown", {}),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("video (vimeo) matches the legacy string output", async () => {
    const expectedLegacy = `
        <section class="block block-video" aria-label="Video" data-block-id="vid1" data-block-type="video"
          style="position:relative;width:100%;height:100dvh;overflow:hidden;background:#000;">
          <iframe
            data-lazy-src="https://player.vimeo.com/video/12345?autoplay=1&muted=1&loop=1&background=1"
            style="position:absolute;top:50%;left:50%;width:177.78vh;min-width:100%;min-height:100%;height:56.25vw;transform:translate(-50%,-50%);border:0;"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen
            title="Wedding video"
          ></iframe>
        </section>`;
    const actual = await renderBlock(
      makeBlock("vid1", "video", { vimeoId: "12345" }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("video (direct, empty) renders the media placeholder", async () => {
    const expectedLegacy = `
        <section class="block block-video" aria-label="Video" data-block-id="vid2" data-block-type="video" style="position:relative;">
          <div class="media-placeholder" aria-label="Video placeholder">
    <span class="media-placeholder-icon" aria-hidden="true">&#9654;</span>
    <p>Video will appear here once added.</p>
  </div>
        </section>`;
    const actual = await renderBlock(makeBlock("vid2", "video", {}), settings);
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("media-video (vimeo) matches the legacy string output", async () => {
    const expectedLegacy = `
        <section class="block block-media-video" aria-label="Video" data-block-id="mv1" data-block-type="media-video"
          style="position:relative;width:100%;height:100dvh;overflow:hidden;background:#000;">
          <iframe
            data-lazy-src="https://player.vimeo.com/video/999?autoplay=1&muted=1&loop=1&background=1"
            style="position:absolute;top:50%;left:50%;width:177.78vh;min-width:100%;min-height:100%;height:56.25vw;transform:translate(-50%,-50%);border:0;"
            allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Video"
          ></iframe>
        </section>`;
    const actual = await renderBlock(
      makeBlock("mv1", "media-video", { vimeoId: "999" }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("media-video (youtube) matches the legacy string output", async () => {
    const expectedLegacy = `
        <section class="block block-media-video" aria-label="Video" data-block-id="mv2" data-block-type="media-video">
          <div class="video-wrap">
                 <iframe data-lazy-src="https://www.youtube-nocookie.com/embed/abc" title="YouTube video" frameborder="0"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="youtube-iframe"></iframe>
               </div>
        </section>`;
    const actual = await renderBlock(
      makeBlock("mv2", "media-video", {
        url: "https://youtu.be/abc",
        provider: "youtube",
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("media-video (direct) matches the legacy string output", async () => {
    const expectedLegacy = `
        <section class="block block-media-video" aria-label="Video" data-block-id="mv3" data-block-type="media-video" style="position:relative;height:100dvh">
          <video src="https://cdn.example.com/v.mp4" autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;"></video>
        </section>`;
    const actual = await renderBlock(
      makeBlock("mv3", "media-video", {
        url: "https://cdn.example.com/v.mp4",
        provider: "direct",
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });
});

describe("render unification — media 2 (images, gallery)", () => {
  it("images (grid-2) matches the legacy string output", async () => {
    const expectedLegacy = `
        <section class="block block-images" aria-label="Photo gallery" data-block-id="im1" data-block-type="images">
          <div class="image-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.75rem;">
                   <img src="https://a.jpg" alt="Wedding photo 1" loading="lazy" width="800" height="600" class="gallery-img" style="object-position:center center;border-radius:12px" /><img src="https://b.jpg" alt="Wedding photo 2" loading="lazy" width="800" height="600" class="gallery-img" style="object-position:center center;border-radius:12px" />
                 </div>
        </section>`;
    const actual = await renderBlock(
      makeBlock("im1", "images", {
        layout: "grid-2",
        urls: ["https://a.jpg", "https://b.jpg"],
        photoRadius: "12px",
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("images (masonry, per-image extra style) matches the legacy string output", async () => {
    const expectedLegacy = `
        <section class="block block-images" aria-label="Photo gallery" data-block-id="im3" data-block-type="images">
          <div class="image-grid" style="columns:2;column-gap:0.75rem">
                   <img src="https://a.jpg" alt="Wedding photo 1" loading="lazy" width="800" height="600" class="gallery-img" style="object-position:center center;border-radius:8px;break-inside:avoid;aspect-ratio:auto" />
                 </div>
        </section>`;
    const actual = await renderBlock(
      makeBlock("im3", "images", {
        layout: "masonry",
        urls: ["https://a.jpg"],
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("images (empty, named slot) renders the placeholder", async () => {
    const expectedLegacy = `
        <section class="block block-images" aria-label="Photo gallery" data-block-id="im2" data-block-type="images">
          <p class="placeholder-text">Photos for &quot;gallery1&quot; will appear here.</p>
        </section>`;
    const actual = await renderBlock(
      makeBlock("im2", "images", { imageSlot: "gallery1" }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("gallery (grid, 2 images) matches the legacy string output", async () => {
    const expectedLegacy = `
        <section class="block block-gallery" aria-label="Photo gallery" data-block-id="gl1" data-block-type="gallery">
          <div class="image-grid" style="display:grid;gap:0.5rem;grid-template-columns:1fr 1fr;">
                 <img src="https://x.jpg" alt="Gallery photo 1" loading="lazy" style="width:100%;border-radius:8px;object-fit:cover;" /><img src="https://y.jpg" alt="Gallery photo 2" loading="lazy" style="width:100%;border-radius:8px;object-fit:cover;" />
               </div>
        </section>`;
    const actual = await renderBlock(
      makeBlock("gl1", "gallery", {
        urls: ["https://x.jpg", "https://y.jpg"],
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("gallery (split mode) matches the legacy string output", async () => {
    const expectedLegacy = `
        <section class="block block-gallery" data-block-id="gl2" data-block-type="gallery">
          <div style="display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap;"><div style="flex:1;"><img src="https://s.jpg" alt="" loading="lazy" style="width:100%;border-radius:8px;object-fit:cover;" /></div><div style="flex:1;"><h3>Us</h3><p>hi</p></div></div>
        </section>`;
    const actual = await renderBlock(
      makeBlock("gl2", "gallery", {
        layout: "split",
        imageUrl: "https://s.jpg",
        heading: "Us",
        body: "hi",
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });
});

describe("render unification — media 3 (photo-split, story-timeline)", () => {
  it("photo-split (left photo, multi-paragraph body) matches the legacy string output", async () => {
    const expectedLegacy = `<section class="block block-photo-split" data-block-id="ps1" data-block-type="photo-split">
        <div style="display:flex;gap:2rem;align-items:center;flex-wrap:wrap;"><div class="ps-photo" style="flex-shrink:0;">
             <img src="https://p.jpg" alt="Photo" loading="lazy"
               style="width:auto;height:auto;max-width:100%;object-fit:cover;object-position:center;border-radius:8px;" />
           </div><div class="ps-content" style="flex:1;min-width:200px;"><div class="ps-comp-text"><h3 style="margin:0 0 0.6rem">Us</h3><p style="margin:0;line-height:1.75">para1</p><p style="margin:0;line-height:1.75">para2</p></div></div></div>
      </section>`;
    const actual = await renderBlock(
      makeBlock("ps1", "photo-split", {
        imageUrl: "https://p.jpg",
        heading: "Us",
        body: "para1\n\npara2",
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("photo-split (right photo, offset margin, content first) matches the legacy string output", async () => {
    const expectedLegacy = `<section class="block block-photo-split" data-block-id="ps2" data-block-type="photo-split">
        <div style="display:flex;gap:2rem;align-items:center;flex-wrap:wrap;"><div class="ps-content" style="flex:1;min-width:200px;"><div class="ps-comp-text"><h3 style="margin:0 0 0.6rem">H</h3></div></div><div class="ps-photo" style="flex-shrink:0;margin-right:15px;">
             <img src="https://q.jpg" alt="Photo" loading="lazy"
               style="width:auto;height:auto;max-width:100%;object-fit:cover;object-position:center;border-radius:8px;" />
           </div></div>
      </section>`;
    const actual = await renderBlock(
      makeBlock("ps2", "photo-split", {
        photo: { url: "https://q.jpg", offsetX: 15 },
        photoSide: "right",
        heading: "H",
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("story-timeline (one event) matches the legacy string output", async () => {
    const expectedLegacy = `
        <section class="block block-story-timeline" aria-label="Our Story" data-block-id="st1" data-block-type="story-timeline">
          <h2 class="section-heading">Our Story</h2><div class="section-rule" aria-hidden="true"></div>
          <div class="story-timeline" style="position:relative;max-width:600px;margin:0 auto;">
                <div style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:var(--site-border,#e0dbd4);transform:translateX(-50%);" aria-hidden="true"></div>
                <div style="display:flex;justify-content:flex-start;margin-bottom:2rem;position:relative;">
                    <div style="position:absolute;left:50%;top:0.75rem;width:12px;height:12px;background:var(--site-accent);border-radius:50%;transform:translateX(-50%);z-index:1;" aria-hidden="true"></div>
                    <div style="width:44%;background:#fff;border:1px solid var(--site-border,#e0dbd4);border-radius:8px;padding:0.875rem 1rem;">
                      <img src="https://s.jpg" alt="" loading="lazy" style="width:100%;border-radius:4px;margin-bottom:0.5rem;object-fit:cover;max-height:120px;" />
                      <p style="font-size:0.75rem;color:var(--site-accent);font-weight:600;margin:0 0 0.25rem;text-transform:uppercase;letter-spacing:0.05em;">2020</p>
                      <h4 style="margin:0 0 0.25rem;font-size:0.95rem;">Met</h4>
                      <p style="margin:0;font-size:0.85rem;color:#6b6560;">At a party</p>
                    </div>
                  </div>
              </div>
        </section>`;
    const actual = await renderBlock(
      makeBlock("st1", "story-timeline", {
        heading: "Our Story",
        events: [
          {
            date: "2020",
            title: "Met",
            description: "At a party",
            imageUrl: "https://s.jpg",
          },
        ],
      }),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });

  it("story-timeline (empty) renders the placeholder", async () => {
    const expectedLegacy = `
        <section class="block block-story-timeline" aria-label="Our Story" data-block-id="st2" data-block-type="story-timeline">
          <h2 class="section-heading">Our Story</h2><div class="section-rule" aria-hidden="true"></div>
          <p class="placeholder-text">Timeline events will appear here once added.</p>
        </section>`;
    const actual = await renderBlock(
      makeBlock("st2", "story-timeline", {}),
      settings,
    );
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedLegacy));
  });
});

describe("render unification — forms (delegated wiring)", () => {
  // Forms intentionally change: the inline onsubmit is replaced by data-* attrs;
  // scripts.ts attaches the submit handler by delegation. Parity is against the
  // intended new markup (same fields/ids), and we assert onsubmit is gone.
  it("rsvp emits data-* wiring and the full form (no inline onsubmit)", async () => {
    const expectedNew = `
        <section class="block block-rsvp" aria-label="RSVP" data-block-id="rv1" data-block-type="rsvp">
          <h2 class="section-heading">RSVP</h2>
          <div class="section-rule" aria-hidden="true"></div>
          <form class="rsvp-form" id="rsvp-form-rv1" aria-label="RSVP form" data-rsvp-slug="test-slug" data-rsvp-msg="rsvp-msg-rv1">
            <div class="form-group">
              <label class="form-label" for="rsvp-fn-rv1">First Name</label>
              <input class="form-input" id="rsvp-fn-rv1" name="firstName" type="text" placeholder="First name" autocomplete="given-name" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="rsvp-ln-rv1">Last Name</label>
              <input class="form-input" id="rsvp-ln-rv1" name="lastName" type="text" placeholder="Last name" autocomplete="family-name" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="rsvp-email-rv1">Email <span style="font-size:0.8em;color:#9b8e85;font-weight:400;">(optional — for confirmation)</span></label>
              <input class="form-input" id="rsvp-email-rv1" name="email" type="email" placeholder="your@email.com" autocomplete="email" />
            </div>
            <div class="form-group">
              <label class="form-label">Will you attend?</label>
              <div class="radio-group" role="radiogroup" aria-label="Attendance">
                <label class="radio-label">
                  <input type="radio" name="attending" value="yes" required /> Joyfully accepts</label>
                <label class="radio-label">
                  <input type="radio" name="attending" value="no" /> Regretfully declines</label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="rsvp-notes-rv1">Notes or Dietary Restrictions</label>
              <textarea class="form-input form-textarea" id="rsvp-notes-rv1" name="notes" placeholder="Optional"></textarea>
            </div>
            <button class="rsvp-submit" type="submit" style="background:var(--site-accent)">Send RSVP</button>
          </form>
          <div id="rsvp-msg-rv1" role="alert" aria-live="polite" style="display:none;margin-top:1.25rem;text-align:center;font-size:0.9375rem;padding:0.875rem 1rem;border-radius:6px;"></div>
        </section>`;
    const actual = await renderBlock(
      makeBlock("rv1", "rsvp", {}),
      settings,
      undefined,
      "test-slug",
    );
    expect(actual).not.toContain("onsubmit");
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedNew));
  });

  it("rsvp-form adds subheading + heading title and the data-* wiring", async () => {
    const actual = await renderBlock(
      makeBlock("rf1", "rsvp-form", {
        heading: "Join Us",
        subheading: "Please reply",
      }),
      settings,
      undefined,
      "test-slug",
    );
    expect(actual).not.toContain("onsubmit");
    expect(actual).toContain('<h2 class="section-heading">Join Us</h2>');
    expect(actual).toContain("Please reply");
    expect(actual).toContain('data-rsvp-slug="test-slug"');
    expect(actual).toContain('data-rsvp-msg="rsvp-msg-rf1"');
    expect(actual).toContain('name="firstName"');
    expect(actual).toContain('name="attending"');
  });

  it("guest-book emits data-* wiring and the full form (no inline onsubmit)", async () => {
    const expectedNew = `
        <section class="block block-guest-book" aria-label="Guest Book" data-block-id="gb1" data-block-type="guest-book" style="max-width:600px;margin:0 auto;">
          <h2 class="section-heading">Guest Book</h2><div class="section-rule" aria-hidden="true"></div>
          <form class="rsvp-form" id="gb-form-gb1" data-gb-site="s1" data-gb-list="gb-list-gb1">
            <div class="form-group">
              <label class="form-label" for="gb-name-gb1">Your Name</label>
              <input class="form-input" id="gb-name-gb1" name="name" type="text" placeholder="Your name" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="gb-msg-gb1">Message</label>
              <textarea class="form-input form-textarea" id="gb-msg-gb1" name="message" placeholder="Leave a message for the happy couple…" required></textarea>
            </div>
            <button class="rsvp-submit" type="submit" style="background:var(--site-accent)">Sign the book</button>
          </form>
          <div id="gb-list-gb1" style="margin-top:1.5rem;display:flex;flex-direction:column;gap:0.75rem;"></div>
        </section>`;
    const actual = await renderBlock(
      makeBlock("gb1", "guest-book", {}),
      settings,
    );
    expect(actual).not.toContain("onsubmit");
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expectedNew));
  });
});

// Cross-checks for blockContainerStyle (the structured container contract that
// replaced the inline bsAttr string). Exercised through home-hero, which applies
// the container style to its <section>. Covers the paths the earlier styled case
// did not: border, blockHeight, padding, and the blockHeight+padding combo.
describe("render unification — container style contract", () => {
  it("border", async () => {
    const actual = await renderBlock(
      makeBlock("cs1", "home-hero", { borderColor: "#ccc" }),
      settings,
    );
    expect(actual).toContain('style="border:1px solid #ccc"');
  });

  it("hideBorder suppresses the border", async () => {
    const actual = await renderBlock(
      makeBlock("cs2", "home-hero", { borderColor: "#ccc", hideBorder: true }),
      settings,
    );
    expect(actual).not.toContain("border:1px solid");
  });

  it("blockHeight (no padding) zeroes top/bottom for the flex layout", async () => {
    const actual = await renderBlock(
      makeBlock("cs3", "home-hero", { blockHeight: 300 }),
      settings,
    );
    expect(actual).toContain(
      'style="height:300px;padding-top:0;padding-bottom:0;display:flex;flex-direction:column;align-items:stretch"',
    );
    expect(actual).toContain('data-bh="300"');
  });

  it("padding object", async () => {
    const actual = await renderBlock(
      makeBlock("cs4", "home-hero", {
        padding: { top: 10, right: 20, bottom: 30, left: 40 },
      }),
      settings,
    );
    expect(actual).toContain(
      'style="padding:0;padding-top:10px;padding-right:20px;padding-bottom:30px;padding-left:40px"',
    );
  });

  it("blockHeight + padding: the padding object's top/bottom win (regression guard)", async () => {
    const actual = await renderBlock(
      makeBlock("cs5", "home-hero", {
        blockHeight: 300,
        padding: { top: 10, right: 20, bottom: 30, left: 40 },
      }),
      settings,
    );
    // padding:0 comes before the longhands, so the custom top/bottom survive.
    expect(actual).toContain(
      'style="height:300px;display:flex;flex-direction:column;align-items:stretch;padding:0;padding-top:10px;padding-right:20px;padding-bottom:30px;padding-left:40px"',
    );
    expect(actual).toContain('data-bh="300"');
  });
});
