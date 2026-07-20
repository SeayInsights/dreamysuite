import {
  type ParsedBlock,
  type SiteSettingRow,
  type BlockTransMap,
} from "./types";
import { escHtml, placeholder } from "./helpers";
import {
  renderHomeHeroReact,
  renderSpacerReact,
  renderYoutubeReact,
  renderVenueMapReact,
  renderRegistryCardReact,
  renderHotelCardReact,
  renderInfoCardReact,
  renderHeaderReact,
  renderTextReact,
  renderTidbitsReact,
  renderFunFactsReact,
  renderMultiTextReact,
  renderScheduleReact,
  renderFaqReact,
  renderTravelSectionReact,
  renderTravelReact,
  renderCountdownReact,
  renderVideoReact,
  renderMediaVideoReact,
  renderImagesReact,
  renderGalleryReact,
} from "./react-renderers";

// ── Block renderers ───────────────────────────────────────────────────────────
//
// Each block type has a standalone renderer keyed in BLOCK_RENDERERS. renderBlock
// computes the shared RenderContext (parsed config, accent, container attrs, the
// translation-aware `cnt` accessor) once and dispatches to the matching renderer.

export interface RenderContext {
  block: ParsedBlock;
  settings: SiteSettingRow | null;
  pageContent?: Record<string, unknown>;
  siteSlug?: string;
  /** Parsed block config (block.config). */
  cfg: Record<string, unknown>;
  /** Resolved site accent color. */
  accent: string;
  /** Inline style/data attributes for the block container. */
  bsAttr: string;
  /** translated value → content-tab data → block config → fallback */
  cnt: (contentKey: string, cfgKey?: string, fallback?: string) => string;
}

type BlockRenderer = (ctx: RenderContext) => string;

function renderRsvp({ block, cfg, bsAttr, siteSlug }: RenderContext): string {
  const formTitle = (cfg.title as string | undefined) ?? "RSVP";
  const slug = siteSlug ?? "";
  const formId = `rsvp-form-${escHtml(block.id)}`;
  const msgId = `rsvp-msg-${escHtml(block.id)}`;
  return `
        <section class="block block-rsvp"${bsAttr} aria-label="RSVP" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
          <h2 class="section-heading">${escHtml(formTitle)}</h2>
          <div class="section-rule" aria-hidden="true"></div>
          <form class="rsvp-form" id="${formId}" aria-label="RSVP form" onsubmit="submitRsvp(event,'${escHtml(slug)}','${formId}','${msgId}')">
            <div class="form-group">
              <label class="form-label" for="rsvp-fn-${escHtml(block.id)}">First Name</label>
              <input class="form-input" id="rsvp-fn-${escHtml(block.id)}" name="firstName" type="text" placeholder="First name" autocomplete="given-name" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="rsvp-ln-${escHtml(block.id)}">Last Name</label>
              <input class="form-input" id="rsvp-ln-${escHtml(block.id)}" name="lastName" type="text" placeholder="Last name" autocomplete="family-name" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="rsvp-email-${escHtml(block.id)}">Email <span style="font-size:0.8em;color:#9b8e85;font-weight:400;">(optional — for confirmation)</span></label>
              <input class="form-input" id="rsvp-email-${escHtml(block.id)}" name="email" type="email" placeholder="your@email.com" autocomplete="email" />
            </div>
            <div class="form-group">
              <label class="form-label">Will you attend?</label>
              <div class="radio-group" role="radiogroup" aria-label="Attendance">
                <label class="radio-label">
                  <input type="radio" name="attending" value="yes" required /> Joyfully accepts
                </label>
                <label class="radio-label">
                  <input type="radio" name="attending" value="no" /> Regretfully declines
                </label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="rsvp-notes-${escHtml(block.id)}">Notes or Dietary Restrictions</label>
              <textarea class="form-input form-textarea" id="rsvp-notes-${escHtml(block.id)}" name="notes" placeholder="Optional"></textarea>
            </div>
            <button class="rsvp-submit" type="submit" style="background:var(--site-accent)">Send RSVP</button>
          </form>
          <div id="${msgId}" role="alert" aria-live="polite" style="display:none;margin-top:1.25rem;text-align:center;font-size:0.9375rem;padding:0.875rem 1rem;border-radius:6px;"></div>
        </section>`;
}

function renderPhotoSplit({ block, cfg, bsAttr }: RenderContext): string {
  const photo = (cfg.photo as Record<string, unknown> | undefined) ?? {};
  const flatImageUrl = cfg.imageUrl as string | undefined;
  const photoUrl = String(flatImageUrl ?? photo.url ?? "");
  const photoSide = String(cfg.photoSide ?? cfg.layout ?? "left");
  const cropVal = escHtml(String(photo.crop ?? "center"));
  const wPx = photo.widthPx ? `${Number(photo.widthPx)}px` : "auto";
  const hPx = photo.heightPx ? `${Number(photo.heightPx)}px` : "auto";
  const offsetXRaw = Number(photo.offsetX ?? 0);
  const marginDir = photoSide === "right" ? "right" : "left";
  const photoContainerStyle = `flex-shrink:0;${offsetXRaw !== 0 ? `margin-${marginDir}:${offsetXRaw}px;` : ""}`;
  const flatHeading = cfg.heading as string | undefined;
  const flatBody =
    (cfg.body as string | undefined) ?? (cfg.text as string | undefined);
  const components =
    (cfg.components as Array<Record<string, unknown>>) ??
    (flatHeading || flatBody
      ? [{ type: "text", heading: flatHeading ?? "", body: flatBody ?? "" }]
      : []);

  const imgEl = photoUrl
    ? `<div class="ps-photo" style="${photoContainerStyle}">
             <img src="${escHtml(photoUrl)}" alt="Photo" loading="lazy"
               style="width:${wPx};height:${hPx};max-width:100%;object-fit:cover;object-position:${cropVal};border-radius:8px;" />
           </div>`
    : "";

  const compsHtml = components
    .map((c) => {
      if (c.type === "text") {
        const hSize = c.headingSize as string | undefined;
        const hAlign = c.headingAlign as string | undefined;
        const hStyleParts = [
          "margin:0 0 0.6rem",
          hSize ? `font-size:${escHtml(hSize)}` : "",
          hAlign ? `text-align:${escHtml(hAlign)}` : "",
          c.headingBold ? "font-weight:700" : "",
          c.headingItalic ? "font-style:italic" : "",
          c.headingUnderline ? "text-decoration:underline" : "",
        ]
          .filter(Boolean)
          .join(";");
        const bSize = c.bodySize as string | undefined;
        const bAlign = c.bodyAlign as string | undefined;
        const bStyleParts = [
          "margin:0;line-height:1.75",
          bSize ? `font-size:${escHtml(bSize)}` : "",
          bAlign ? `text-align:${escHtml(bAlign)}` : "",
          c.bodyBold ? "font-weight:700" : "",
          c.bodyItalic ? "font-style:italic" : "",
          c.bodyUnderline ? "text-decoration:underline" : "",
        ]
          .filter(Boolean)
          .join(";");
        const h = c.heading
          ? `<h3 style="${hStyleParts}">${escHtml(String(c.heading))}</h3>`
          : "";
        const b = c.body
          ? `<p style="${bStyleParts}">${escHtml(String(c.body)).replace(/\n\n/g, `</p><p style="${bStyleParts}">`).replace(/\n/g, "<br>")}</p>`
          : "";
        return `<div class="ps-comp-text">${h}${b}</div>`;
      }
      return "";
    })
    .join("");

  const photoFirst = photoSide !== "right";
  const flex = photoFirst
    ? `${imgEl}<div class="ps-content" style="flex:1;min-width:200px;">${compsHtml}</div>`
    : `<div class="ps-content" style="flex:1;min-width:200px;">${compsHtml}</div>${imgEl}`;

  return `<section class="block block-photo-split"${bsAttr} data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
        <div style="display:flex;gap:2rem;align-items:center;flex-wrap:wrap;">${flex}</div>
      </section>`;
}

function renderRsvpForm({
  block,
  cfg,
  bsAttr,
  siteSlug,
}: RenderContext): string {
  const formTitle =
    (cfg.heading as string | undefined) ??
    (cfg.title as string | undefined) ??
    "RSVP";
  const subheading = (cfg.subheading as string | undefined) ?? "";
  const slug = siteSlug ?? "";
  const formId = `rsvp-form-${escHtml(block.id)}`;
  const msgId = `rsvp-msg-${escHtml(block.id)}`;
  return `
        <section class="block block-rsvp"${bsAttr} aria-label="RSVP" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
          <h2 class="section-heading">${escHtml(formTitle)}</h2>
          <div class="section-rule" aria-hidden="true"></div>
          ${subheading ? `<p style="text-align:center;color:var(--site-muted);margin-bottom:1.5rem;">${escHtml(subheading)}</p>` : ""}
          <form class="rsvp-form" id="${formId}" aria-label="RSVP form" onsubmit="submitRsvp(event,'${escHtml(slug)}','${formId}','${msgId}')">
            <div class="form-group">
              <label class="form-label" for="rsvp-fn-${escHtml(block.id)}">First Name</label>
              <input class="form-input" id="rsvp-fn-${escHtml(block.id)}" name="firstName" type="text" placeholder="First name" autocomplete="given-name" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="rsvp-ln-${escHtml(block.id)}">Last Name</label>
              <input class="form-input" id="rsvp-ln-${escHtml(block.id)}" name="lastName" type="text" placeholder="Last name" autocomplete="family-name" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="rsvp-email-${escHtml(block.id)}">Email <span style="font-size:0.8em;color:#9b8e85;font-weight:400;">(optional — for confirmation)</span></label>
              <input class="form-input" id="rsvp-email-${escHtml(block.id)}" name="email" type="email" placeholder="your@email.com" autocomplete="email" />
            </div>
            <div class="form-group">
              <label class="form-label">Will you attend?</label>
              <div class="radio-group" role="radiogroup" aria-label="Attendance">
                <label class="radio-label">
                  <input type="radio" name="attending" value="yes" required /> Joyfully accepts
                </label>
                <label class="radio-label">
                  <input type="radio" name="attending" value="no" /> Regretfully declines
                </label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="rsvp-notes-${escHtml(block.id)}">Notes or Dietary Restrictions</label>
              <textarea class="form-input form-textarea" id="rsvp-notes-${escHtml(block.id)}" name="notes" placeholder="Optional"></textarea>
            </div>
            <button class="rsvp-submit" type="submit" style="background:var(--site-accent)">Send RSVP</button>
          </form>
          <div id="${msgId}" role="alert" aria-live="polite" style="display:none;margin-top:1.25rem;text-align:center;font-size:0.9375rem;padding:0.875rem 1rem;border-radius:6px;"></div>
        </section>`;
}

function renderStoryTimeline({ block, cfg, bsAttr }: RenderContext): string {
  const heading = String(cfg.heading ?? "Our Story");
  const events = Array.isArray(cfg.events)
    ? (cfg.events as Array<{
        date?: string;
        title?: string;
        description?: string;
        imageUrl?: string;
      }>)
    : [];
  return `
        <section class="block block-story-timeline"${bsAttr} aria-label="Our Story" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
          ${heading ? `<h2 class="section-heading">${escHtml(heading)}</h2><div class="section-rule" aria-hidden="true"></div>` : ""}
          ${
            events.length > 0
              ? `<div class="story-timeline" style="position:relative;max-width:600px;margin:0 auto;">
                <div style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:var(--site-border,#e0dbd4);transform:translateX(-50%);" aria-hidden="true"></div>
                ${events
                  .map((ev, i) => {
                    const isLeft = i % 2 === 0;
                    return `<div style="display:flex;justify-content:${isLeft ? "flex-start" : "flex-end"};margin-bottom:2rem;position:relative;">
                    <div style="position:absolute;left:50%;top:0.75rem;width:12px;height:12px;background:var(--site-accent);border-radius:50%;transform:translateX(-50%);z-index:1;" aria-hidden="true"></div>
                    <div style="width:44%;background:#fff;border:1px solid var(--site-border,#e0dbd4);border-radius:8px;padding:0.875rem 1rem;">
                      ${ev.imageUrl ? `<img src="${escHtml(ev.imageUrl)}" alt="" loading="lazy" style="width:100%;border-radius:4px;margin-bottom:0.5rem;object-fit:cover;max-height:120px;" />` : ""}
                      ${ev.date ? `<p style="font-size:0.75rem;color:var(--site-accent);font-weight:600;margin:0 0 0.25rem;text-transform:uppercase;letter-spacing:0.05em;">${escHtml(ev.date)}</p>` : ""}
                      ${ev.title ? `<h4 style="margin:0 0 0.25rem;font-size:0.95rem;">${escHtml(ev.title)}</h4>` : ""}
                      ${ev.description ? `<p style="margin:0;font-size:0.85rem;color:#6b6560;">${escHtml(ev.description)}</p>` : ""}
                    </div>
                  </div>`;
                  })
                  .join("")}
              </div>`
              : placeholder("Timeline events will appear here once added.")
          }
        </section>`;
}

function renderGuestBook({ block, cfg, bsAttr }: RenderContext): string {
  const heading = String(cfg.heading ?? "Guest Book");
  const placeholderText = String(
    cfg.placeholder ?? "Leave a message for the happy couple…",
  );
  const formId = `gb-form-${escHtml(block.id)}`;
  const listId = `gb-list-${escHtml(block.id)}`;
  return `
        <section class="block block-guest-book"${bsAttr} aria-label="Guest Book" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}"
          style="max-width:600px;margin:0 auto;">
          ${heading ? `<h2 class="section-heading">${escHtml(heading)}</h2><div class="section-rule" aria-hidden="true"></div>` : ""}
          <form class="rsvp-form" id="${formId}" onsubmit="submitGuestBook(event,'${escHtml(block.siteId)}','${formId}','${listId}')">
            <div class="form-group">
              <label class="form-label" for="gb-name-${escHtml(block.id)}">Your Name</label>
              <input class="form-input" id="gb-name-${escHtml(block.id)}" name="name" type="text" placeholder="Your name" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="gb-msg-${escHtml(block.id)}">Message</label>
              <textarea class="form-input form-textarea" id="gb-msg-${escHtml(block.id)}" name="message" placeholder="${escHtml(placeholderText)}" required></textarea>
            </div>
            <button class="rsvp-submit" type="submit" style="background:var(--site-accent)">Sign the book</button>
          </form>
          <div id="${listId}" style="margin-top:1.5rem;display:flex;flex-direction:column;gap:0.75rem;"></div>
        </section>`;
}

function renderUnknown({ block }: RenderContext): string {
  return `<section class="block block-unknown">${placeholder(`This block (${escHtml(block.type)}) is not yet supported.`)}</section>`;
}

/** Registry: block type → renderer. */
const BLOCK_RENDERERS: Record<string, BlockRenderer> = {
  "home-hero": renderHomeHeroReact,
  couple: renderHomeHeroReact,
  header: renderHeaderReact,
  text: renderTextReact,
  countdown: renderCountdownReact,
  schedule: renderScheduleReact,
  faq: renderFaqReact,
  rsvp: renderRsvp,
  images: renderImagesReact,
  video: renderVideoReact,
  youtube: renderYoutubeReact,
  "registry-card": renderRegistryCardReact,
  "hotel-card": renderHotelCardReact,
  "venue-map": renderVenueMapReact,
  tidbits: renderTidbitsReact,
  "fun-facts": renderFunFactsReact,
  "travel-section": renderTravelSectionReact,
  travel: renderTravelReact,
  spacer: renderSpacerReact,
  "photo-split": renderPhotoSplit,
  "multi-text": renderMultiTextReact,
  "media-video": renderMediaVideoReact,
  gallery: renderGalleryReact,
  "info-card": renderInfoCardReact,
  "rsvp-form": renderRsvpForm,
  "story-timeline": renderStoryTimeline,
  "guest-book": renderGuestBook,
};

export function renderBlock(
  block: ParsedBlock,
  settings: SiteSettingRow | null,
  pageContent?: Record<string, unknown>,
  siteSlug?: string,
  blockTransMap?: BlockTransMap,
  renderLang?: string,
  mainLang?: string,
): string {
  const cfg = block.config;
  const accent = settings?.accentColor ?? "#B8921A";
  const _ml = mainLang ?? "en";
  const _rl = renderLang ?? _ml;
  const _bt = blockTransMap?.[block.id]?.[_rl];
  // Helper: get translated value → content tab data → block config → fallback
  const cnt = (contentKey: string, cfgKey?: string, fallback = "") => {
    if (_rl !== _ml && _bt && cfgKey && _bt[cfgKey]) return _bt[cfgKey];
    return String(
      pageContent?.[contentKey] ??
        (cfgKey ? cfg[cfgKey] : undefined) ??
        fallback,
    );
  };

  // Compute inline style for block container — mirrors blockSectionStyle() in the editor
  const _bsParts: string[] = [];
  const _bgCfg = cfg.background as
    | { type?: string; value?: string }
    | null
    | undefined;
  const _bgColor = cfg.backgroundColor as string | undefined;
  if (_bgColor) _bsParts.push(`background:${escHtml(_bgColor)}`);
  else if (_bgCfg?.type === "color" && _bgCfg?.value)
    _bsParts.push(`background:${escHtml(String(_bgCfg.value))}`);
  const _tcCfg = cfg.textColor as string | undefined;
  if (_tcCfg)
    _bsParts.push(
      `color:${escHtml(_tcCfg)}`,
      `--block-text:${escHtml(_tcCfg)}`,
    );
  const _bcCfg = cfg.borderColor as string | undefined;
  if (_bcCfg && !cfg.hideBorder)
    _bsParts.push(`border:1px solid ${escHtml(_bcCfg)}`);
  const _bw =
    typeof cfg.blockWidth === "number" &&
    cfg.blockWidth > 0 &&
    cfg.blockWidth < 100
      ? cfg.blockWidth
      : 0;
  if (_bw) {
    const _mlLeft =
      typeof cfg.blockMarginLeft === "number" ? cfg.blockMarginLeft : 0;
    _bsParts.push(
      `width:${_bw}%`,
      `margin-left:${_mlLeft > 0 ? `${_mlLeft}%` : "0"}`,
      `margin-right:0`,
    );
  }
  const _ox =
    typeof cfg.blockOffsetX === "number" && cfg.blockOffsetX !== 0
      ? cfg.blockOffsetX
      : 0;
  const _oy =
    typeof cfg.blockOffsetY === "number" && cfg.blockOffsetY !== 0
      ? cfg.blockOffsetY
      : 0;
  const _rot =
    typeof cfg.blockRotation === "number" && cfg.blockRotation !== 0
      ? cfg.blockRotation
      : 0;
  const _transforms: string[] = [];
  if (_ox || _oy) _transforms.push(`translate(${_ox}px,${_oy}px)`);
  if (_rot) _transforms.push(`rotate(${_rot}deg)`);
  if (_transforms.length) _bsParts.push(`transform:${_transforms.join(" ")}`);
  const _zi = typeof cfg.blockZIndex === "number" ? cfg.blockZIndex : 0;
  if (_zi) {
    if (!_transforms.length) _bsParts.push(`position:relative`);
    _bsParts.push(`z-index:${_zi}`);
  }
  const _bh =
    typeof cfg.blockHeight === "number" && cfg.blockHeight > 0
      ? cfg.blockHeight
      : 0;
  if (_bh)
    _bsParts.push(
      `height:${_bh}px`,
      `padding-top:0`,
      `padding-bottom:0`,
      `display:flex`,
      `flex-direction:column`,
      `align-items:stretch`,
    );
  const _pad = cfg.padding as Record<string, unknown> | null | undefined;
  if (_pad && typeof _pad === "object" && !Array.isArray(_pad)) {
    _bsParts.push(`padding:0`);
    if (typeof _pad.top === "number")
      _bsParts.push(`padding-top:${_pad.top}px`);
    if (typeof _pad.right === "number")
      _bsParts.push(`padding-right:${_pad.right}px`);
    if (typeof _pad.bottom === "number")
      _bsParts.push(`padding-bottom:${_pad.bottom}px`);
    if (typeof _pad.left === "number")
      _bsParts.push(`padding-left:${_pad.left}px`);
  }
  const _dataAttrs: string[] = [];
  if (_bw) _dataAttrs.push(`data-bw="${_bw}"`);
  const _cfgBml =
    typeof cfg.blockMarginLeft === "number" ? cfg.blockMarginLeft : 0;
  if (_cfgBml > 0) _dataAttrs.push(`data-bml="${_cfgBml}"`);
  if (_ox) _dataAttrs.push(`data-box="${_ox}"`);
  if (_oy) _dataAttrs.push(`data-boy="${_oy}"`);
  if (_bh) _dataAttrs.push(`data-bh="${_bh}"`);
  if (_rot) _dataAttrs.push(`data-brot="${_rot}"`);
  const _allAttrParts = [
    _bsParts.length ? `style="${_bsParts.join(";")}"` : "",
    ..._dataAttrs,
  ].filter(Boolean);
  const bsAttr = _allAttrParts.length ? ` ${_allAttrParts.join(" ")}` : "";

  const ctx: RenderContext = {
    block,
    settings,
    pageContent,
    siteSlug,
    cfg,
    accent,
    bsAttr,
    cnt,
  };
  return (BLOCK_RENDERERS[block.type] ?? renderUnknown)(ctx);
}
