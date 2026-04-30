import { escHtml } from "./helpers";

// ── Intro overlay builder ─────────────────────────────────────────────────────

export function buildIntroHtml(
  animation: string | null,
  eventTitle: string,
  eventDate: string | null,
  envelopeColor: string | null,
  sealInitials: string | null,
  cardColor: string | null,
  cardImage: string | null,
  bgImage: string | null,
  popupBundle: boolean,
  popupTitle: string | null,
  popupGreeting: string | null
): string {
  if (!animation || animation === "none") return "";
  const title = escHtml(eventTitle);
  const date = eventDate ? escHtml(eventDate) : "";

  // Bundle card shared HTML (used by doors + storybook when popupBundle=true)
  const bundleCardHtml = popupBundle && (popupTitle || popupGreeting)
    ? `<div class="intro-bundle-card" id="intro-bundle-card">
        ${popupTitle ? `<p class="intro-bundle-card-title">${escHtml(popupTitle)}</p>` : ""}
        ${popupGreeting ? `<p class="intro-bundle-card-body">${escHtml(popupGreeting)}</p>` : ""}
        <button class="intro-bundle-card-close" onclick="window._closeIntro()">View Site</button>
      </div>`
    : "";

  function extractInitials(t: string): string {
    const parts = t.split(/\s*[&+]\s*|\s+and\s+/i).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) return parts.map((p) => p.charAt(0).toUpperCase()).join(" · ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return "&#10086;";
  }
  const sealText = sealInitials ? escHtml(sealInitials) : extractInitials(title);

  if (animation === "envelope") {
    const envStyle = envelopeColor ? ` style="--env-color:${escHtml(envelopeColor)}"` : "";
    const cardBg = cardImage ? `url('${escHtml(cardImage)}')` : "";
    const letterStyle = (cardColor || cardImage)
      ? ` style="${cardColor ? `--card-color:${escHtml(cardColor)};` : ""}${cardBg ? `background-image:${cardBg};background-size:cover;background-position:center;` : ""}"`
      : "";
    // Envelope card: use popup content when available, fall back to event name + date
    const cardHeading = popupTitle ? escHtml(popupTitle) : title;
    const cardBody = popupGreeting
      ? `<p class="envfs-card-date">${escHtml(popupGreeting)}</p>`
      : (date ? `<p class="envfs-card-date">${date}</p>` : "");
    // Split couple names for stacked display
    const rawParts = eventTitle.split(/\s*[&+]\s*|\s+and\s+/i).map(s => s.trim()).filter(Boolean);
    const namesHtml = rawParts.length >= 2
      ? `<span class="envfs-name-line">${escHtml(rawParts[0])}</span><span class="envfs-names-amp">&amp;</span><span class="envfs-name-line">${escHtml(rawParts.slice(1).join(" "))}</span>`
      : `<span class="envfs-name-line">${title}</span>`;
    return `<div id="intro-overlay" class="intro-overlay intro-env-fs" role="button" tabindex="0" aria-label="Click to open invitation"${envStyle}>
  <div class="envfs-body">
    <div class="envfs-left-fold"></div>
    <div class="envfs-right-fold"></div>
    <div class="envfs-bottom-fold"></div>
    <div class="envfs-glow"></div>
    <div class="intro-dust">
      <div class="dust-mote" style="--sz:2px;--by:14%;--bx:27%;--dur:11s;--delay:0.4s;--dx:-28px;--op:0.5"></div>
      <div class="dust-mote" style="--sz:3px;--by:21%;--bx:64%;--dur:9s;--delay:2.0s;--dx:22px;--op:0.6"></div>
      <div class="dust-mote" style="--sz:2px;--by:9%;--bx:44%;--dur:13s;--delay:0.9s;--dx:34px;--op:0.4"></div>
      <div class="dust-mote" style="--sz:3px;--by:33%;--bx:79%;--dur:8s;--delay:3.4s;--dx:-24px;--op:0.55"></div>
      <div class="dust-mote" style="--sz:2px;--by:26%;--bx:11%;--dur:10s;--delay:1.5s;--dx:16px;--op:0.45"></div>
    </div>
    <div class="envfs-card"${letterStyle}>
      <div class="envfs-card-ornament">&#10038; &middot; &#10038;</div>
      <p class="envfs-card-name">${cardHeading}</p>
      ${cardBody}
    </div>
  </div>
  <div class="envfs-flap">
    <div class="envfs-flap-noise"></div>
  </div>
  <div class="envfs-names">${namesHtml}</div>
  <div class="envfs-shimmer"></div>
  <div class="envfs-light-sweep"></div>
  <div class="intro-lbox intro-lbox-t" id="intro-lbox-t"></div>
  <div class="intro-lbox intro-lbox-b" id="intro-lbox-b"></div>
  <div class="intro-vignette"></div>
  <div class="intro-grain"></div>
</div>`;
  }

  if (animation === "storybook") {
    const bgImgStyle = bgImage ? ` style="background-image:url('${escHtml(bgImage)}')"` : "";
    const finalPageClass = bgImage ? "book-final-page book-final-page-image" : "book-final-page book-final-page-parchment";
    const parchmentExtras = !bgImage ? `
    <div class="book-petal" style="--left:18%;--dur:9s;--delay:0.8s;--drift:25px;--rot:240deg;"></div>
    <div class="book-petal" style="--left:42%;--dur:11s;--delay:2.4s;--drift:-30px;--rot:310deg;"></div>
    <div class="book-petal" style="--left:67%;--dur:8.5s;--delay:1.1s;--drift:20px;--rot:180deg;"></div>
    <div class="book-petal" style="--left:31%;--dur:12s;--delay:4.2s;--drift:-22px;--rot:290deg;"></div>
    <div class="book-sparkle" style="top:15%;left:12%;--dur:5s;--delay:0s;"></div>
    <div class="book-sparkle" style="top:20%;right:14%;left:auto;--dur:4.5s;--delay:2.1s;"></div>` : "";
    return `<div id="intro-overlay" class="intro-overlay intro-book" role="button" tabindex="0" aria-label="Click to open">
  <div class="book-page-bg"></div>
  <div class="${finalPageClass}"${bgImgStyle}>${parchmentExtras}
  </div>
  <div class="book-page-3"></div>
  <div class="book-page-2"></div>
  <div class="book-page-1"></div>
  <div class="book-cover">
    <div class="book-cover-face">
      <div class="book-ornate-border">
        <div class="book-inner-frame">
          <div class="book-ornament-top">&#10022; &middot; &#10022; &middot; &#10022;</div>
          <div class="book-rule"></div>
          <p class="book-cover-title">${title}</p>
          ${date ? `<p class="book-cover-date">${date}</p>` : ""}
          <div class="book-rule"></div>
          <div class="book-ornament-btm">&#10086;</div>
        </div>
      </div>
    </div>
    <div class="book-cover-back"></div>
  </div>
  <div class="book-spine"></div>
  <p class="book-cue">&#8212; tap to open &#8212;</p>
  ${bundleCardHtml}
  <div class="intro-vignette"></div>
  <div class="intro-grain"></div>
</div>`;
  }

  if (animation === "doors") {
    return `<div id="intro-overlay" class="intro-overlay intro-doors" role="button" tabindex="0" aria-label="Click to enter">
  <div class="door-glow"></div>
  <div class="door door-l">
    <div class="door-ao"></div>
    <div class="door-wood-noise"></div>
    <div class="door-surface-light"></div>
    <div class="door-panel-inset"></div>
    <div class="door-knob door-knob-l"></div>
  </div>
  <div class="door door-r">
    <div class="door-ao"></div>
    <div class="door-wood-noise"></div>
    <div class="door-surface-light"></div>
    <div class="door-panel-inset"></div>
    <div class="door-knob door-knob-r"></div>
  </div>
  <div class="door-smoke">
    <div class="door-smoke-cloud" style="width:90%;height:60%;left:5%;animation:door-cloud-drift-a 11s ease-in-out infinite;"></div>
    <div class="door-smoke-cloud" style="width:58%;height:78%;left:-4%;animation:door-cloud-drift-b 8s ease-in-out 1.2s infinite;"></div>
    <div class="door-smoke-cloud" style="width:56%;height:72%;right:-4%;left:auto;animation:door-cloud-drift-a 9.5s ease-in-out 0.6s infinite;"></div>
    <div class="door-smoke-cloud" style="width:70%;height:55%;left:15%;animation:door-cloud-drift-c 13s ease-in-out 2.1s infinite;"></div>
    <div class="door-smoke-cloud" style="width:48%;height:65%;left:12%;animation:door-cloud-drift-b 10s ease-in-out 3.5s infinite;"></div>
    <div class="door-smoke-cloud" style="width:44%;height:60%;right:10%;left:auto;animation:door-cloud-drift-a 12s ease-in-out 1.8s infinite;"></div>
  </div>
  <div class="door-light-flood"></div>
  <div class="door-centre-text">
    <p class="door-title">${title}</p>
    <p class="door-cue">click to enter</p>
  </div>
  ${bundleCardHtml}
  <div class="intro-vignette"></div>
  <div class="intro-grain"></div>
</div>`;
  }

  return "";
}

// ── Coming soon page ──────────────────────────────────────────────────────────

export function comingSoonHtml(siteName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(siteName)}</title>
  <style>
    body{margin:0;font-family:Georgia,serif;background:#faf8f5;color:#292524;
         display:flex;align-items:center;justify-content:center;min-height:100vh;}
    .wrap{text-align:center;padding:2rem;}
    h1{font-size:2rem;margin:0 0 0.5rem;font-weight:normal;}
    p{color:#78716c;margin:0.5rem 0;}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>${escHtml(siteName)}</h1>
    <p>This site is not yet published. Check back soon!</p>
  </div>
</body>
</html>`;
}

// ── 404 page ──────────────────────────────────────────────────────────────────

export function notFoundHtml(): string {
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
    a{color:#B8921A;text-decoration:none;}
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
