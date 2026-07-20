import {
  type ParsedBlock,
  type SiteSettingRow,
  type BlockTransMap,
} from "./types";
import {
  escHtml,
  nl2br,
  safeUrl,
  placeholder,
  mediaPlaceholder,
} from "./helpers";
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

function renderCountdown({
  block,
  settings,
  cfg,
  accent,
  bsAttr,
}: RenderContext): string {
  const targetDate = settings?.eventDate ?? "";
  const label = (cfg.label as string | undefined) ?? "Until we say I do";
  const showRsvp = !!cfg.showRsvpButton;
  const rsvpText = escHtml(String(cfg.rsvpButtonText ?? "RSVP Now"));
  const rsvpBg = escHtml(String(cfg.rsvpButtonColor ?? accent));
  const rsvpFg = escHtml(String(cfg.rsvpButtonTextColor ?? "#fff"));
  const rsvpBorder = cfg.rsvpButtonBorderColor
    ? `border:2px solid ${escHtml(String(cfg.rsvpButtonBorderColor))};`
    : "";
  return `
    <section class="block block-countdown"${bsAttr} aria-label="Countdown" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
      <p class="countdown-label">${escHtml(label)}</p>
      ${
        targetDate
          ? `<div class="countdown-units" data-cd-clock data-date="${escHtml(targetDate)}" data-block-id="${escHtml(block.id)}">
             <div class="countdown-unit"><span class="countdown-num" id="cd-days-${escHtml(block.id)}">--</span><span class="countdown-unit-label">Days</span></div>
             <div class="countdown-unit"><span class="countdown-num" id="cd-hours-${escHtml(block.id)}">--</span><span class="countdown-unit-label">Hours</span></div>
             <div class="countdown-unit"><span class="countdown-num" id="cd-mins-${escHtml(block.id)}">--</span><span class="countdown-unit-label">Minutes</span></div>
             <div class="countdown-unit"><span class="countdown-num" id="cd-secs-${escHtml(block.id)}">--</span><span class="countdown-unit-label">Seconds</span></div>
           </div>`
          : placeholder(
              "Set an event date in Site Settings to show the countdown.",
            )
      }
      <div class="rsvp-wrap" style="text-align:center;margin-top:2rem;${showRsvp ? "" : "display:none;"}">
        <a href="#rsvp" class="rsvp-submit" style="background:${rsvpBg};color:${rsvpFg};${rsvpBorder}text-decoration:none;display:inline-block">${rsvpText}</a>
      </div>
    </section>`;
}

function renderSchedule({
  block,
  cfg,
  bsAttr,
  pageContent,
}: RenderContext): string {
  const cfgEvents = Array.isArray(cfg.events)
    ? (cfg.events as Array<{
        name?: string;
        date?: string;
        time?: string;
        location?: string;
        description?: string;
        dressCode?: string;
        icon?: string;
      }>)
    : [];
  const legacyEvents = Array.isArray(pageContent?.events)
    ? (pageContent.events as Array<{
        name?: string;
        date?: string;
        time?: string;
        location?: string;
        description?: string;
      }>)
    : [];
  const events = cfgEvents.length > 0 ? cfgEvents : legacyEvents;
  return `
    <section class="block block-schedule"${bsAttr} aria-label="Schedule" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
      <h2 class="section-heading">The Day</h2>
      <div class="section-rule" aria-hidden="true"></div>
      ${
        events.length > 0
          ? `<ol class="timeline">
             ${events
               .map(
                 (ev) => `
               <li class="timeline-item">
                 ${ev.time ? `<span class="timeline-time">${escHtml(ev.time)}</span>` : ""}
                 <div class="timeline-content">
                   ${ev.name ? `<strong>${escHtml(ev.name)}</strong>` : ""}
                   ${ev.date ? `<p style="font-size:0.85em;color:var(--site-muted);margin:0.2rem 0 0;">${escHtml(ev.date)}</p>` : ""}
                   ${ev.location ? `<p style="font-size:0.85em;color:var(--site-muted);margin:0.2rem 0 0;">📍 ${escHtml(ev.location)}</p>` : ""}
                   ${ev.description ? `<p>${escHtml(ev.description)}</p>` : ""}
                 </div>
               </li>`,
               )
               .join("")}
           </ol>`
          : placeholder(
              "The wedding day schedule will appear here once added in the Content tab.",
            )
      }
    </section>`;
}

function renderFaq({ block, cfg, bsAttr, pageContent }: RenderContext): string {
  const cfgItems = Array.isArray(cfg.items)
    ? (cfg.items as Array<{ question?: string; answer?: string }>)
    : [];
  const legacyItems = Array.isArray(pageContent?.questions)
    ? (pageContent.questions as Array<{ q?: string; a?: string }>)
    : [];
  const questions =
    cfgItems.length > 0
      ? cfgItems.map((item) => ({ q: item.question, a: item.answer }))
      : legacyItems;
  return `
    <section class="block block-faq"${bsAttr} aria-label="Frequently asked questions" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
      <h2 class="section-heading">Questions &amp; Answers</h2>
      <div class="section-rule" aria-hidden="true"></div>
      ${
        questions.length > 0
          ? `<dl class="faq-list">
             ${questions
               .map(
                 (item) =>
                   `${item.q ? `<dt class="faq-question">${escHtml(item.q)}</dt>` : ""}${item.a ? `<dd class="faq-answer">${escHtml(item.a)}</dd>` : ""}`,
               )
               .join("")}
           </dl>`
          : placeholder(
              "Frequently asked questions will appear here once added in the Content tab.",
            )
      }
    </section>`;
}

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

function renderImages({ block, cfg, bsAttr }: RenderContext): string {
  const urls = cfg.urls as string[] | undefined;
  const imageSlot = cfg.imageSlot as string | undefined;
  const focusX = escHtml(String(cfg.imageFocusX ?? "center"));
  const focusY = escHtml(String(cfg.imageFocusY ?? "center"));
  const objPos = `${focusX} ${focusY}`;
  const phRaw = Number(cfg.photoHeight);
  const photoH = phRaw > 0 ? `${phRaw}px` : null;
  const pwRaw = Number(cfg.photoWidth);
  const photoW = pwRaw > 0 ? `${pwRaw}px` : null;
  const photoR = escHtml(String(cfg.photoRadius ?? "8px"));
  const photoBW = String(cfg.photoBorder ?? "0");
  const photoBColor = escHtml(String(cfg.photoBorderColor ?? "#e0dbd4"));
  const imgStyle = [
    `object-position:${objPos}`,
    `border-radius:${photoR}`,
    photoBW !== "0" ? `border:${escHtml(photoBW)} solid ${photoBColor}` : "",
    photoH ? `height:${photoH}` : "",
    photoW ? `width:${photoW}` : "",
  ]
    .filter(Boolean)
    .join(";");
  const offsetXRaw = Number(cfg.galleryOffsetX ?? 0);
  const layout = String(cfg.layout ?? "grid-3");
  const wrapperStyleParts: string[] = [];
  if (offsetXRaw !== 0)
    wrapperStyleParts.push(`transform:translateX(${offsetXRaw}px)`);
  switch (layout) {
    case "grid-2":
      wrapperStyleParts.push(
        "display:grid",
        "grid-template-columns:repeat(2,1fr)",
        "gap:0.75rem",
      );
      break;
    case "masonry":
      wrapperStyleParts.push("columns:2", "column-gap:0.75rem");
      break;
    case "filmstrip":
      wrapperStyleParts.push(
        "display:flex",
        "overflow-x:auto",
        "gap:0.75rem",
        "scroll-snap-type:x mandatory",
        "-webkit-overflow-scrolling:touch",
        "padding-bottom:0.5rem",
      );
      break;
    case "full-bleed":
      wrapperStyleParts.push(
        "display:grid",
        "grid-template-columns:1fr",
        "gap:0.5rem",
      );
      break;
    case "featured-grid":
      wrapperStyleParts.push(
        "display:grid",
        "grid-template-columns:2fr 1fr",
        "gap:0.75rem",
      );
      break;
    // grid-3: rely on .image-grid CSS default
  }
  const wrapperStyle = wrapperStyleParts.join(";");
  const getImgExtraStyle = (idx: number): string => {
    if (layout === "masonry") return ";break-inside:avoid;aspect-ratio:auto";
    if (layout === "filmstrip")
      return ";height:220px;width:auto;max-width:none;flex-shrink:0;scroll-snap-align:start";
    if (layout === "featured-grid" && idx === 0 && (urls?.length ?? 0) > 1)
      return ";grid-row:span 2;height:100%";
    if (layout === "full-bleed") return ";width:100%;height:auto";
    return "";
  };
  return `
        <section class="block block-images"${bsAttr} aria-label="Photo gallery" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
          ${
            urls && urls.length > 0
              ? `<div class="image-grid"${wrapperStyle ? ` style="${wrapperStyle}"` : ""}>
                   ${urls.map((u, i) => `<img src="${escHtml(u)}" alt="Wedding photo ${i + 1}" loading="lazy" width="800" height="600" class="gallery-img" style="${imgStyle}${getImgExtraStyle(i)}" />`).join("")}
                 </div>`
              : placeholder(
                  imageSlot
                    ? `Photos for "${escHtml(imageSlot)}" will appear here.`
                    : "Photos will appear here once uploaded.",
                )
          }
        </section>`;
}

function renderVideo({ block, settings, cfg }: RenderContext): string {
  const url = cfg.url as string | undefined;
  const vimeoId = cfg.vimeoId as string | undefined;
  const height = (cfg.height as string | undefined) ?? "100dvh";
  const showCountdown = !!cfg.showCountdown;
  const cdXRaw = Number(cfg.countdownX ?? 0);
  const cdX = isFinite(cdXRaw) ? cdXRaw : 0;
  const cdYRaw = Number(cfg.countdownY ?? 120);
  const cdY = isFinite(cdYRaw) ? cdYRaw : 120;
  const targetDate = settings?.eventDate ?? "";

  const overlayHtml =
    showCountdown && targetDate
      ? `<div class="video-cd-overlay" style="bottom:${cdY}px;transform:translateX(calc(-50% + ${cdX}px));" data-cd-clock data-date="${escHtml(targetDate)}" data-block-id="${escHtml(block.id)}-overlay">
             <div class="countdown-units">
               <div class="countdown-unit"><span class="countdown-num" id="cd-days-${escHtml(block.id)}-overlay">--</span><span class="countdown-unit-label">Days</span></div>
               <div class="countdown-unit"><span class="countdown-num" id="cd-hours-${escHtml(block.id)}-overlay">--</span><span class="countdown-unit-label">Hours</span></div>
               <div class="countdown-unit"><span class="countdown-num" id="cd-mins-${escHtml(block.id)}-overlay">--</span><span class="countdown-unit-label">Minutes</span></div>
               <div class="countdown-unit"><span class="countdown-num" id="cd-secs-${escHtml(block.id)}-overlay">--</span><span class="countdown-unit-label">Seconds</span></div>
             </div>
           </div>`
      : "";

  if (vimeoId) {
    return `
        <section class="block block-video" aria-label="Video" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}"
          style="position:relative;width:100%;height:${escHtml(height)};overflow:hidden;background:#000;">
          <iframe
            src="https://player.vimeo.com/video/${escHtml(vimeoId)}?autoplay=1&muted=1&loop=1&background=1"
            style="position:absolute;top:50%;left:50%;width:177.78vh;min-width:100%;min-height:100%;height:56.25vw;transform:translate(-50%,-50%);border:0;"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen
            title="Wedding video"
          ></iframe>
          ${overlayHtml}
        </section>`;
  }
  return `
        <section class="block block-video" aria-label="Video" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}" style="position:relative;">
          ${url ? `<video src="${escHtml(safeUrl(url))}" controls class="media-element" aria-label="Wedding video"></video>` : mediaPlaceholder("Video")}
          ${overlayHtml}
        </section>`;
}

function renderTravelSection({
  block,
  cfg,
  bsAttr,
  pageContent,
}: RenderContext): string {
  const title = (cfg.title as string | undefined) ?? "Getting There";
  const cfgItems = Array.isArray(cfg.items)
    ? (cfg.items as Array<{
        heading?: string;
        body?: string;
        linkLabel?: string;
        linkUrl?: string;
      }>)
    : [];
  const legacyItems = Array.isArray(pageContent?.travelItems)
    ? (pageContent.travelItems as Array<{
        heading?: string;
        body?: string;
        linkLabel?: string;
        linkUrl?: string;
      }>)
    : [];
  const travelItems = cfgItems.length > 0 ? cfgItems : legacyItems;
  return `
    <section class="block block-travel"${bsAttr} aria-label="Travel information" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
      <h2 class="section-heading">${escHtml(title)}</h2>
      <div class="section-rule" aria-hidden="true"></div>
      ${
        travelItems.length > 0
          ? travelItems
              .map(
                (item) => `
            <div style="margin-bottom:1.5rem;">
              ${item.heading ? `<h3 style="font-size:1.05rem;margin:0 0 0.4rem;">${escHtml(item.heading)}</h3>` : ""}
              ${item.body ? `<p style="margin:0 0 0.4rem;line-height:1.7;">${nl2br(item.body)}</p>` : ""}
              ${
                item.linkUrl && item.linkLabel
                  ? `<a href="${escHtml(safeUrl(item.linkUrl))}" target="_blank" rel="noopener noreferrer" style="color:var(--site-accent)">${escHtml(item.linkLabel)}</a>`
                  : ""
              }
            </div>`,
              )
              .join("")
          : placeholder(
              "Travel details will appear here once added in the Content tab.",
            )
      }
    </section>`;
}

function renderTravel({ block, cfg, bsAttr }: RenderContext): string {
  const title = (cfg.title as string | undefined) ?? "Getting There";
  const travelItems = Array.isArray(cfg.items)
    ? (cfg.items as Array<{
        heading?: string;
        body?: string;
        linkLabel?: string;
        linkUrl?: string;
      }>)
    : [];
  return `
    <section class="block block-travel"${bsAttr} aria-label="Travel information" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
      <h2 class="section-heading">${escHtml(title)}</h2>
      <div class="section-rule" aria-hidden="true"></div>
      ${
        travelItems.length > 0
          ? travelItems
              .map(
                (item) => `
            <div style="margin-bottom:1.5rem;">
              ${item.heading ? `<h3 style="font-size:1.05rem;margin:0 0 0.4rem;">${escHtml(item.heading)}</h3>` : ""}
              ${item.body ? `<p style="margin:0 0 0.4rem;line-height:1.7;">${nl2br(item.body)}</p>` : ""}
              ${
                item.linkUrl && item.linkLabel
                  ? `<a href="${escHtml(safeUrl(item.linkUrl))}" target="_blank" rel="noopener noreferrer" style="color:var(--site-accent)">${escHtml(item.linkLabel)}</a>`
                  : ""
              }
            </div>`,
              )
              .join("")
          : placeholder(
              "Travel details will appear here once added in the Content tab.",
            )
      }
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

function renderMultiText({
  block,
  cfg,
  bsAttr,
  pageContent,
}: RenderContext): string {
  const mode = String(cfg.mode ?? "text");
  const sectionTitle = escHtml(String(cfg.title ?? ""));

  if (mode === "schedule") {
    const events = Array.isArray(pageContent?.events)
      ? (pageContent.events as Array<{
          name?: string;
          date?: string;
          time?: string;
          location?: string;
          description?: string;
        }>)
      : [];
    return `
  <section class="block block-schedule"${bsAttr} aria-label="Schedule" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
    <h2 class="section-heading">${sectionTitle || "The Day"}</h2>
    <div class="section-rule" aria-hidden="true"></div>
    ${
      events.length > 0
        ? `<ol class="timeline">
           ${events
             .map(
               (ev) => `
             <li class="timeline-item">
               ${ev.time ? `<span class="timeline-time">${escHtml(ev.time)}</span>` : ""}
               <div class="timeline-content">
                 ${ev.name ? `<strong>${escHtml(ev.name)}</strong>` : ""}
                 ${ev.date ? `<p style="font-size:0.85em;color:var(--site-muted);margin:0.2rem 0 0;">${escHtml(ev.date)}</p>` : ""}
                 ${ev.location ? `<p style="font-size:0.85em;color:var(--site-muted);margin:0.2rem 0 0;">📍 ${escHtml(ev.location)}</p>` : ""}
                 ${ev.description ? `<p>${escHtml(ev.description)}</p>` : ""}
               </div>
             </li>`,
             )
             .join("")}
         </ol>`
        : placeholder(
            "The schedule will appear here once added in the Content tab.",
          )
    }
  </section>`;
  }

  if (mode === "faq") {
    const questions = Array.isArray(pageContent?.questions)
      ? (pageContent.questions as Array<{ q?: string; a?: string }>)
      : [];
    return `
  <section class="block block-faq"${bsAttr} aria-label="Frequently asked questions" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
    <h2 class="section-heading">${sectionTitle || "Questions &amp; Answers"}</h2>
    <div class="section-rule" aria-hidden="true"></div>
    ${
      questions.length > 0
        ? `<dl class="faq-list">
           ${questions
             .map(
               (item) =>
                 `${item.q ? `<dt class="faq-question">${escHtml(item.q)}</dt>` : ""}${item.a ? `<dd class="faq-answer">${escHtml(item.a)}</dd>` : ""}`,
             )
             .join("")}
         </dl>`
        : placeholder(
            "Q&A items will appear here once added in the Content tab.",
          )
    }
  </section>`;
  }

  if (mode === "tidbits") {
    const items = Array.isArray(pageContent?.tidbits)
      ? (pageContent.tidbits as Array<{
          icon?: string;
          title?: string;
          body?: string;
        }>)
      : [];
    const cols = String(cfg.columns ?? "auto");
    const colsCss =
      cols === "2"
        ? "repeat(2,1fr)"
        : cols === "3"
          ? "repeat(3,1fr)"
          : "repeat(auto-fill,minmax(200px,1fr))";
    const cardStyle = String(cfg.cardStyle ?? "card");
    const cardCss =
      cardStyle === "flat"
        ? "padding:1.25rem;text-align:center;color:var(--block-text,var(--site-text));"
        : cardStyle === "bordered"
          ? "border:1px solid var(--site-border);border-radius:12px;padding:1.25rem;text-align:center;color:var(--block-text,var(--site-text));"
          : "background:#fff;border:1px solid var(--site-border);border-radius:12px;padding:1.25rem;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.05);color:var(--block-text,var(--text));";
    return `
  <section class="block block-tidbits"${bsAttr} aria-label="Fun facts" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
    ${sectionTitle ? `<h2 class="section-heading">${sectionTitle}</h2><div class="section-rule" aria-hidden="true"></div>` : cfg.showTitle !== false ? `<h2 class="section-heading">Fun Facts</h2><div class="section-rule" aria-hidden="true"></div>` : ""}
    ${
      items.length > 0
        ? `<div style="display:grid;grid-template-columns:${colsCss};gap:1rem;">
           ${items
             .map(
               (it) => `<div style="${cardCss}">
             ${it.icon ? `<div style="font-size:2rem;margin-bottom:0.5rem;">${escHtml(it.icon)}</div>` : ""}
             ${it.title ? `<strong style="display:block;margin-bottom:0.375rem;">${escHtml(it.title)}</strong>` : ""}
             ${it.body ? `<p style="color:var(--block-text,var(--site-muted));font-size:0.9375rem;margin:0;">${escHtml(it.body)}</p>` : ""}
           </div>`,
             )
             .join("")}
         </div>`
        : placeholder(
            "Fun facts will appear here once added in the Content tab.",
          )
    }
  </section>`;
  }

  if (mode === "travel") {
    const travelItems = Array.isArray(pageContent?.travelItems)
      ? (pageContent.travelItems as Array<{
          heading?: string;
          body?: string;
          linkLabel?: string;
          linkUrl?: string;
        }>)
      : [];
    return `
  <section class="block block-travel"${bsAttr} aria-label="Travel information" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
    <h2 class="section-heading">${sectionTitle || "Getting There"}</h2>
    <div class="section-rule" aria-hidden="true"></div>
    ${
      travelItems.length > 0
        ? travelItems
            .map(
              (item) => `
          <div style="margin-bottom:1.5rem;">
            ${item.heading ? `<h3 style="font-size:1.05rem;margin:0 0 0.4rem;">${escHtml(item.heading)}</h3>` : ""}
            ${item.body ? `<p style="margin:0 0 0.4rem;line-height:1.7;">${escHtml(item.body)}</p>` : ""}
            ${
              item.linkUrl && item.linkLabel
                ? `<a href="${escHtml(safeUrl(item.linkUrl))}" target="_blank" rel="noopener noreferrer" style="color:var(--site-accent)">${escHtml(item.linkLabel)}</a>`
                : ""
            }
          </div>`,
            )
            .join("")
        : placeholder(
            "Travel details will appear here once added in the Content tab.",
          )
    }
  </section>`;
  }

  // Default: text mode
  const contentKey = cfg.contentKey as string | undefined;
  const hSize = cfg.headingSize as string | undefined;
  const hAlign = cfg.headingAlign as string | undefined;
  const hStyle = [
    hSize ? `font-size:${escHtml(hSize)}` : "",
    hAlign ? `text-align:${escHtml(hAlign)}` : "",
    cfg.headingBold ? "font-weight:700" : "",
    cfg.headingItalic ? "font-style:italic" : "",
    cfg.headingUnderline ? "text-decoration:underline" : "",
  ]
    .filter(Boolean)
    .join(";");
  const bSize = cfg.bodySize as string | undefined;
  const bAlign = cfg.bodyAlign as string | undefined;
  const bStyle = [
    bSize ? `font-size:${escHtml(bSize)}` : "",
    bAlign ? `text-align:${escHtml(bAlign)}` : "",
    cfg.bodyBold ? "font-weight:700" : "",
    cfg.bodyItalic ? "font-style:italic" : "",
    cfg.bodyUnderline ? "text-decoration:underline" : "",
  ]
    .filter(Boolean)
    .join(";");
  // Support textItems array; fall back to single heading/body for backward compat
  const textItemsArr = Array.isArray(cfg.textItems)
    ? (cfg.textItems as Array<{ heading?: string; body?: string }>)
    : null;
  const singleHeading = contentKey
    ? String(
        pageContent?.[`${contentKey}_heading`] ?? cfg.heading ?? sectionTitle,
      )
    : String(cfg.heading ?? sectionTitle ?? "");
  const singleBody = contentKey
    ? String(pageContent?.[contentKey] ?? cfg.body ?? "")
    : String(cfg.body ?? cfg.text ?? cfg.content ?? "");
  const itemsToRender = textItemsArr ?? [
    { heading: singleHeading, body: singleBody },
  ];
  const langHeadAttr =
    !textItemsArr && contentKey
      ? ` data-lang-field="${escHtml(contentKey)}_heading"`
      : "";
  const langBodyAttr =
    !textItemsArr && contentKey
      ? ` data-lang-field="${escHtml(contentKey)}"`
      : "";
  return `
    <section class="block block-text"${bsAttr} data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
      ${itemsToRender
        .map((item, idx) => {
          const h = escHtml(String(item.heading ?? ""));
          const b = nl2br(String(item.body ?? ""));
          const itemDivStyle = [idx > 0 ? "margin-top:1.5rem" : "", bStyle]
            .filter(Boolean)
            .join(";");
          return `${h ? `<h2 class="section-heading"${hStyle ? ` style="${hStyle}"` : ""}${langHeadAttr}>${h}</h2>${idx === 0 ? `<div class="section-rule" aria-hidden="true"></div>` : ""}` : ""}
      <div class="text-body"${itemDivStyle ? ` style="${itemDivStyle}"` : ""}>${b ? `<p${langBodyAttr}>${b}</p>` : idx === 0 ? placeholder("Text will appear here once added.") : ""}</div>`;
        })
        .join("")}
    </section>`;
}

function renderMediaVideo({ block, cfg, bsAttr }: RenderContext): string {
  const url = cfg.url as string | undefined;
  const vimeoId = cfg.vimeoId as string | undefined;
  const height = (cfg.height as string | undefined) ?? "100dvh";
  const provider = cfg.provider as string | undefined;
  const isYoutube =
    provider === "youtube" ||
    (provider !== "direct" &&
      url &&
      (url.includes("youtube.com") || url.includes("youtu.be")));
  const resolvedVimeoId =
    vimeoId ??
    (provider === "vimeo" ||
    (provider !== "direct" && url?.includes("vimeo.com"))
      ? url?.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1]
      : undefined);

  if (resolvedVimeoId) {
    return `
        <section class="block block-media-video"${bsAttr} aria-label="Video" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}"
          style="position:relative;width:100%;height:${escHtml(height)};overflow:hidden;background:#000;">
          <iframe
            src="https://player.vimeo.com/video/${escHtml(resolvedVimeoId)}?autoplay=1&muted=1&loop=1&background=1"
            style="position:absolute;top:50%;left:50%;width:177.78vh;min-width:100%;min-height:100%;height:56.25vw;transform:translate(-50%,-50%);border:0;"
            allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Video"
          ></iframe>
        </section>`;
  }

  if (isYoutube && url) {
    const ytMatch = url.match(/(?:youtu\.be\/|[?&]v=)([^&\s]+)/);
    const ytId = ytMatch?.[1] ?? "";
    return `
        <section class="block block-media-video"${bsAttr} aria-label="Video" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
          ${
            ytId
              ? `<div class="video-wrap">
                 <iframe src="https://www.youtube-nocookie.com/embed/${escHtml(ytId)}" title="YouTube video" frameborder="0"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="youtube-iframe"></iframe>
               </div>`
              : placeholder("Invalid YouTube URL.")
          }
        </section>`;
  }
  return `
        <section class="block block-media-video"${bsAttr} aria-label="Video" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}" style="position:relative;${url ? `height:${escHtml(height)}` : ""}">
          ${
            url
              ? `<video src="${escHtml(safeUrl(url))}" autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;"></video>`
              : mediaPlaceholder("Video")
          }
        </section>`;
}

function renderGallery({ block, cfg, bsAttr }: RenderContext): string {
  const layout = String(cfg.layout ?? "grid");

  if (layout === "split") {
    const imageUrl = cfg.imageUrl as string | undefined;
    const heading = String(cfg.heading ?? "");
    const body = String(cfg.body ?? "");
    const imageLayout = String(cfg.imageLayout ?? "left");
    const isRight = imageLayout === "right";
    const imgEl = imageUrl
      ? `<div style="flex:1;"><img src="${escHtml(imageUrl)}" alt="" loading="lazy" style="width:100%;border-radius:8px;object-fit:cover;" /></div>`
      : `<div style="flex:1;background:#f5f0eb;border-radius:8px;height:200px;display:flex;align-items:center;justify-content:center;color:#9b8e85;">Photo</div>`;
    const textEl = `<div style="flex:1;">${heading ? `<h3>${escHtml(heading)}</h3>` : ""}${body ? `<p>${nl2br(body)}</p>` : placeholder("Content will appear here.")}</div>`;
    return `
        <section class="block block-gallery"${bsAttr} data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
          <div style="display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap;${isRight ? "flex-direction:row-reverse;" : ""}">${imgEl}${textEl}</div>
        </section>`;
  }

  const urls = Array.isArray(cfg.urls) ? (cfg.urls as string[]) : [];
  const imageSlot = cfg.imageUrl as string | undefined;
  const images = imageSlot ? [imageSlot] : urls;
  return `
        <section class="block block-gallery"${bsAttr} aria-label="Photo gallery" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
          ${
            images.length > 0
              ? `<div class="image-grid" style="display:grid;gap:0.5rem;grid-template-columns:${images.length > 1 ? "1fr 1fr" : "1fr"};">
                 ${images.map((u, i) => `<img src="${escHtml(u)}" alt="Gallery photo ${i + 1}" loading="lazy" style="width:100%;border-radius:8px;object-fit:cover;" />`).join("")}
               </div>`
              : placeholder("Images will appear here once added.")
          }
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
  countdown: renderCountdown,
  schedule: renderSchedule,
  faq: renderFaq,
  rsvp: renderRsvp,
  images: renderImages,
  video: renderVideo,
  youtube: renderYoutubeReact,
  "registry-card": renderRegistryCardReact,
  "hotel-card": renderHotelCardReact,
  "venue-map": renderVenueMapReact,
  tidbits: renderTidbitsReact,
  "fun-facts": renderFunFactsReact,
  "travel-section": renderTravelSection,
  travel: renderTravel,
  spacer: renderSpacerReact,
  "photo-split": renderPhotoSplit,
  "multi-text": renderMultiText,
  "media-video": renderMediaVideo,
  gallery: renderGallery,
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
