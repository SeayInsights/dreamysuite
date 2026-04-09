/**
 * $slug.tsx — Public wedding/event site renderer
 *
 * Maps /:slug → renders the published site as a standalone HTML document.
 * The loader returns a raw HTML Response so the page is fully self-contained
 * and does not inherit the app shell's CSS or React hydration.
 */
import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/$slug";
import "~/lib/context";

// ── Domain types ──────────────────────────────────────────────────────────────

interface SiteRow {
  id: string;
  userId: string;
  name: string;
  slug: string;
  customDomain: string | null;
  eventType: string | null;
  previewColor: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}

interface SiteSettingRow {
  siteId: string;
  eventName: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  greeting: string | null;
  musicUrl: string | null;
  mainLanguage: string | null;
  secondLanguage: string | null;
  guestPassword: string | null;
  isLive: number;
  headingFont: string | null;
  bodyFont: string | null;
  accentColor: string | null;
  bgColor: string | null;
  updatedAt: number;
}

interface PageRow {
  id: string;
  siteId: string;
  slug: string;
  label: string;
  isVisible: number;
  isLocked: number;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

interface BlockRow {
  id: string;
  siteId: string;
  pageId: string;
  type: string;
  config: string;
  sortOrder: number;
  isVisible: number;
  createdAt: number;
  updatedAt: number;
}

interface ParsedBlock extends Omit<BlockRow, "config"> {
  config: Record<string, unknown>;
}

interface PageWithBlocks extends PageRow {
  blocks: ParsedBlock[];
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function placeholder(text: string): string {
  return `<p class="placeholder-text">${escHtml(text)}</p>`;
}

function mediaPlaceholder(label: string): string {
  return `<div class="media-placeholder" aria-label="${escHtml(label)} placeholder">
    <span class="media-placeholder-icon" aria-hidden="true">&#9654;</span>
    <p>${escHtml(label)} will appear here once added.</p>
  </div>`;
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function buildStyles(settings: SiteSettingRow | null): string {
  const accent = settings?.accentColor ?? "#0d9488";
  const headingFont = settings?.headingFont ?? "Georgia";
  const bodyFont = settings?.bodyFont ?? "Inter";
  const bg = settings?.bgColor ?? "#ffffff";

  return `
    :root {
      --accent: ${escHtml(accent)};
      --heading-font: ${escHtml(headingFont)}, Georgia, serif;
      --body-font: ${escHtml(bodyFont)}, system-ui, sans-serif;
      --bg: ${escHtml(bg)};
      --text: #292524;
      --muted: #78716c;
      --border: #e7e5e4;
      --radius: 12px;
      --max-width: 820px;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--body-font);
      font-size: 1rem;
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Layout ── */
    .site-wrapper { max-width: var(--max-width); margin: 0 auto; padding: 0 1.25rem; }
    .block { padding: 3.5rem 0; }

    /* ── Hero ── */
    .block-home-hero {
      background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 8%, white), var(--bg) 60%);
      text-align: center;
      padding: 5rem 1.25rem 4rem;
    }
    .hero-inner { max-width: 640px; margin: 0 auto; }
    .hero-eyebrow {
      font-family: var(--body-font);
      font-size: 0.8125rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 1.25rem;
    }
    .hero-title {
      font-family: var(--heading-font);
      font-size: clamp(2rem, 6vw, 3.5rem);
      font-weight: normal;
      letter-spacing: -0.01em;
      line-height: 1.15;
      color: var(--text);
      margin-bottom: 1.25rem;
    }
    .hero-date { font-size: 1.0625rem; color: var(--muted); margin-bottom: 0.375rem; }
    .hero-location { font-size: 0.9375rem; color: var(--muted); }
    .hero-divider { margin-top: 2rem; font-size: 1.25rem; color: var(--accent); opacity: 0.5; }

    /* ── Section heading ── */
    .section-heading {
      font-family: var(--heading-font);
      font-size: clamp(1.5rem, 3.5vw, 2rem);
      font-weight: normal;
      text-align: center;
      color: var(--text);
      margin-bottom: 0.75rem;
    }
    .section-rule {
      width: 3rem; height: 1px;
      background: var(--accent);
      margin: 0 auto 2.5rem;
      opacity: 0.6;
    }

    /* ── Text ── */
    .text-body { max-width: 640px; margin: 0 auto; text-align: center; color: var(--muted); font-size: 1.0625rem; }

    /* ── Countdown ── */
    .block-countdown { text-align: center; }
    .countdown-label { font-family: var(--heading-font); font-size: 1.375rem; font-weight: normal; margin-bottom: 1.75rem; }
    .countdown-units { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; }
    .countdown-unit { display: flex; flex-direction: column; align-items: center; min-width: 72px; }
    .countdown-num {
      font-family: var(--heading-font);
      font-size: clamp(2rem, 6vw, 3rem);
      font-weight: normal;
      color: var(--accent);
      line-height: 1;
    }
    .countdown-unit-label { font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-top: 0.375rem; }

    /* ── Timeline ── */
    .timeline { list-style: none; max-width: 540px; margin: 0 auto; }
    .timeline-item { display: flex; gap: 1.5rem; padding: 1.25rem 0; border-bottom: 1px solid var(--border); }
    .timeline-item:last-child { border-bottom: none; }
    .timeline-time { flex-shrink: 0; font-size: 0.875rem; color: var(--accent); padding-top: 0.125rem; min-width: 80px; }
    .timeline-content strong { display: block; margin-bottom: 0.25rem; }
    .timeline-content p { font-size: 0.9375rem; color: var(--muted); }

    /* ── FAQ ── */
    .faq-list { max-width: 640px; margin: 0 auto; }
    .faq-question {
      font-family: var(--heading-font);
      font-size: 1.0625rem;
      font-weight: normal;
      padding: 1.125rem 0 0.375rem;
      border-top: 1px solid var(--border);
    }
    .faq-list dt:first-of-type { border-top: none; }
    .faq-answer { color: var(--muted); padding-bottom: 0.75rem; font-size: 0.9375rem; }

    /* ── RSVP ── */
    .rsvp-form { max-width: 480px; margin: 0 auto; }
    .form-group { margin-bottom: 1.375rem; }
    .form-label { display: block; font-size: 0.875rem; letter-spacing: 0.04em; margin-bottom: 0.5rem; color: var(--text); }
    .form-input {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.625rem 0.875rem;
      font-family: var(--body-font);
      font-size: 0.9375rem;
      color: var(--text);
      background: #fff;
      outline: none;
      transition: border-color 0.15s;
    }
    .form-input:focus { border-color: var(--accent); }
    .form-input--narrow { width: 120px; }
    .form-textarea { min-height: 96px; resize: vertical; }
    .radio-group { display: flex; gap: 1.25rem; flex-wrap: wrap; }
    .radio-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; cursor: pointer; }
    .rsvp-submit {
      display: inline-block;
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 6px;
      color: #fff;
      font-family: var(--body-font);
      font-size: 0.9375rem;
      letter-spacing: 0.04em;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .rsvp-submit:hover { opacity: 0.88; }

    /* ── Images ── */
    .image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
    .gallery-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px; }

    /* ── Video / YouTube ── */
    .media-element { width: 100%; border-radius: var(--radius); display: block; }
    .video-wrap { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--radius); }
    .youtube-iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }

    /* ── Media placeholder ── */
    .media-placeholder {
      border: 2px dashed var(--border);
      border-radius: var(--radius);
      padding: 3rem 2rem;
      text-align: center;
      color: var(--muted);
    }
    .media-placeholder-icon { font-size: 2rem; display: block; margin-bottom: 0.75rem; }

    /* ── Info cards (registry / hotel) ── */
    .info-card {
      max-width: 420px;
      margin: 0 auto;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      text-align: center;
    }
    .card-title { font-family: var(--heading-font); font-size: 1.25rem; font-weight: normal; margin-bottom: 0.5rem; }
    .card-note { color: var(--muted); font-size: 0.9375rem; margin-bottom: 0.75rem; }
    .card-link { font-size: 0.9375rem; font-weight: 500; text-decoration: none; }
    .card-link:hover { text-decoration: underline; }

    /* ── Venue map ── */
    .venue-name { text-align: center; font-family: var(--heading-font); font-size: 1.125rem; font-weight: normal; margin-bottom: 0.375rem; }
    .venue-note { text-align: center; color: var(--muted); font-size: 0.9375rem; margin-bottom: 1.25rem; }
    .map-wrap { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--radius); }
    .map-iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
    .venue-address { text-align: center; color: var(--muted); font-size: 0.875rem; margin-top: 0.75rem; }

    /* ── Placeholder ── */
    .placeholder-text {
      text-align: center;
      color: #d6d3d1;
      font-style: italic;
      font-size: 0.9375rem;
      padding: 1.5rem;
      border: 2px dashed var(--border);
      border-radius: 8px;
    }

    /* ── Greeting modal ── */
    .greeting-overlay {
      position: fixed; inset: 0; z-index: 999;
      background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center;
      padding: 1.25rem;
    }
    .greeting-overlay.hidden { display: none; }
    .greeting-modal {
      background: #fff;
      border-radius: var(--radius);
      padding: 2.5rem;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18);
    }
    .greeting-modal p {
      font-family: var(--heading-font);
      font-size: 1.125rem;
      line-height: 1.65;
      color: var(--text);
      margin-bottom: 1.75rem;
      font-weight: normal;
    }
    .greeting-close {
      display: inline-block;
      padding: 0.65rem 1.75rem;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-family: var(--body-font);
      font-size: 0.9375rem;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .greeting-close:hover { opacity: 0.88; }

    /* ── Responsive ── */
    @media (max-width: 600px) {
      .block { padding: 2.5rem 0; }
      .block-home-hero { padding: 3.5rem 1rem 3rem; }
      .countdown-units { gap: 1rem; }
      .timeline-item { flex-direction: column; gap: 0.25rem; }
      .timeline-time { min-width: unset; }
    }
  `;
}

// ── Block renderers ───────────────────────────────────────────────────────────

function renderBlock(block: ParsedBlock, settings: SiteSettingRow | null): string {
  const cfg = block.config;
  const accent = settings?.accentColor ?? "#0d9488";

  switch (block.type) {
    case "home-hero": {
      const title =
        (cfg.title as string | undefined) ??
        settings?.eventName ??
        "Our Special Day";
      const date =
        (cfg.date as string | undefined) ?? settings?.eventDate ?? "";
      const location =
        (cfg.location as string | undefined) ?? settings?.eventLocation ?? "";
      return `
        <section class="block block-home-hero" aria-label="Hero">
          <div class="hero-inner">
            <p class="hero-eyebrow">We&#39;re getting married</p>
            <h1 class="hero-title">${escHtml(title)}</h1>
            ${date ? `<p class="hero-date">${escHtml(date)}</p>` : ""}
            ${location ? `<p class="hero-location">${escHtml(location)}</p>` : ""}
            <div class="hero-divider" aria-hidden="true">&#10038;</div>
          </div>
        </section>`;
    }

    case "header": {
      const text =
        (cfg.text as string | undefined) ??
        (cfg.heading as string | undefined) ??
        "";
      return `
        <section class="block block-header">
          <h2 class="section-heading">${escHtml(text || "Section")}</h2>
          <div class="section-rule" aria-hidden="true"></div>
        </section>`;
    }

    case "text": {
      const content =
        (cfg.text as string | undefined) ??
        (cfg.content as string | undefined) ??
        "";
      return `
        <section class="block block-text">
          <div class="text-body">
            ${content ? `<p>${escHtml(content)}</p>` : placeholder("Story text will appear here once added.")}
          </div>
        </section>`;
    }

    case "countdown": {
      const targetDate =
        (cfg.date as string | undefined) ?? settings?.eventDate ?? "";
      const label = (cfg.label as string | undefined) ?? "Until we say I do";
      return `
        <section class="block block-countdown" aria-label="Countdown">
          <p class="countdown-label">${escHtml(label)}</p>
          ${
            targetDate
              ? `<div class="countdown-units" id="countdown-${escHtml(block.id)}" data-target="${escHtml(targetDate)}">
                   <div class="countdown-unit">
                     <span class="countdown-num" id="cd-days-${escHtml(block.id)}">--</span>
                     <span class="countdown-unit-label">Days</span>
                   </div>
                   <div class="countdown-unit">
                     <span class="countdown-num" id="cd-hrs-${escHtml(block.id)}">--</span>
                     <span class="countdown-unit-label">Hours</span>
                   </div>
                   <div class="countdown-unit">
                     <span class="countdown-num" id="cd-min-${escHtml(block.id)}">--</span>
                     <span class="countdown-unit-label">Minutes</span>
                   </div>
                   <div class="countdown-unit">
                     <span class="countdown-num" id="cd-sec-${escHtml(block.id)}">--</span>
                     <span class="countdown-unit-label">Seconds</span>
                   </div>
                 </div>`
              : placeholder("Set a target date to show the countdown.")
          }
        </section>`;
    }

    case "schedule": {
      const items = cfg.items as
        | Array<{ time?: string; title?: string; description?: string }>
        | undefined;
      return `
        <section class="block block-schedule" aria-label="Schedule">
          <h2 class="section-heading">The Day</h2>
          <div class="section-rule" aria-hidden="true"></div>
          ${
            items && items.length > 0
              ? `<ol class="timeline">
                   ${items
                     .map(
                       (item) => `
                     <li class="timeline-item">
                       ${item.time ? `<span class="timeline-time">${escHtml(item.time)}</span>` : ""}
                       <div class="timeline-content">
                         ${item.title ? `<strong>${escHtml(item.title)}</strong>` : ""}
                         ${item.description ? `<p>${escHtml(item.description)}</p>` : ""}
                       </div>
                     </li>`
                     )
                     .join("")}
                 </ol>`
              : placeholder("The wedding day schedule will appear here.")
          }
        </section>`;
    }

    case "faq": {
      const items = cfg.items as
        | Array<{ question?: string; answer?: string }>
        | undefined;
      return `
        <section class="block block-faq" aria-label="Frequently asked questions">
          <h2 class="section-heading">Questions &amp; Answers</h2>
          <div class="section-rule" aria-hidden="true"></div>
          ${
            items && items.length > 0
              ? `<dl class="faq-list">
                   ${items
                     .map(
                       (item) =>
                         `${item.question ? `<dt class="faq-question">${escHtml(item.question)}</dt>` : ""}${item.answer ? `<dd class="faq-answer">${escHtml(item.answer)}</dd>` : ""}`
                     )
                     .join("")}
                 </dl>`
              : placeholder("Frequently asked questions will appear here.")
          }
        </section>`;
    }

    case "rsvp": {
      const formTitle = (cfg.title as string | undefined) ?? "RSVP";
      return `
        <section class="block block-rsvp" aria-label="RSVP">
          <h2 class="section-heading">${escHtml(formTitle)}</h2>
          <div class="section-rule" aria-hidden="true"></div>
          <form class="rsvp-form" onsubmit="return false;" aria-label="RSVP form">
            <div class="form-group">
              <label class="form-label" for="rsvp-name">Full Name</label>
              <input class="form-input" id="rsvp-name" name="name" type="text" placeholder="Your name" autocomplete="name" />
            </div>
            <div class="form-group">
              <label class="form-label">Will you attend?</label>
              <div class="radio-group" role="radiogroup" aria-label="Attendance">
                <label class="radio-label">
                  <input type="radio" name="attendance" value="yes" /> Joyfully accepts
                </label>
                <label class="radio-label">
                  <input type="radio" name="attendance" value="no" /> Regretfully declines
                </label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="rsvp-guests">Number of Guests</label>
              <input class="form-input form-input--narrow" id="rsvp-guests" name="guests" type="number" min="1" max="10" placeholder="1" />
            </div>
            <div class="form-group">
              <label class="form-label" for="rsvp-notes">Notes or Dietary Restrictions</label>
              <textarea class="form-input form-textarea" id="rsvp-notes" name="notes" placeholder="Optional"></textarea>
            </div>
            <button class="rsvp-submit" type="submit" style="background:${escHtml(accent)}">Send RSVP</button>
          </form>
        </section>`;
    }

    case "images": {
      const urls = cfg.urls as string[] | undefined;
      return `
        <section class="block block-images" aria-label="Photo gallery">
          ${
            urls && urls.length > 0
              ? `<div class="image-grid">
                   ${urls.map((u, i) => `<img src="${escHtml(u)}" alt="Wedding photo ${i + 1}" loading="lazy" class="gallery-img" />`).join("")}
                 </div>`
              : placeholder("Photos will appear here once uploaded.")
          }
        </section>`;
    }

    case "video": {
      const url = cfg.url as string | undefined;
      return `
        <section class="block block-video" aria-label="Video">
          ${url ? `<video src="${escHtml(url)}" controls class="media-element" aria-label="Wedding video"></video>` : mediaPlaceholder("Video")}
        </section>`;
    }

    case "youtube": {
      const videoId = cfg.videoId as string | undefined;
      return `
        <section class="block block-youtube" aria-label="YouTube video">
          ${
            videoId
              ? `<div class="video-wrap">
                   <iframe
                     src="https://www.youtube-nocookie.com/embed/${escHtml(videoId)}"
                     title="YouTube video"
                     frameborder="0"
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                     allowfullscreen
                     class="youtube-iframe"
                   ></iframe>
                 </div>`
              : mediaPlaceholder("YouTube Video")
          }
        </section>`;
    }

    case "registry-card": {
      const name = cfg.name as string | undefined;
      const url = cfg.url as string | undefined;
      const note = cfg.note as string | undefined;
      return `
        <section class="block block-registry-card" aria-label="Gift registry">
          <h2 class="section-heading">Registry</h2>
          <div class="section-rule" aria-hidden="true"></div>
          ${
            name || url
              ? `<div class="info-card">
                   ${name ? `<p class="card-title">${escHtml(name)}</p>` : ""}
                   ${note ? `<p class="card-note">${escHtml(note)}</p>` : ""}
                   ${url ? `<a href="${escHtml(url)}" target="_blank" rel="noopener noreferrer" class="card-link" style="color:${escHtml(accent)}">View Registry</a>` : ""}
                 </div>`
              : placeholder("Registry details will appear here once added.")
          }
        </section>`;
    }

    case "hotel-card": {
      const name = cfg.name as string | undefined;
      const address = cfg.address as string | undefined;
      const url = cfg.url as string | undefined;
      const note = cfg.note as string | undefined;
      return `
        <section class="block block-hotel-card" aria-label="Hotel and accommodations">
          <h2 class="section-heading">Hotels &amp; Accommodations</h2>
          <div class="section-rule" aria-hidden="true"></div>
          ${
            name || address
              ? `<div class="info-card">
                   ${name ? `<p class="card-title">${escHtml(name)}</p>` : ""}
                   ${address ? `<p class="card-note">${escHtml(address)}</p>` : ""}
                   ${note ? `<p class="card-note">${escHtml(note)}</p>` : ""}
                   ${url ? `<a href="${escHtml(url)}" target="_blank" rel="noopener noreferrer" class="card-link" style="color:${escHtml(accent)}">Book Now</a>` : ""}
                 </div>`
              : placeholder("Hotel and accommodation details will appear here.")
          }
        </section>`;
    }

    case "venue-map": {
      const address = cfg.address as string | undefined;
      const name = cfg.name as string | undefined;
      const note = cfg.note as string | undefined;
      const mapSrc = address
        ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
        : null;
      return `
        <section class="block block-venue-map" aria-label="Venue location">
          <h2 class="section-heading">Venue</h2>
          <div class="section-rule" aria-hidden="true"></div>
          ${name ? `<p class="venue-name">${escHtml(name)}</p>` : ""}
          ${note ? `<p class="venue-note">${escHtml(note)}</p>` : ""}
          ${
            mapSrc
              ? `<div class="map-wrap">
                   <iframe
                     src="${escHtml(mapSrc)}"
                     title="${escHtml(address ?? "Venue location")}"
                     frameborder="0"
                     loading="lazy"
                     referrerpolicy="no-referrer-when-downgrade"
                     class="map-iframe"
                     aria-label="Google Maps showing ${escHtml(address ?? "venue location")}"
                   ></iframe>
                 </div>
                 <p class="venue-address">${escHtml(address!)}</p>`
              : placeholder("Venue address and map will appear here.")
          }
        </section>`;
    }

    case "spacer": {
      const height = Math.max(0, Math.min(400, Number(cfg.height ?? 60)));
      return `<div class="block-spacer" style="height:${height}px" aria-hidden="true"></div>`;
    }

    default:
      return `<section class="block block-unknown">${placeholder(`This block (${escHtml(block.type)}) is not yet supported.`)}</section>`;
  }
}

// ── Countdown script ──────────────────────────────────────────────────────────

function buildCountdownScript(
  countdownBlocks: Array<{ id: string; date: string }>
): string {
  if (countdownBlocks.length === 0) return "";
  // JSON.stringify is safe here — the values came from the DB and are plain strings.
  const data = JSON.stringify(countdownBlocks);
  return `<script>
(function(){
  var blocks=${data};
  function pad(n){return String(n).padStart(2,'0');}
  function tick(){
    var now=Date.now();
    blocks.forEach(function(b){
      var diff=Math.max(0,new Date(b.date).getTime()-now);
      var d=Math.floor(diff/86400000);
      var h=Math.floor((diff%86400000)/3600000);
      var m=Math.floor((diff%3600000)/60000);
      var s=Math.floor((diff%60000)/1000);
      var el=document.getElementById;
      var days=el('cd-days-'+b.id);
      var hrs =el('cd-hrs-' +b.id);
      var min =el('cd-min-' +b.id);
      var sec =el('cd-sec-' +b.id);
      if(days)days.textContent=d;
      if(hrs) hrs.textContent=pad(h);
      if(min) min.textContent=pad(m);
      if(sec) sec.textContent=pad(s);
    });
  }
  tick();
  setInterval(tick,1000);
})();
</script>`;
}

// ── Full-document HTML builder ────────────────────────────────────────────────

function buildHtml(
  site: SiteRow,
  settings: SiteSettingRow | null,
  pages: PageWithBlocks[]
): string {
  const lang = escHtml(settings?.mainLanguage ?? "en");
  const eventTitle = settings?.eventName ?? site.name;
  const eventDate = settings?.eventDate ?? null;
  const eventLocation = settings?.eventLocation ?? null;
  const greeting = settings?.greeting ?? null;
  const accent = settings?.accentColor ?? "#0d9488";

  const allBlocks = pages.flatMap((p) => p.blocks);
  const hasHeroBlock = allBlocks.some((b) => b.type === "home-hero");

  const countdownData = allBlocks
    .filter((b) => b.type === "countdown" && typeof b.config.date === "string")
    .map((b) => ({ id: b.id, date: b.config.date as string }));

  // Implicit hero when no home-hero block is present
  const implicitHero = hasHeroBlock
    ? ""
    : `<section class="block block-home-hero" aria-label="Hero">
        <div class="hero-inner">
          <p class="hero-eyebrow">We&#39;re getting married</p>
          <h1 class="hero-title">${escHtml(eventTitle)}</h1>
          ${eventDate ? `<p class="hero-date">${escHtml(eventDate)}</p>` : ""}
          ${eventLocation ? `<p class="hero-location">${escHtml(eventLocation)}</p>` : ""}
          <div class="hero-divider" aria-hidden="true">&#10038;</div>
        </div>
      </section>`;

  const blocksHtml = allBlocks
    .map((block) => renderBlock(block, settings))
    .join("\n");

  const greetingHtml = greeting
    ? `<div class="greeting-overlay" id="greeting-overlay" role="dialog" aria-modal="true" aria-label="Welcome message">
        <div class="greeting-modal">
          <p>${escHtml(greeting)}</p>
          <button
            class="greeting-close"
            onclick="document.getElementById('greeting-overlay').classList.add('hidden');"
            aria-label="Close welcome message and view site"
          >View Site</button>
        </div>
      </div>`
    : "";

  const pageTitle = `${escHtml(eventTitle)}${eventDate ? ` &middot; ${escHtml(eventDate)}` : ""}`;
  const metaDesc = [eventTitle, eventDate, eventLocation]
    .filter(Boolean)
    .join(" \u00b7 ");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <meta name="description" content="${escHtml(metaDesc)}" />
  <style>${buildStyles(settings)}</style>
</head>
<body>
  ${greetingHtml}
  ${implicitHero}
  <div class="site-wrapper">
    ${blocksHtml}
  </div>
  ${buildCountdownScript(countdownData)}
</body>
</html>`;
}

// ── 404 page ──────────────────────────────────────────────────────────────────

function notFoundHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Not Found</title>
  <style>
    body{margin:0;font-family:Georgia,serif;background:#faf8f5;color:#292524;
         display:flex;align-items:center;justify-content:center;min-height:100vh;}
    .wrap{text-align:center;padding:2rem;}
    h1{font-size:2rem;margin:0 0 0.5rem;font-weight:normal;}
    p{color:#78716c;margin:0.5rem 0;}
    a{color:#0d9488;text-decoration:none;}
    a:hover{text-decoration:underline;}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Site Not Found</h1>
    <p>This wedding site doesn&#39;t exist or hasn&#39;t been published yet.</p>
    <p><a href="/">Return home</a></p>
  </div>
</body>
</html>`;
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const { slug } = params;
  const db = context.cloudflare.env.DB;

  // Attempt to identify a logged-in owner so they can preview unpublished sites.
  let viewerUserId: string | null = null;
  try {
    const auth = createAuth(context.cloudflare.env);
    const session = await auth.api.getSession({ headers: request.headers });
    viewerUserId = session?.user?.id ?? null;
  } catch {
    // Unauthenticated visitor — continue as public.
  }

  let site: SiteRow | null = null;

  // Owners can preview any status; visitors only see published sites.
  if (viewerUserId) {
    site = await db
      .prepare("SELECT * FROM site WHERE slug = ? AND userId = ?")
      .bind(slug, viewerUserId)
      .first<SiteRow>();
  }

  if (!site) {
    site = await db
      .prepare("SELECT * FROM site WHERE slug = ? AND status = 'published'")
      .bind(slug)
      .first<SiteRow>();
  }

  if (!site) {
    return new Response(notFoundHtml(), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const settings = await db
    .prepare("SELECT * FROM site_setting WHERE siteId = ?")
    .bind(site.id)
    .first<SiteSettingRow>();

  const pagesResult = await db
    .prepare(
      "SELECT * FROM page WHERE siteId = ? AND isVisible = 1 ORDER BY sortOrder ASC"
    )
    .bind(site.id)
    .all<PageRow>();

  const blocksResult = await db
    .prepare(
      "SELECT * FROM block WHERE siteId = ? AND isVisible = 1 ORDER BY sortOrder ASC"
    )
    .bind(site.id)
    .all<BlockRow>();

  // Group blocks by pageId and parse JSON config.
  const blocksByPage = new Map<string, ParsedBlock[]>();
  for (const block of blocksResult.results) {
    if (!blocksByPage.has(block.pageId)) blocksByPage.set(block.pageId, []);
    let config: Record<string, unknown> = {};
    try {
      config = JSON.parse(block.config) as Record<string, unknown>;
    } catch {
      // Config stays empty — handled gracefully in each renderer.
    }
    blocksByPage.get(block.pageId)!.push({ ...block, config });
  }

  const pages: PageWithBlocks[] = pagesResult.results.map((page) => ({
    ...page,
    blocks: blocksByPage.get(page.id) ?? [],
  }));

  // Return a raw HTML Response — the site has its own full document with
  // inlined CSS and does not participate in the app shell.
  return new Response(buildHtml(site, settings ?? null, pages), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

// Resource route — no component export. React Router v7 sends the loader's
// Response directly as the HTTP response without component rendering or
// turbo-stream serialization. Adding a component export would cause RR to
// attempt hydration serialization of the raw Response, throwing an error.
