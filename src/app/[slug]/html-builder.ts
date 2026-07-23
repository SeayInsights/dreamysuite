import {
  type SiteRow,
  type SiteSettingRow,
  type PageRow,
  type PageWithBlocks,
  type ContentMap,
  type BlockTransMap,
} from "./types";
import { escHtml, safeUrl, parseMusicSource } from "./helpers";
import { buildStyles } from "./styles";
import { renderBlock } from "./renderers";
import {
  buildCountdownScript,
  buildMessageListenerScript,
  buildBlockAnimationScript,
  buildResponsiveScript,
  buildLazyVideoScript,
} from "./scripts";
import { buildIntroHtml } from "./pages";
import { LANG_NATIVE } from "@/lib/i18n/languages";
import { detectDesignedAtWidth } from "@/lib/responsiveScale";

export async function buildHtml(
  site: SiteRow,
  settings: SiteSettingRow | null,
  pages: PageWithBlocks[],
  contentMap: ContentMap,
  blockTransMap: BlockTransMap,
  siteSlug: string,
  activeLang?: string | null,
  lockedPageIds: Set<string> = new Set(),
): Promise<string> {
  const mainLang = settings?.mainLanguage ?? "en";
  const eventTitle = settings?.eventName ?? site.name;
  const eventDate = settings?.eventDate ?? null;
  const eventLocation = settings?.eventLocation ?? null;
  const greeting = settings?.greeting ?? null;

  const bgImageRaw = settings?.bgImage ?? null;
  const escapedBgImageUrl = bgImageRaw
    ? safeUrl(bgImageRaw).replace(/\\/g, "\\\\").replace(/'/g, "\\'")
    : null;

  const allBlocks = pages.flatMap((p) => p.blocks);
  const designedAtWidth = detectDesignedAtWidth(allBlocks);
  const hasCountdown =
    allBlocks.some((b) => b.type === "countdown") ||
    (!!settings?.eventDate &&
      allBlocks.some(
        (b) =>
          b.type === "video" &&
          !!(b.config as Record<string, unknown>).showCountdown,
      ));

  const usedBlockPresets = new Set(
    allBlocks.flatMap((b) => {
      const a = (b.config as Record<string, unknown>).animation;
      const id =
        typeof a === "object" && a !== null
          ? ((a as { presetId?: string }).presetId ?? "")
          : typeof a === "string"
            ? a
            : "";
      return id ? [id] : [];
    }),
  );
  const blockPresetNeedsScrollTrigger =
    ["parallax-monogram", "scroll-pinned-story", "sticky-date"].some((id) =>
      usedBlockPresets.has(id),
    ) ||
    allBlocks.some((b) => {
      const a = (b.config as Record<string, unknown>).animation;
      return (
        typeof a === "object" &&
        a !== null &&
        (a as { trigger?: string }).trigger === "on-scroll-scrub"
      );
    });
  const blockAnimScript = buildBlockAnimationScript(usedBlockPresets);

  // Build nav bar (only if there are multiple pages, all visible)
  const visiblePages = pages.filter((p) => p.isVisible !== 0);
  const hasMultiplePages = visiblePages.length > 1;

  // Nav labels: use page label, fall back to slug with initial cap
  function pageLabel(p: PageRow): string {
    return escHtml(p.label || p.slug.charAt(0).toUpperCase() + p.slug.slice(1));
  }

  // Parse all configured languages
  let extraLangs: string[] = [];
  if (settings?.siteLanguages) {
    try {
      extraLangs = JSON.parse(settings.siteLanguages);
    } catch {
      /* ignore */
    }
  }
  if (!extraLangs.length && settings?.secondLanguage) {
    extraLangs = [settings.secondLanguage];
  }
  const allLangs = [mainLang, ...extraLangs];
  const secondLang = extraLangs[0] ?? null;
  const isMultiLang = extraLangs.length > 1;

  const navShape = settings?.navShape ?? "";
  const navMaterial = settings?.navMaterial ?? "solid";
  const navUnderlineClass =
    (settings?.navUnderline ?? "on") !== "off" ? " nav-underline" : "";
  const navMaterialClass =
    navMaterial === "glass"
      ? " nav-glass"
      : navMaterial === "frosted"
        ? " nav-frosted"
        : "";
  const navShapeClass =
    (navShape === "pill"
      ? " nav-pill"
      : navShape === "floating"
        ? " nav-floating"
        : "") +
    navUnderlineClass +
    navMaterialClass;
  const isPillOrFloating = navShape === "pill" || navShape === "floating";
  const navLinksHtml = visiblePages
    .map(
      (p, i) =>
        `<li><button class="site-nav-link${i === 0 ? " active" : ""}" data-page="${escHtml(p.id)}" onclick="showPage('${escHtml(p.id)}')">${pageLabel(p)}</button></li>`,
    )
    .join("");
  const mainNative = LANG_NATIVE[mainLang] ?? mainLang.toUpperCase();
  const currentLang = activeLang ?? mainLang;
  const navLangToggle =
    extraLangs.length > 0
      ? isMultiLang
        ? `<div class="lang-toggle">
          <select class="lang-select" id="lang-select" onchange="switchLangTo(this.value)" aria-label="Select language">
            ${allLangs.map((l) => `<option value="${escHtml(l)}"${l === currentLang ? " selected" : ""}>${escHtml(LANG_NATIVE[l] ?? l)}</option>`).join("")}
          </select>
        </div>`
        : (() => {
            const secondNative =
              LANG_NATIVE[secondLang!] ?? secondLang!.toUpperCase();
            const isSecondActive = activeLang === secondLang;
            return `<div class="lang-toggle">
            <button class="lang-btn" id="lang-toggle-btn"
              data-main="${escHtml(mainLang)}" data-second="${escHtml(secondLang!)}"
              data-main-label="${escHtml(mainNative)}" data-second-label="${escHtml(secondNative)}"
              onclick="switchLang()"
              aria-label="Switch language"
            >${isSecondActive ? escHtml(mainNative) : escHtml(secondNative)}</button>
          </div>`;
          })()
      : "";
  const showNavBrand = !!(settings?.showNavBrand ?? 1);
  const navHtml = hasMultiplePages
    ? isPillOrFloating
      ? `<div class="site-nav-row${navMaterial === "glass" ? " nav-glass-row" : navMaterial === "frosted" ? " nav-frosted-row" : ""}" role="navigation" aria-label="Site navigation">
          <div></div>
          <nav class="site-nav${navShapeClass}">
            <div class="site-nav-inner">
              ${showNavBrand ? `<a class="site-nav-brand" href="#" onclick="return false;">${escHtml(eventTitle)}</a>` : ""}
              <ul class="site-nav-links" role="list">
                ${navLinksHtml}
              </ul>
            </div>
          </nav>
          <div class="site-nav-lang-outside">${navLangToggle}</div>
        </div>`
      : `<nav class="site-nav${navShapeClass}" aria-label="Site navigation">
          <div class="site-nav-inner">
            ${showNavBrand ? `<a class="site-nav-brand" href="#" onclick="return false;">${escHtml(eventTitle)}</a>` : ""}
            <ul class="site-nav-links" role="list">
              ${navLinksHtml}
            </ul>
            ${navLangToggle}
          </div>
        </nav>`
    : "";

  // Page sections with show/hide — track when activeLang content is absent so we can show a fallback banner
  let _anyLangFallback = false;
  const pageSectionsHtml = (
    await Promise.all(
      visiblePages.map(async (page, i) => {
        const sectionClass = hasMultiplePages
          ? `page-section${i === 0 ? " active" : ""}`
          : "page-section active";

        if (lockedPageIds.has(page.id)) {
          const accent = settings?.accentColor ?? "#B8921A";
          return `<div class="${sectionClass}" id="page-${escHtml(page.id)}"><div style="display:flex;align-items:center;justify-content:center;min-height:40vh;padding:2rem"><div style="text-align:center;max-width:320px"><p style="color:#78716c;margin-bottom:1.25rem;font-size:.9375rem">This page is password protected.</p><form method="post" style="display:flex;flex-direction:column;gap:.75rem"><input type="password" name="pw" placeholder="Enter password" required style="border:1px solid #e7e5e4;border-radius:6px;padding:.625rem .875rem;font-family:inherit;font-size:1rem;outline:none" aria-label="Page password"/><button type="submit" style="padding:.625rem 1.5rem;border:none;border-radius:6px;background:${escHtml(accent)};color:#fff;font-family:inherit;font-size:.875rem;cursor:pointer">Unlock</button></form></div></div></div>`;
        }

        const pageContentByLang = contentMap.get(page.slug);
        const renderLang = activeLang ?? mainLang;
        if (activeLang && !pageContentByLang?.get(activeLang))
          _anyLangFallback = true;
        const pageContent =
          pageContentByLang?.get(renderLang) ??
          pageContentByLang?.get(mainLang) ??
          (pageContentByLang ? [...pageContentByLang.values()][0] : undefined);
        const blocksHtml = (
          await Promise.all(
            page.blocks.map(async (block) => {
              let html: string;
              try {
                html = await renderBlock(
                  block,
                  settings,
                  pageContent,
                  siteSlug,
                  blockTransMap,
                  renderLang,
                  mainLang,
                );
              } catch (err) {
                // Resilience: one block that throws during server-render must never
                // take down the whole published site. Before this guard, a single
                // failing block surfaced as a blank HTTP 500 for the entire page
                // (every site with real content). Log for diagnosis and emit an
                // empty placeholder so the rest of the page still renders.
                console.error(
                  `[published-render] block ${block.id} (${block.type}) failed to render`,
                  err,
                );
                return `<section class="block block-render-error" data-block-id="${escHtml(
                  block.id,
                )}" aria-hidden="true"></section>`;
              }
              const animRaw = (block.config as Record<string, unknown>)
                .animation;
              type AnimConfig = {
                presetId?: string;
                duration?: number;
                delay?: number;
                easing?: string;
                trigger?: string;
              };
              let animPreset = "";
              let animDuration: number | undefined;
              let animDelay: number | undefined;
              let animEasing: string | undefined;
              let animTrigger: string | undefined;
              if (typeof animRaw === "object" && animRaw !== null) {
                const cfg = animRaw as AnimConfig;
                animPreset = cfg.presetId ?? "";
                animDuration = cfg.duration;
                animDelay = cfg.delay;
                animEasing = cfg.easing;
                animTrigger = cfg.trigger;
              } else if (typeof animRaw === "string") {
                animPreset = animRaw;
              }
              if (!animPreset) return html;
              // Build data attribute string — only emit non-default values to keep HTML lean
              let dataAttrs = ` data-animation="${escHtml(animPreset)}"`;
              if (animDuration !== undefined && animDuration !== 0.6)
                dataAttrs += ` data-animation-duration="${animDuration}"`;
              if (animDelay !== undefined && animDelay !== 0)
                dataAttrs += ` data-animation-delay="${animDelay}"`;
              if (animEasing !== undefined && animEasing !== "power2.out")
                dataAttrs += ` data-animation-easing="${escHtml(animEasing)}"`;
              if (animTrigger !== undefined && animTrigger !== "on-view")
                dataAttrs += ` data-animation-trigger="${escHtml(animTrigger)}"`;
              return html.replace(/(<section\b[^>]*)(>)/, `$1${dataAttrs}$2`);
            }),
          )
        ).join("\n");
        return `<div class="${sectionClass}" id="page-${escHtml(page.id)}">${blocksHtml}</div>`;
      }),
    )
  ).join("\n");

  // Content margin padding
  const mTop = Number(settings?.marginTop ?? 0) || 0;
  const mRight = Number(settings?.marginRight ?? 0) || 0;
  const mBottom = Number(settings?.marginBottom ?? 0) || 0;
  const mLeft = Number(settings?.marginLeft ?? 0) || 0;
  const mMaxWidth = Number(settings?.siteMaxWidth ?? 0) || 0;
  const contentStyles: string[] = [];
  if (mTop || mRight || mBottom || mLeft) {
    contentStyles.push(`padding:${mTop}px ${mRight}px ${mBottom}px ${mLeft}px`);
    contentStyles.push(`overflow:hidden`);
  }
  if (mMaxWidth)
    contentStyles.push(
      `max-width:${mMaxWidth}px`,
      `margin-left:auto`,
      `margin-right:auto`,
    );
  contentStyles.push(`position:relative`, `z-index:2`);
  const contentPadStyle = ` style="${contentStyles.join(";")}"`;

  // No-pages fallback — site exists but has no pages yet
  const fallbackHtml =
    visiblePages.length === 0
      ? `<div class="site-wrapper"><p style="text-align:center;padding:4rem 1rem;color:var(--site-muted);font-style:italic;">This site has no published content yet.</p></div>`
      : "";

  // Language fallback banner — shown when the requested language has no content yet
  const langFallbackBanner =
    activeLang && _anyLangFallback
      ? `<div style="background:#fffbeb;border-bottom:1px solid #fcd34d;padding:8px 16px;font-size:0.82rem;color:#92400e;text-align:center;">${LANG_NATIVE[activeLang] ?? activeLang.toUpperCase()} content not yet available — showing original language</div>`
      : "";

  const hideOnScrollScript =
    settings?.navPosition === "hide-on-scroll"
      ? `
(function(){
  var nav = document.querySelector('.site-nav, .site-nav-row');
  if (!nav) return;
  var lastY = 0;
  nav.style.transition = 'transform .25s ease';
  window.addEventListener('scroll', function(){
    var y = window.scrollY;
    if (y > lastY && y > 60) nav.style.transform = 'translateY(-100%)';
    else nav.style.transform = 'translateY(0)';
    lastY = y;
  }, {passive:true});
})();`
      : "";
  const navScript = hasMultiplePages
    ? `<script>
function showPage(pageId) {
  document.querySelectorAll('.page-section').forEach(function(s){ s.classList.remove('active'); });
  document.querySelectorAll('.site-nav-link').forEach(function(b){ b.classList.remove('active'); });
  var section = document.getElementById('page-' + pageId);
  if (section) { section.classList.add('active'); window.scrollTo({top:0,behavior:'smooth'}); }
  document.querySelectorAll('[data-page="' + pageId + '"]').forEach(function(b){ b.classList.add('active'); });
  window.dispatchEvent(new CustomEvent('dreamysuite_pageChange', { detail: { pageId: pageId } }));
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'dreamysuite_pageChange', pageId: pageId }, '*');
  }
}
(function(){
  var pid = new URLSearchParams(location.search).get('_page');
  if (pid) showPage(pid);
})();
${hideOnScrollScript}
</script>`
    : "";

  const popupEnabled = settings?.popupEnabled ?? 1;
  const popupTitle = settings?.popupTitle ?? null;
  const popupTicker = settings?.popupTicker ?? 0;
  const showPopup = greeting && popupEnabled !== 0;
  const tickerText = popupTicker
    ? escHtml(eventTitle + (eventDate ? "  ·  " + eventDate : ""))
    : null;
  // Suppress the separate greeting-overlay when the popup is bundled inside the animation —
  // the bundle card IS the popup. Also always start hidden when any animation is active so
  // the overlay doesn't bleed through while the intro fades in (z-index 999 < 9999 but visible
  // during the 0→1 opacity ramp).
  const bundledWithAnim =
    !!settings?.popupBundle &&
    !!settings?.animation &&
    settings?.animation !== "none" &&
    settings?.animation !== "envelope";
  const greetingHtml =
    showPopup && !bundledWithAnim
      ? `<div class="greeting-overlay${settings?.animation && settings.animation !== "none" ? " hidden" : ""}" id="greeting-overlay" role="dialog" aria-modal="true" aria-label="Welcome message"
        onclick="document.getElementById('greeting-overlay').classList.add('hidden');">
        <div class="greeting-modal" onclick="event.stopPropagation();">
          ${popupTitle ? `<h2 class="greeting-title">${escHtml(popupTitle)}</h2>` : ""}
          <p>${escHtml(greeting!)}</p>
          ${tickerText ? `<div class="greeting-ticker-wrap" aria-hidden="true"><div class="greeting-ticker">${tickerText}&nbsp;&nbsp;✦&nbsp;&nbsp;${tickerText}&nbsp;&nbsp;✦&nbsp;&nbsp;</div></div>` : ""}
          <button
            class="greeting-close"
            onclick="document.getElementById('greeting-overlay').classList.add('hidden');"
            aria-label="Close welcome message and view site"
          >View Site</button>
        </div>
      </div>`
      : "";

  // Language toggle — fallback for single-page sites with no nav
  const langToggleHtml =
    extraLangs.length > 0 && !hasMultiplePages
      ? isMultiLang
        ? `<div style="position:fixed;top:1rem;right:1rem;z-index:200">
          <select class="lang-select" id="lang-select" onchange="switchLangTo(this.value)" aria-label="Select language">
            ${allLangs.map((l) => `<option value="${escHtml(l)}"${l === currentLang ? " selected" : ""}>${escHtml(LANG_NATIVE[l] ?? l)}</option>`).join("")}
          </select>
        </div>`
        : (() => {
            const secondNative =
              LANG_NATIVE[secondLang!] ?? secondLang!.toUpperCase();
            return `<div style="position:fixed;top:1rem;right:1rem;z-index:200">
            <button class="lang-btn" id="lang-toggle-btn"
              data-main="${escHtml(mainLang)}" data-second="${escHtml(secondLang!)}"
              data-main-label="${escHtml(mainNative)}" data-second-label="${escHtml(secondNative)}"
              onclick="switchLang()"
              aria-label="Switch language"
            >${escHtml(secondNative)}</button>
          </div>`;
          })()
      : "";
  const langScript =
    extraLangs.length > 0
      ? `<script>
function switchLangTo(target) {
  var url = new URL(location.href);
  if (target === '${escHtml(mainLang)}') { url.searchParams.delete('_lang'); } else { url.searchParams.set('_lang', target); }
  location.href = url.toString();
}
function switchLang() {
  var btn = document.getElementById('lang-toggle-btn');
  if (!btn) return;
  var main = btn.getAttribute('data-main');
  var second = btn.getAttribute('data-second');
  var cur = '${escHtml(activeLang ?? mainLang)}';
  var target = (cur === second) ? main : second;
  switchLangTo(target);
}
</script>`
      : "";

  // Serialize the per-lang content for client-side switching
  const langContentJson =
    extraLangs.length > 0
      ? (() => {
          const out: Record<string, Record<string, unknown>> = {};
          for (const [, langMap] of contentMap) {
            for (const [lg, data] of langMap) {
              if (!out[lg]) out[lg] = {};
              Object.assign(out[lg], data);
            }
          }
          return JSON.stringify(out).replace(/</g, "\\u003c");
        })()
      : null;

  const pageTitle = settings?.seoTitle
    ? escHtml(settings.seoTitle)
    : `${escHtml(eventTitle)}${eventDate ? ` &middot; ${escHtml(eventDate)}` : ""}`;
  const metaDesc =
    settings?.seoDescription ??
    [eventTitle, eventDate, eventLocation].filter(Boolean).join(" \u00b7 ");
  const ogImageUrl = settings?.ogImage ?? null;
  const canonicalUrl = `https://dreamysuite.com/${escHtml(siteSlug)}`;

  const { fonts: fontsTag, css: siteCss } = buildStyles(settings);

  // Animation
  const animation = settings?.animation ?? null;
  const envelopeColor = settings?.envelopeColor ?? null;
  const sealInitials = settings?.sealInitials ?? null;
  const cardColor = settings?.cardColor ?? null;
  const cardImage = settings?.cardImage ?? null;
  const popupBundleActive =
    !!settings?.popupBundle &&
    !!animation &&
    animation !== "none" &&
    animation !== "envelope";
  const introHtml = buildIntroHtml(
    animation,
    eventTitle,
    eventDate,
    envelopeColor,
    sealInitials,
    cardColor,
    cardImage,
    settings?.bgImage ?? null,
    popupBundleActive,
    settings?.popupTitle ?? null,
    greeting,
  );
  // Self-hosted gsap UMD (built into /effects/vendor by build-public-effects.mjs)
  // for intro animations + block presets that use the global `gsap`. No CDN.
  const gsapCdn =
    introHtml || usedBlockPresets.size > 0
      ? `<script defer src="/effects/vendor/gsap.min.js"></script>\n  <script defer src="/effects/vendor/CustomEase.min.js"></script>${blockPresetNeedsScrollTrigger ? '\n  <script defer src="/effects/vendor/ScrollTrigger.min.js"></script>' : ""}`
      : "";

  const triggerPopupAfterAnim = showPopup && !!animation && !popupBundleActive;
  const introScript = introHtml
    ? `<script>
// Run after DOMContentLoaded so the deferred gsap/CustomEase scripts (which
// execute before that event) are loaded — the intro calls gsap at top level,
// and running before gsap loaded threw and left click-to-enter unwired.
document.addEventListener('DOMContentLoaded', function() {
var _animKey = 'dsuite_intro_${escHtml(siteSlug)}_${escHtml(animation ?? "")}';
var _introOpened = !!sessionStorage.getItem(_animKey);

function _addReplayBtn() {
  var btn = document.getElementById('_intro_replay_btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = '_intro_replay_btn';
    btn.className = 'intro-replay-btn';
    btn.setAttribute('aria-label','Replay entrance animation');
    btn.textContent = '\u21ba replay';
    document.body.appendChild(btn);
    btn.onclick = function() {
      btn.classList.remove('visible');
      var el = document.getElementById('intro-overlay');
      if (!el) return;
      gsap.killTweensOf('*');
      el.style.display = '';
      gsap.set(el, { opacity:1, scale:1, clearProps:'background' });
      ${
        animation === "envelope"
          ? `
      gsap.set('.envfs-card',       { xPercent:-50, yPercent:-50, y:'100vh', opacity:0, scale:1, filter:'blur(12px)' });
      gsap.set('.envfs-flap',       { rotateX:0 });
      gsap.set('.envfs-glow',       { opacity:0 });
      gsap.set('.envfs-names',      { opacity:1, y:0 });
      gsap.set('.envfs-light-sweep',{ opacity:0, backgroundPosition:'160% 160%' });
      gsap.set('#intro-lbox-t',     { height:48 });
      gsap.set('#intro-lbox-b',     { height:48 });
      gsap.set('.intro-env-fs',     { clearProps:'scale,y,opacity' });
      var _namesEl = document.querySelector('.envfs-names');
      if (_namesEl) _namesEl.style.animation = 'envfs-names-bounce 2s ease-in-out infinite';
      `
          : animation === "doors"
            ? `
      gsap.set('.door-l', { rotateY:0, opacity:1 });
      gsap.set('.door-r', { rotateY:0, opacity:1 });
      gsap.set('.door-glow', { width:'3px', filter:'blur(2px)', opacity:1 });
      gsap.set('.door-cue', { opacity:1 });
      gsap.set('.door-centre-text', { opacity:1 });
      gsap.set('.door-smoke-cloud', { scaleY:1, scaleX:1, y:'0%', opacity:1, clearProps:'background' });
      gsap.set('.door-light-flood', { scaleX:0.1, scaleY:0.1, opacity:0 });
      gsap.set('.door-ao',            { opacity:0.55, width:'70px' });
      gsap.set('.door-surface-light', { opacity:0 });
      `
            : animation === "storybook"
              ? `
      gsap.set('.book-cover', { rotateY:0, transformOrigin:'right center' });
      gsap.set(['.book-page-1','.book-page-2','.book-page-3'], { rotateY:0, opacity:1 });
      gsap.set('.book-final-page', { opacity:0 });
      gsap.set('.book-page-bg', { filter:'none' });
      gsap.set('.book-cue', { opacity:1 });
      `
              : ``
      }
      _introOpened = false;
      el.addEventListener('click', openIntro);
      openIntro();
    };
  }
  requestAnimationFrame(function(){ btn.classList.add('visible'); });
}

function _afterAnimDone(el) {
  el.style.display = 'none';
  try { sessionStorage.setItem(_animKey,'1'); } catch(e){}
  _addReplayBtn();
  ${triggerPopupAfterAnim ? `var g=document.getElementById('greeting-overlay');if(g)g.classList.remove('hidden');` : ""}
}
window._closeIntro = function() {
  var el = document.getElementById('intro-overlay');
  if (el) _afterAnimDone(el);
};
function openIntro() {
  if (_introOpened) return;
  _introOpened = true;
  var el = document.getElementById('intro-overlay');
  if (!el) return;
  ${
    animation === "envelope"
      ? `
  gsap.killTweensOf('.intro-env-fs');
  var _namesEl2 = document.querySelector('.envfs-names');
  if (_namesEl2) _namesEl2.style.animation = 'none';
  gsap.set('.envfs-card',        { xPercent:-50, yPercent:-50, y:'100vh', opacity:0, filter:'blur(12px)' });
  gsap.set('#intro-lbox-t',      { height:48 });
  gsap.set('#intro-lbox-b',      { height:48 });
  gsap.set('.envfs-names',       { opacity:1, y:0 });
  gsap.set('.envfs-light-sweep', { opacity:0, backgroundPosition:'160% 160%' });
  /* Heavy-start, fast-mid, feather-soft landing — like a real weighted flap */
  CustomEase.create('flapHeavy','M0,0 C0.018,0 0.038,0.055 0.09,0.15 0.21,0.44 0.5,0.82 0.68,0.94 0.8,1.01 0.92,1.0 1,1');
  var tl = gsap.timeline({ onComplete: function(){ _afterAnimDone(el); } });
  tl
    /* Names hold for 1s then float up and fade */
    .to('.envfs-names',       { opacity:0, y:-22, duration:0.45, ease:'power2.in' }, 1.0)
    .to(['#intro-lbox-t','#intro-lbox-b'], { height:0, duration:1.25, ease:'power4.inOut' }, 0.3)
    /* Flap opens — custom heavy curve: barely moves then sweeps then settles */
    .to('.envfs-flap',        { rotateX:-200, duration:2.2, ease:'flapHeavy', transformOrigin:'top center' }, 1.62)
    /* Light sweeps across the surface as flap reveals interior */
    .to('.envfs-light-sweep', { opacity:1, backgroundPosition:'-20% -20%', duration:2.4, ease:'power2.inOut' }, 1.62)
    .to('.envfs-light-sweep', { opacity:0, duration:0.9, ease:'power1.in' }, 3.65)
    .to('.envfs-glow',        { opacity:1, duration:1.8, ease:'power1.in' }, 2.42)
    /* Card drifts up on warm air — floats like carried on a breeze, focus resolves unhurried */
    .to('.envfs-card',        { y:0, opacity:1, duration:2.4, ease:'expo.out' }, 3.82)
    .to('.envfs-card',        { filter:'blur(0px)', duration:1.8, ease:'expo.out' }, 3.82)
    .to('.envfs-card',        { scale:1.02, duration:0.6, ease:'sine.inOut' }, 5.82)
    .to('.envfs-card',        { scale:1.0,  duration:0.6, ease:'sine.inOut' }, 6.42)
    .to({},                   { duration:1.5 })
    .to(el,                   { opacity:0, duration:0.95, ease:'power2.in' });
  `
      : animation === "doors"
        ? `
  var _bundleCard = document.getElementById('intro-bundle-card');
  var tl = gsap.timeline({ onComplete: function(){
    if (_bundleCard) {
      el.removeEventListener('click', openIntro);
      gsap.set(el, { background:'rgba(8,4,1,0.92)' });
      gsap.to('.door-smoke-cloud', { background:'radial-gradient(ellipse at 50% 80%,rgba(190,140,55,0.22) 0%,rgba(170,110,35,0.12) 40%,transparent 72%)', duration:0.65 });
      gsap.to(_bundleCard, { opacity:1, scale:1, y:0, duration:0.55, ease:'back.out(1.1)', pointerEvents:'auto', delay:0.18 });
    } else { _afterAnimDone(el); }
  } });
  tl
    .to('.door-cue',          { opacity:0, duration:0.3 }, 0)
    /* Smoke rolls in slowly — atmospheric warmth, not explosion */
    .to('.door-smoke-cloud',  { scaleY:1.55, opacity:0.85, duration:0.58, ease:'power2.out', stagger:0.075 }, 0.05)
    .to('.door-glow',         { width:'100px', filter:'blur(18px)', opacity:1.0, duration:0.75, ease:'power2.in' }, 0.05)
    /* AO deepens as hinges load — anticipation before the doors find courage to open */
    .to('.door-ao',           { opacity:1.0, width:'90px', duration:0.35, ease:'power2.in' }, 0.12)
    /* Doors open with weight — deliberate, unhurried, stepping into a lifelong adventure */
    .to('.door-l',            { rotateY:-122, duration:1.95, ease:'power2.inOut' }, 0.38)
    .to('.door-r',            { rotateY:122,  duration:1.95, ease:'power2.inOut' }, 0.38)
    /* Warm light catches the door face as it swings open */
    .to('.door-surface-light',{ opacity:1, duration:0.55, ease:'power2.in' }, 0.46)
    /* AO releases gently as the doors swing clear */
    .to('.door-ao',           { opacity:0, duration:0.62, ease:'power2.out' }, 0.58)
    .to('.door-surface-light',{ opacity:0, duration:0.82, ease:'power1.in' }, 1.05)
    .to('.door-light-flood',  { scaleX:6, scaleY:4, opacity:1, duration:0.32, ease:'power3.out' }, 0.68)
    .to('.door-light-flood',  { opacity:0, duration:0.95, ease:'power1.in' }, 0.98)
    .to('.door-smoke-cloud',  { y:'-30%', scaleX:2, opacity:0.3, duration:1.0, ease:'power1.out' }, 0.88)
    .to('.door-glow',         { width:'380px', filter:'blur(48px)', opacity:0.5, duration:0.6, ease:'power1.out' }, 0.88)
    .to('.door-glow',         { opacity:0, duration:0.6, ease:'power2.in' }, '-=0.15')
    ${popupBundleActive ? `.to(['.door-l','.door-r','.door-centre-text'], { opacity:0, duration:0.45 }, '-=0.38')` : `.to(el, { opacity:0, duration:0.58, ease:'power2.in' }, '-=0.42')`};
  `
        : animation === "storybook"
          ? `
  var _bundleCard = document.getElementById('intro-bundle-card');
  gsap.set(['.book-page-1','.book-page-2','.book-page-3'], { rotateY:0, transformOrigin:'right center' });
  gsap.set('.book-final-page', { opacity:0 });
  var tl = gsap.timeline({ onComplete: function(){
    if (_bundleCard) {
      el.removeEventListener('click', openIntro);
      gsap.to(_bundleCard, { opacity:1, scale:1, y:0, duration:0.55, ease:'back.out(1.1)', pointerEvents:'auto' });
    } else { _afterAnimDone(el); }
  } });
  tl
    .to('.book-cue',    { opacity:0, duration:0.35 }, 0)
    /* Cover opens — slow, like a cherished memory stirring to life */
    .to('.book-cover',  { rotateY:-60,  duration:1.1,  ease:'power1.inOut', transformOrigin:'right center' }, 0.15)
    /* Pages turn gently one by one — each a quiet breath of nostalgia */
    .to('.book-page-1', { rotateY:-160, duration:0.85, ease:'power2.inOut', transformOrigin:'right center' }, 1.0)
    .to('.book-page-2', { rotateY:-160, duration:0.82, ease:'power2.inOut', transformOrigin:'right center' }, 1.78)
    .to('.book-page-3', { rotateY:-160, duration:0.8,  ease:'power2.inOut', transformOrigin:'right center' }, 2.5)
    /* Cover settles fully open — unhurried final sweep */
    .to('.book-cover',  { rotateY:-162, duration:1.4,  ease:'power2.inOut', transformOrigin:'right center' }, 2.1)
    /* The world inside dissolves in slowly — watercolour warmth, like a Disney fade */
    .to('.book-final-page', { opacity:1, duration:1.1,  ease:'power1.inOut' }, 3.15)
    .to('.book-page-bg', { filter:'brightness(1.12)', duration:0.85, ease:'power1.inOut' }, 3.25)
    ${
      popupBundleActive
        ? `.to(['.book-cover','.book-spine','.book-page-bg','.book-page-1','.book-page-2','.book-page-3'], { opacity:0, duration:0.5 }, '-=0.3')`
        : `.to(el, { opacity:0, duration:0.85, ease:'power2.in' }, '-=0.5')`
    };
  `
          : `
  gsap.to(el, { opacity:0, duration:0.4, onComplete:function(){ _afterAnimDone(el); } });
  `
  }
}
${
  animation === "envelope"
    ? `
if (!_introOpened) {
  gsap.set('.envfs-card',   { xPercent:-50, yPercent:-50, y:'100vh', opacity:0, filter:'blur(12px)' });
  gsap.set('.intro-env-fs', { scale:0.96, y:40, opacity:0 });
  gsap.set('#intro-lbox-t', { height:0 });
  gsap.set('#intro-lbox-b', { height:0 });
  /* Float in on a breeze — expo.out gives the cinematic slow-deceleration drift */
  gsap.timeline()
    .to('.intro-env-fs', { scale:1, y:0, opacity:1, duration:2.4, ease:'expo.out' })
    .to(['#intro-lbox-t','#intro-lbox-b'], { height:48, duration:1.1, ease:'expo.out' }, 0.8);
}`
    : animation === "doors"
      ? `
if (!_introOpened) {
  var _doorsEl = document.getElementById('intro-overlay');
  if (_doorsEl) {
    gsap.set(_doorsEl, { opacity:0, scale:1.03 });
    /* Atmosphere materialises slowly — fog drifts into frame, warmth builds */
    gsap.to(_doorsEl, { opacity:1, scale:1, duration:2.2, ease:'expo.out' });
  }
}`
      : animation === "storybook"
        ? `
if (!_introOpened) {
  var _bookEl = document.getElementById('intro-overlay');
  if (_bookEl) {
    gsap.set(_bookEl, { opacity:0, scale:1.04 });
    /* Book surfaces slowly — like a cherished memory drifting into focus */
    gsap.to(_bookEl, { opacity:1, scale:1, duration:2.8, ease:'expo.out' });
  }
}`
        : ""
}
if (_introOpened) {
  var _skipEl = document.getElementById('intro-overlay');
  if (_skipEl) _afterAnimDone(_skipEl);
} else {
  document.getElementById('intro-overlay').addEventListener('click', openIntro);
  document.addEventListener('keydown', function(e){
    if (e.key==='Enter' || e.key===' ') openIntro();
  });
}
});
</script>`
    : "";

  // Music player — supports YouTube, Spotify, SoundCloud, direct audio
  const musicUrl = settings?.musicUrl ?? null;
  let musicPlayerHtml = "";
  let musicScript = "";
  if (musicUrl) {
    const musicSource = parseMusicSource(musicUrl);
    if (musicSource) {
      if (musicSource.type === "youtube") {
        const vid = escHtml(musicSource.id);
        musicPlayerHtml = `
  <div class="music-player" id="music-player">
    <iframe id="yt-player" src="https://www.youtube.com/embed/${vid}?enablejsapi=1&autoplay=0&loop=1&playlist=${vid}&origin=${encodeURIComponent("https://dreamysuite.com")}" allow="autoplay" style="position:fixed;left:-2px;top:-2px;width:2px;height:2px;pointer-events:none;opacity:0;" title="Background music"></iframe>
    <button class="music-btn" id="music-btn" aria-label="Play background music" onclick="toggleMusic()">&#9834;</button>
  </div>`;
        musicScript = `<script>
var _ytReady=false,_ytPendingPlay=false;
function onYouTubeIframeAPIReady(){_ytReady=true;if(_ytPendingPlay){_ytPendingPlay=false;_ytSendPlay();}}
function _ytSendPlay(){var f=document.getElementById('yt-player');if(f)f.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}','*');}
function toggleMusic(){var f=document.getElementById('yt-player'),b=document.getElementById('music-btn');if(!f||!b)return;if(b.classList.contains('playing')){f.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}','*');b.classList.remove('playing');b.setAttribute('aria-label','Play background music');}else{b.classList.add('playing');b.setAttribute('aria-label','Pause background music');if(f.contentDocument||_ytReady){_ytSendPlay();}else{_ytPendingPlay=true;f.addEventListener('load',function(){if(_ytPendingPlay){_ytPendingPlay=false;_ytSendPlay();}},{once:true});}}}
</script>`;
      } else if (musicSource.type === "spotify") {
        const embedUrl = escHtml(
          `https://open.spotify.com/embed/${musicSource.kind}/${musicSource.id}?theme=0`,
        );
        musicPlayerHtml = `
  <div class="music-player" id="music-player">
    <iframe id="spotify-player" src="${embedUrl}" allow="autoplay; encrypted-media" style="position:fixed;left:-2px;top:-2px;width:300px;height:80px;pointer-events:none;opacity:0;" title="Background music"></iframe>
    <button class="music-btn" id="music-btn" aria-label="Play background music" onclick="toggleMusic()">&#9834;</button>
  </div>`;
        musicScript = `<script>
function toggleMusic(){var b=document.getElementById('music-btn'),f=document.getElementById('spotify-player');if(!b||!f)return;if(b.classList.contains('playing')){f.style.pointerEvents='none';f.style.opacity='0';b.classList.remove('playing');b.setAttribute('aria-label','Play background music');}else{f.style.pointerEvents='auto';f.style.opacity='1';f.style.position='fixed';f.style.bottom='4.5rem';f.style.right='1.5rem';f.style.left='auto';f.style.top='auto';f.style.width='300px';f.style.height='80px';f.style.borderRadius='12px';f.style.zIndex='201';b.classList.add('playing');b.setAttribute('aria-label','Hide music player');}}
</script>`;
      } else if (musicSource.type === "soundcloud") {
        const scUrl = escHtml(
          `https://w.soundcloud.com/player/?url=${encodeURIComponent(musicUrl)}&color=%23B8921A&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`,
        );
        musicPlayerHtml = `
  <div class="music-player" id="music-player">
    <iframe id="sc-player" src="${scUrl}" allow="autoplay" style="position:fixed;left:-2px;top:-2px;width:300px;height:120px;pointer-events:none;opacity:0;" title="Background music"></iframe>
    <button class="music-btn" id="music-btn" aria-label="Play background music" onclick="toggleMusic()">&#9834;</button>
  </div>`;
        musicScript = `<script>
function toggleMusic(){var b=document.getElementById('music-btn'),f=document.getElementById('sc-player');if(!b||!f)return;if(b.classList.contains('playing')){f.style.pointerEvents='none';f.style.opacity='0';b.classList.remove('playing');b.setAttribute('aria-label','Play background music');}else{f.style.pointerEvents='auto';f.style.opacity='1';f.style.position='fixed';f.style.bottom='4.5rem';f.style.right='1.5rem';f.style.left='auto';f.style.top='auto';f.style.width='300px';f.style.height='120px';f.style.borderRadius='12px';f.style.zIndex='201';b.classList.add('playing');b.setAttribute('aria-label','Hide music player');}}
</script>`;
      } else if (musicSource.type === "audio") {
        const audioSrc = escHtml(musicUrl);
        musicPlayerHtml = `
  <div class="music-player" id="music-player">
    <audio id="audio-player" src="${audioSrc}" loop preload="metadata"></audio>
    <button class="music-btn" id="music-btn" aria-label="Play background music" onclick="toggleMusic()">&#9834;</button>
  </div>`;
        musicScript = `<script>
function toggleMusic(){var a=document.getElementById('audio-player'),b=document.getElementById('music-btn');if(!a||!b)return;if(b.classList.contains('playing')){a.pause();b.classList.remove('playing');b.setAttribute('aria-label','Play background music');}else{a.play();b.classList.add('playing');b.setAttribute('aria-label','Pause background music');}}
</script>`;
      }
    }
  }

  // hreflang tags for SEO
  const hreflangTags =
    extraLangs.length > 0
      ? allLangs
          .map((l) => {
            const href =
              l === mainLang
                ? `/${escHtml(siteSlug)}`
                : `/${escHtml(siteSlug)}?_lang=${escHtml(l)}`;
            return `<link rel="alternate" hreflang="${escHtml(l)}" href="${href}" />`;
          })
          .join("\n  ") +
        `\n  <link rel="alternate" hreflang="x-default" href="/${escHtml(siteSlug)}" />`
      : "";

  return `<!DOCTYPE html>
<html lang="${escHtml(currentLang)}"${currentLang === "ar" || currentLang === "he" ? ' dir="rtl"' : ""}>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <meta name="description" content="${escHtml(metaDesc)}" />
  <meta property="og:title" content="${pageTitle}" />
  <meta property="og:description" content="${escHtml(metaDesc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonicalUrl}" />
  ${ogImageUrl ? `<meta property="og:image" content="${escHtml(ogImageUrl)}" />` : ""}
  <meta name="twitter:card" content="${ogImageUrl ? "summary_large_image" : "summary"}" />
  <meta name="twitter:title" content="${pageTitle}" />
  <meta name="twitter:description" content="${escHtml(metaDesc)}" />
  ${ogImageUrl ? `<meta name="twitter:image" content="${escHtml(ogImageUrl)}" />` : ""}
  <link rel="canonical" href="${canonicalUrl}" />
  ${hreflangTags}
  ${fontsTag}
  ${gsapCdn}
  ${(() => {
    const allEffects = [
      settings?.effectBg,
      settings?.effectText,
      settings?.effectCard,
      settings?.effectTransition,
      settings?.effectCursor,
      settings?.effectDecoration,
      settings?.effectNavStyle,
    ].filter(Boolean) as string[];
    if (!allEffects.length) return "";
    // Self-hosted importmap → /effects/vendor/* (built by build-public-effects.mjs).
    // No esm.sh / cdnjs runtime dependency. Keys mirror the exact bare specifiers
    // the effect bundles import; react/react-dom/react-dom/client resolve to one
    // canonical module (single react instance — see build script). Emitting every
    // key unconditionally is safe: the browser only fetches modules it imports.
    return `<script type="importmap">${JSON.stringify({
      imports: {
        react: "/effects/vendor/react-dom.js",
        "react-dom": "/effects/vendor/react-dom.js",
        "react-dom/client": "/effects/vendor/react-dom.js",
        "react/jsx-runtime": "/effects/vendor/react-jsx-runtime.js",
        "motion/react": "/effects/vendor/motion-react.js",
        three: "/effects/vendor/three.js",
        "three/src/math/MathUtils.js": "/effects/vendor/three-mathutils.js",
        "three/examples/jsm/postprocessing/EffectComposer.js":
          "/effects/vendor/three-effectcomposer.js",
        "three/examples/jsm/postprocessing/Pass.js":
          "/effects/vendor/three-pass.js",
        "three/examples/jsm/postprocessing/RenderPass.js":
          "/effects/vendor/three-renderpass.js",
        "three/examples/jsm/postprocessing/ShaderPass.js":
          "/effects/vendor/three-shaderpass.js",
        "three/examples/jsm/postprocessing/UnrealBloomPass.js":
          "/effects/vendor/three-unrealbloompass.js",
        "three/examples/jsm/loaders/OBJLoader.js":
          "/effects/vendor/three-objloader.js",
        "three/examples/jsm/environments/RoomEnvironment.js":
          "/effects/vendor/three-roomenvironment.js",
        ogl: "/effects/vendor/ogl.js",
        gsap: "/effects/vendor/gsap.js",
        "gsap/ScrollTrigger": "/effects/vendor/gsap.js",
        "gsap/Draggable": "/effects/vendor/gsap.js",
        postprocessing: "/effects/vendor/postprocessing.js",
        "@react-three/fiber": "/effects/vendor/r3f-fiber.js",
        "@react-three/drei": "/effects/vendor/r3f-drei.js",
        "@react-three/postprocessing": "/effects/vendor/r3f-postprocessing.js",
      },
    })}</script>`;
  })()}
  <style>${siteCss}
  .lang-select{appearance:none;border:1px solid var(--site-border,#e7e5e4);border-radius:6px;padding:0.375rem 1.75rem 0.375rem 0.625rem;font-family:inherit;font-size:0.8125rem;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M3 4.5L6 7.5L9 4.5'/%3E%3C/svg%3E") no-repeat right 0.5rem center;cursor:pointer;outline:none;color:var(--text,#292524)}
  /* ── Responsive: Reflow mode ── */
  /* Keep one page visible at a time on mobile so the (hamburger) nav still
     switches pages — without this scope the reflow forced every page-section
     visible, stacking all pages into one scroll and breaking navigation. */
  body.ds-reflow .page-section.active{display:flex!important;flex-direction:column!important}
  body.ds-reflow .block[data-block-id]{width:100%!important;margin-left:0!important;margin-right:0!important;transform:none!important;height:auto!important;position:static!important;z-index:auto!important;padding-left:1rem!important;padding-right:1rem!important}
  body.ds-reflow .block h1,body.ds-reflow .block h2,body.ds-reflow .block h3,body.ds-reflow .section-heading,body.ds-reflow .hero-title{font-size:clamp(1.25rem,5vw,2.5rem)!important}
  body.ds-reflow .block p,body.ds-reflow .block li,body.ds-reflow .block dd,body.ds-reflow .block dt,body.ds-reflow .block label,body.ds-reflow .text-body{font-size:clamp(0.875rem,3.5vw,1rem)!important}
  body.ds-reflow .block img,body.ds-reflow .block video{width:100%!important;height:auto!important;object-fit:cover}
  body.ds-reflow .block iframe{width:100%!important}
  body.ds-reflow [style*="grid-template-columns"]{grid-template-columns:1fr!important}
  body.ds-reflow .timeline-item{flex-direction:column!important}
  body.ds-reflow .site-nav-links{display:none!important}
  body.ds-reflow .lang-toggle{display:none!important}
  body.ds-reflow .site-nav-row .site-nav-lang-outside{display:none!important}
  .ds-hamburger{display:none;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;padding:0.5rem;color:var(--nav-link,#78716c)}
  body.ds-reflow .ds-hamburger{display:flex}
  .ds-mobile-menu{display:none;position:absolute;top:100%;left:0;right:0;background:var(--nav-bg,rgba(255,255,255,0.65));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:0 0 12px 12px;padding:0.5rem;flex-direction:column;gap:0.25rem;box-shadow:0 4px 16px rgba(0,0,0,0.1)}
  .ds-mobile-menu.open{display:flex}
  .ds-mobile-menu-item{background:none;border:none;padding:0.75rem 1rem;font-family:inherit;font-size:0.9375rem;color:var(--nav-link,#78716c);cursor:pointer;text-align:left;border-radius:8px;transition:background 0.15s}
  .ds-mobile-menu-item:hover{background:rgba(0,0,0,0.05)}
  </style>
</head>
<body>
  ${settings?.effectBg ? `<div id="effect-bg" style="position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;" aria-hidden="true"></div>` : ""}
  ${settings?.effectCursor ? `<div id="effect-cursor" style="position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden;" aria-hidden="true"></div>` : ""}
  ${settings?.effectDecoration ? `<div id="effect-decoration" style="position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden;" aria-hidden="true"></div>` : ""}
  ${escapedBgImageUrl ? `<div id="bg-overlay" style="position:fixed;inset:0;z-index:0;pointer-events:none;background-image:url('${escapedBgImageUrl}');background-size:auto ${Math.max(100, Number(settings?.bgImageZoom ?? 100) || 100)}%;background-repeat:no-repeat;background-position:${settings?.bgImagePositionX ?? 50}% ${settings?.bgImagePositionY ?? 50}%;opacity:${settings?.bgImageOpacity ?? 1};display:${settings?.bgImageLayer === "overlay" ? "" : "none"};"></div>` : ""}
  ${(() => {
    if (!settings?.backgroundImage) return "";
    try {
      const bi = JSON.parse(settings.backgroundImage) as {
        url?: string;
        opacity?: number;
        fit?: string;
        position?: string;
        scope?: string;
      };
      if (!bi?.url || bi.scope === "page") return "";
      const safebi = safeUrl(bi.url)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
      const bsize =
        bi.fit === "cover"
          ? "cover"
          : bi.fit === "contain"
            ? "contain"
            : "auto";
      const brepeat = bi.fit === "repeat" ? "repeat" : "no-repeat";
      const bpos = bi.position ?? "center";
      const bop = bi.opacity ?? 1;
      return `<div id="page-bg-image" style="position:fixed;inset:0;z-index:0;pointer-events:none;background-image:url('${safebi}');background-size:${bsize};background-repeat:${brepeat};background-position:${bpos};background-attachment:fixed;opacity:${bop};"></div>`;
    } catch {
      return "";
    }
  })()}
  <div class="margin-curtain-t"></div>
  <div class="margin-curtain-b"></div>
  <div class="margin-curtain-l"></div>
  <div class="margin-curtain-r"></div>
  ${introHtml}
  ${introScript}
  ${greetingHtml}
  ${navHtml}
  <div id="site-content"${contentPadStyle} data-designed-at-width="${designedAtWidth}">
  ${langFallbackBanner}${fallbackHtml}
  ${pageSectionsHtml}
  </div>
  ${musicPlayerHtml}
  ${langToggleHtml}
  ${langContentJson ? `<script type="application/json" id="lang-content-data">${langContentJson}</script>` : ""}
  ${navScript}
  ${hasCountdown ? buildCountdownScript() : ""}
  ${buildMessageListenerScript()}
  ${musicScript}
  ${langScript}
  ${blockAnimScript}
  <script>
function submitRsvp(event, slug, formId, msgId) {
  event.preventDefault();
  var form = document.getElementById(formId);
  var msgEl = document.getElementById(msgId);
  if (!form || !msgEl) return;
  var data = new FormData(form);
  var body = {
    firstName: data.get('firstName') || '',
    lastName: data.get('lastName') || '',
    email: data.get('email') || '',
    attending: data.get('attending') || '',
    notes: data.get('notes') || ''
  };
  var submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending\u2026'; }
  fetch('/api/public/' + encodeURIComponent(slug) + '/rsvp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
  .then(function(res) { return res.json(); })
  .then(function(result) {
    form.style.display = 'none';
    msgEl.style.display = 'block';
    if (result.ok) {
      msgEl.style.background = '#f0fdf4';
      msgEl.style.color = '#166534';
      msgEl.style.border = '1px solid #bbf7d0';
      msgEl.textContent = result.message || 'Thank you! Your RSVP has been received.';
    } else {
      form.style.display = 'block';
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send RSVP'; }
      msgEl.style.background = '#fef2f2';
      msgEl.style.color = '#991b1b';
      msgEl.style.border = '1px solid #fecaca';
      var msg = (result.error && result.error.message) ? result.error.message : 'Something went wrong. Please try again.';
      msgEl.textContent = msg;
    }
  })
  .catch(function() {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Send RSVP'; }
    msgEl.style.display = 'block';
    msgEl.style.background = '#fef2f2';
    msgEl.style.color = '#991b1b';
    msgEl.style.border = '1px solid #fecaca';
    msgEl.textContent = 'Network error. Please check your connection and try again.';
  });
}
function submitGuestBook(event, siteId, formId, listId) {
  event.preventDefault();
  var form = document.getElementById(formId);
  var listEl = document.getElementById(listId);
  if (!form) return;
  var data = new FormData(form);
  var body = {
    name: data.get('name') || '',
    message: data.get('message') || ''
  };
  var submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending\u2026'; }
  fetch('/api/sites/' + encodeURIComponent(siteId) + '/guestbook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
  .then(function(res) { return res.json(); })
  .then(function(result) {
    if (result.entry) {
      form.reset();
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Sign the book'; }
      if (listEl) {
        var entry = result.entry;
        var div = document.createElement('div');
        div.style.cssText = 'padding:0.75rem 1rem;border:1px solid #e7e5e4;border-radius:6px;background:#faf8f5;';
        div.innerHTML = '<strong style="font-size:0.875rem;">' + entry.name.replace(/[&<>"]/g, function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]||c;}) + '</strong>' +
          '<p style="margin:0.25rem 0 0;font-size:0.875rem;color:#57534e;">' + entry.message.replace(/[&<>"]/g, function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]||c;}) + '</p>';
        listEl.prepend(div);
      }
    } else {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Sign the book'; }
      var errMsg = (result.error && result.error.message) ? result.error.message : 'Something went wrong. Please try again.';
      alert(errMsg);
    }
  })
  .catch(function() {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Sign the book'; }
    alert('Network error. Please check your connection and try again.');
  });
}
// Delegated form submit wiring. React-SSR forms carry data-* attributes instead
// of inline onsubmit handlers; submit bubbles to document, so this catches forms
// added on initial load and after dreamysuite_pageChange re-renders alike.
document.addEventListener('submit', function(e) {
  var f = e.target;
  if (!f || typeof f.matches !== 'function') return;
  if (f.matches('form[data-rsvp-slug]')) {
    submitRsvp(e, f.getAttribute('data-rsvp-slug'), f.id, f.getAttribute('data-rsvp-msg'));
  } else if (f.matches('form[data-gb-site]')) {
    submitGuestBook(e, f.getAttribute('data-gb-site'), f.id, f.getAttribute('data-gb-list'));
  }
});
  </script>
  ${
    settings?.effectBg
      ? `<script type="module">
(async()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var c=navigator.hardwareConcurrency||4,m=navigator.deviceMemory||4;
  if(c<=2||m<=2) return;
  var el=document.getElementById('effect-bg');
  if(!el) return;
  try{
    var p=Promise.all([
      import('/effects/${escHtml(settings.effectBg)}.js'),
      import('react'),
      import('react-dom/client')
    ]);
    var intro=document.getElementById('intro-overlay');
    if(intro&&intro.style.display!=='none'&&!intro.hidden){
      await Promise.race([
        new Promise(function(ok){
          new MutationObserver(function(_,o){
            if(intro.style.display==='none'||intro.hidden){o.disconnect();ok()}
          }).observe(intro,{attributes:true,attributeFilter:['style','hidden','class']});
        }),
        new Promise(function(ok){setTimeout(ok,8000)})
      ]);
    }
    var[{default:E},{createElement:h},{createRoot:cr}]=await p;
    var c1=${JSON.stringify(settings.effectColor1 ?? settings.headingColor ?? settings.accentColor ?? "#B8921A")};
    var c2=${JSON.stringify(settings.effectColor2 ?? settings.bodyColor ?? settings.accentColor ?? "#B8921A")};
    var c3=${JSON.stringify(settings.effectColor3 ?? settings.accentColor ?? "#B8921A")};
    cr(el).render(h(E,{color:c1,colors:[c1,c2,c3],lineColor:c1,backgroundColor:"transparent",particleColors:[c1,c2,c3]}));
  }catch(e){console.warn('Effect unavailable:',e)}
})();
</script>`
      : ""
  }
  ${
    settings?.effectCursor
      ? `<script type="module">
(async()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var c=navigator.hardwareConcurrency||4,m=navigator.deviceMemory||4;
  if(c<=2||m<=2) return;
  var el=document.getElementById('effect-cursor');
  if(!el) return;
  try{
    var[{default:E},{createElement:h},{createRoot:cr}]=await Promise.all([
      import('/effects/${escHtml(settings.effectCursor)}.js'),
      import('react'),
      import('react-dom/client')
    ]);
    var c1=${JSON.stringify(settings.effectColor1 ?? settings.accentColor ?? "#B8921A")};
    var c2=${JSON.stringify(settings.effectColor2 ?? settings.accentColor ?? "#B8921A")};
    var c3=${JSON.stringify(settings.effectColor3 ?? settings.accentColor ?? "#B8921A")};
    cr(el).render(h(E,{color:c1,colors:[c1,c2,c3]}));
  }catch(e){console.warn('Cursor effect unavailable:',e)}
})();
</script>`
      : ""
  }
  ${
    settings?.effectDecoration
      ? `<script type="module">
(async()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var el=document.getElementById('effect-decoration');
  if(!el) return;
  try{
    var c1=${JSON.stringify(settings.effectColor1 ?? settings.headingColor ?? settings.accentColor ?? "#B8921A")};
    var c2=${JSON.stringify(settings.effectColor2 ?? settings.bodyColor ?? settings.accentColor ?? "#B8921A")};
    var c3=${JSON.stringify(settings.effectColor3 ?? settings.accentColor ?? "#B8921A")};
    var[{default:E},{createElement:h},{createRoot:cr}]=await Promise.all([
      import('/effects/${escHtml(settings.effectDecoration)}.js'),
      import('react'),
      import('react-dom/client')
    ]);
    cr(el).render(h(E,{color:c1,colors:[c1,c2,c3]}));
  }catch(e){console.warn('Decoration effect unavailable:',e)}
})();
</script>`
      : ""
  }
  ${
    settings?.effectTransition
      ? `<script type="module">
(async()=>{
  if(window.__dsTextDone) await window.__dsTextDone;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try{
    var[{default:E},{createElement:h},{createRoot:cr}]=await Promise.all([
      import('/effects/${escHtml(settings.effectTransition)}.js'),
      import('react'),
      import('react-dom/client')
    ]);
    var isWrapper=${JSON.stringify(["animated-content", "fade-content"].includes(settings.effectTransition ?? ""))};
    function mountTransitions(scope){
      var blocks=scope.querySelectorAll('.block');
      blocks.forEach(function(b){
        if(b.dataset.dsTransition) return;
        b.dataset.dsTransition='1';
        var obs=new IntersectionObserver(function(entries){
          entries.forEach(function(entry){
            if(!entry.isIntersecting) return;
            obs.unobserve(entry.target);
            if(isWrapper){
              var frag=document.createDocumentFragment();
              while(entry.target.firstChild) frag.appendChild(entry.target.firstChild);
              var mount=document.createElement('div');
              mount.style.cssText='width:100%';
              entry.target.appendChild(mount);
              var done=false;
              cr(mount).render(h(E,{},h('div',{ref:function(el){
                if(el&&!done){done=true;el.appendChild(frag)}
              }})));
            }else{
              entry.target.style.position='relative';
              var wrap=document.createElement('div');
              wrap.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1';
              entry.target.appendChild(wrap);
              cr(wrap).render(h(E,{}));
            }
          });
        },{threshold:0.1});
        obs.observe(b);
      });
    }
    mountTransitions(document);
    window.addEventListener('dreamysuite_pageChange',function(){
      var active=document.querySelector('.page-section.active');
      if(active) mountTransitions(active);
    });
  }catch(e){console.warn('Transition effect unavailable:',e)}
})();
</script>`
      : ""
  }
  ${
    settings?.effectText
      ? `<script type="module">
window.__dsTextDone=(async()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try{
    var[{default:E},{createElement:h},{createRoot:cr}]=await Promise.all([
      import('/effects/${escHtml(settings.effectText)}.js'),
      import('react'),
      import('react-dom/client')
    ]);
    var c1=${JSON.stringify(settings.effectColor1 ?? settings.headingColor ?? settings.accentColor ?? "#B8921A")};
    var c2=${JSON.stringify(settings.effectColor2 ?? settings.bodyColor ?? settings.accentColor ?? "#B8921A")};
    var c3=${JSON.stringify(settings.effectColor3 ?? settings.accentColor ?? "#B8921A")};
    var headings=document.querySelectorAll('.page-section.active .block h1,.page-section.active .block h2,.page-section.active .block h3,.page-section.active .block .heading-text');
    headings.forEach(function(el){
      var orig=el.textContent||'';
      try{
        var wrap=document.createElement('span');
        wrap.style.display='inline';
        el.textContent='';
        el.appendChild(wrap);
        cr(wrap).render(h(E,{children:orig,text:orig,sentence:orig,marqueeText:orig,label:orig,texts:[orig],color:c1,colors:[c1,c2,c3]}));
      }catch(_){el.textContent=orig}
    });
  }catch(e){console.warn('Text effect unavailable:',e)}
})();
</script>`
      : ""
  }
  ${
    settings?.effectCard
      ? `<script type="module">
(async()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try{
    var c1=${JSON.stringify(settings.effectColor1 ?? settings.headingColor ?? settings.accentColor ?? "#B8921A")};
    var[{default:E},{createElement:h},{createRoot:cr}]=await Promise.all([
      import('/effects/${escHtml(settings.effectCard)}.js'),
      import('react'),
      import('react-dom/client')
    ]);
    function mountCards(scope){
      var cards=scope.querySelectorAll('.block-registry-card,.block-hotel-card,.block-venue-map,.block-faq');
      cards.forEach(function(el){
        if(el.dataset.dsCard) return;
        el.dataset.dsCard='1';
        var wrap=document.createElement('div');
        wrap.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:inherit';
        el.style.position='relative';
        el.prepend(wrap);
        try{cr(wrap).render(h(E,{color:c1}))}catch(_){wrap.remove()}
        setTimeout(function(){var cv=wrap.querySelector('canvas');if(cv&&cv.parentNode){try{var gl=cv.getContext('webgl2')||cv.getContext('webgl');if(!gl||gl.isContextLost())wrap.remove()}catch(_){wrap.remove()}}},3000);
      });
    }
    mountCards(document);
    window.addEventListener('dreamysuite_pageChange',function(){
      var active=document.querySelector('.page-section.active');
      if(active) mountCards(active);
    });
  }catch(e){console.warn('Card effect unavailable:',e)}
})();
</script>`
      : ""
  }
  ${
    settings?.effectNavStyle && hasMultiplePages
      ? (() => {
          const nsAccent = escHtml(
            settings.navHighlightColor ?? settings.accentColor ?? "#B8921A",
          );
          const nsBg = escHtml(settings.navBg ?? "#ffffff");
          const nsText = escHtml(settings.navLinkColor ?? "#6B6560");
          const nsBrand = escHtml(settings.navBrandColor ?? "#1C1917");
          const nsHFont = escHtml(settings.headingFont ?? "Georgia, serif");
          const nsBFont = escHtml(settings.bodyFont ?? "system-ui, sans-serif");
          const nsBrandName = settings.eventName ?? "";
          const nsInitials = (settings.eventName ?? "")
            .split(/[\s&+]+/)
            .map((w: string) => w.charAt(0))
            .filter(Boolean)
            .join("")
            .toUpperCase()
            .slice(0, 3);
          const nsLogoSvg = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="${nsAccent}"/><text x="40" y="40" text-anchor="middle" dominant-baseline="central" font-family="Georgia,serif" font-size="24" font-weight="bold" fill="#fff">${nsInitials}</text></svg>`)}`;
          return `<script type="module">
(async()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try{
    var navEl=document.querySelector('nav.site-nav');
    var navRow=document.querySelector('.site-nav-row');
    var target=navEl||navRow;
    if(!target) return;
    var[{default:E},{createElement:h},{createRoot:cr}]=await Promise.all([
      import('/effects/${escHtml(settings.effectNavStyle)}.js'),
      import('react'),
      import('react-dom/client')
    ]);
    var linkSource=navEl||target;
    var links=linkSource.querySelectorAll('.site-nav-links button,.site-nav-links a');
    var accent=${JSON.stringify(nsAccent)};
    var items=[];
    links.forEach(function(a){
      if(a.closest('.lang-toggle')||a.classList.contains('lang-btn')||a.classList.contains('lang-select')) return;
      if(a.classList.contains('site-nav-brand')||a.classList.contains('site-nav-brand-outside')) return;
      var label=a.textContent||'';
      if(!label.trim()) return;
      var pageId=a.getAttribute('data-page')||'';
      items.push({label:label,href:'#',pageId:pageId,icon:label.charAt(0).toUpperCase(),color:accent,isActive:a.classList.contains('active')||a.getAttribute('aria-current')==='page',onClick:function(){if(pageId)showPage(pageId)}});
    });
    if(!items.length) return;
    var isCompact=window.innerWidth<768;
    var wrap=document.createElement('div');
    wrap.style.cssText=isCompact?'width:auto;display:inline-block;padding:4px 0 0 4px;':'width:100%';
    var restoreEl=navEl||target;
    var savedHtml=restoreEl.innerHTML;
    var savedStyle=restoreEl.getAttribute('style')||'';
    try{
      if(navRow&&navEl){
        navEl.style.cssText='background:none;border:none;box-shadow:none;padding:0;border-radius:0;backdrop-filter:none;-webkit-backdrop-filter:none;';
        navEl.innerHTML='';
        navEl.appendChild(wrap);
      }else{
        target.style.cssText='background:none;border:none;box-shadow:none;padding:0;border-radius:0;backdrop-filter:none;-webkit-backdrop-filter:none;border-bottom:none;';
        target.innerHTML='';
        target.appendChild(wrap);
      }
      var root=cr(wrap);
      function renderNav(){
        var updatedItems=items.map(function(it){
          return Object.assign({},it,{isActive:it.pageId?document.querySelector('.page-section#page-'+it.pageId+'.active')!==null:it.isActive});
        });
        root.render(h(E,{
          items:updatedItems,
          logo:${JSON.stringify(nsLogoSvg)},
          logoAlt:${JSON.stringify(nsInitials)},
          accent:accent,
          bg:${JSON.stringify(nsBg)},
          textColor:${JSON.stringify(nsText)},
          brandColor:${JSON.stringify(nsBrand)},
          headingFont:${JSON.stringify(nsHFont)},
          bodyFont:${JSON.stringify(nsBFont)},
          brandName:${JSON.stringify(nsBrandName)},
          compact:window.innerWidth<768
        }));
      }
      renderNav();
      window.addEventListener('dreamysuite_pageChange',renderNav);
    }catch(renderErr){
      console.warn('Nav style render failed, restoring:',renderErr);
      restoreEl.innerHTML=savedHtml;
      if(savedStyle)restoreEl.setAttribute('style',savedStyle);else restoreEl.removeAttribute('style');
    }
  }catch(e){console.warn('Nav style unavailable:',e)}
})();
</script>`;
        })()
      : ""
  }
  ${buildResponsiveScript()}
  ${buildLazyVideoScript()}
</body>
</html>`;
}
