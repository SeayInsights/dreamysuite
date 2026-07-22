import { type SiteSettingRow } from "./types";
import { escHtml, safeUrl } from "./helpers";

// ── CSS ───────────────────────────────────────────────────────────────────────

// System fonts that do not need a Google Fonts import
export const SYSTEM_FONTS = new Set(["Georgia", "Inter"]);

// Google Fonts config: name → URL family param segment
export const GFONTS_MAP: Record<string, string> = {
  "Playfair Display": "Playfair+Display:wght@400;600",
  "Cormorant Garamond": "Cormorant+Garamond:wght@400;600",
  "EB Garamond": "EB+Garamond:wght@400;600",
  Lato: "Lato:wght@400;700",
  Merriweather: "Merriweather:wght@400;700",
  "Source Sans 3": "Source+Sans+3:wght@400;600",
  "Open Sans": "Open+Sans:wght@400;600",
};

export interface BuiltStyles {
  fonts: string;
  css: string;
}

export function buildStyles(settings: SiteSettingRow | null): BuiltStyles {
  const accent = settings?.accentColor ?? "#B8921A";
  const headingFont = settings?.headingFont ?? "Georgia";
  const bodyFont = settings?.bodyFont ?? "Inter";
  const bg = settings?.bgColor ?? "#ffffff";
  const navPosition = settings?.navPosition ?? "fixed";
  const isFixed = navPosition === "fixed" || navPosition === "hide-on-scroll";
  const isScrollAway =
    navPosition === "scroll-away" || navPosition === "static";
  const navLinkPadding = settings?.navLinkPadding ?? "0.875rem";
  const bgImage = settings?.bgImage ?? null;
  // Escape a URL for safe use inside CSS url('...')
  const escapedBgImageUrl = bgImage
    ? safeUrl(bgImage).replace(/\\/g, "\\\\").replace(/'/g, "\\'")
    : null;
  const hasBgImageZoom = settings?.bgImageZoom != null;
  const hasBgImagePosition =
    settings?.bgImagePositionX != null || settings?.bgImagePositionY != null;
  const numberOrDefault = (
    value: number | null | undefined,
    fallback: number,
  ) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  };
  const bgImageSize = `auto ${Math.max(100, numberOrDefault(settings?.bgImageZoom, 100))}%`;
  const bgImagePosition = hasBgImagePosition
    ? `${numberOrDefault(settings?.bgImagePositionX, 50)}% ${numberOrDefault(settings?.bgImagePositionY, 50)}%`
    : "center";
  const bgImageRepeat =
    hasBgImageZoom || hasBgImagePosition
      ? " background-repeat: no-repeat;"
      : "";

  // Google Fonts link tag
  const fontsNeeded = [headingFont, bodyFont]
    .filter((f) => !SYSTEM_FONTS.has(f) && GFONTS_MAP[f])
    .filter((f, i, arr) => arr.indexOf(f) === i); // dedupe
  const fontsTag =
    fontsNeeded.length > 0
      ? `<link rel="preconnect" href="https://fonts.googleapis.com" />\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fontsNeeded.map((f) => `family=${GFONTS_MAP[f]}`).join("&")}&display=swap" />`
      : "";

  const css = `
    :root {
      --site-accent: ${escHtml(accent)};
      --heading-font: ${escHtml(headingFont)}${/(?:^|,)\s*(?:serif|sans-serif|monospace|cursive|fantasy|system-ui)\s*$/i.test(headingFont) ? "" : ", Georgia, serif"};
      --body-font: ${escHtml(bodyFont)}${/(?:^|,)\s*(?:serif|sans-serif|monospace|cursive|fantasy|system-ui)\s*$/i.test(bodyFont) ? "" : ", system-ui, sans-serif"};
      --bg: ${escHtml(bg)};
      --text: ${escHtml(settings?.siteTextColor ?? "#292524")};
      --site-muted: ${escHtml(settings?.bodyColor ?? "#78716c")};
      --site-border: #e7e5e4;
      --site-radius: 12px;
      --max-width: 820px;
      --heading-color: ${escHtml(settings?.headingColor ?? "var(--text)")};
      --body-color: ${escHtml(settings?.bodyColor ?? "var(--site-muted)")};
      --site-text: ${escHtml(settings?.siteTextColor ?? "var(--text)")};
      --site-border: ${escHtml(settings?.siteBorderColor ?? "#e7e5e4")};
      --nav-bg: ${(() => {
        const nb = settings?.navBg ?? "";
        if (!nb || nb === "white") return "rgba(255,255,255,0.96)";
        if (nb === "glass" || nb === "transparent")
          return "rgba(255,255,255,0.65)";
        if (nb === "custom") return "rgba(255,255,255,0.96)";
        return escHtml(nb);
      })()};
      --nav-brand: ${escHtml(settings?.navBrandColor ?? "var(--text)")};
      --nav-link: ${escHtml(settings?.navLinkColor ?? "var(--site-muted)")};
      --nav-highlight: ${escHtml(settings?.navHighlightColor ?? "var(--site-accent)")};
      --nav-link-padding: ${escHtml(navLinkPadding)};
      --music-btn-bg: ${escHtml(settings?.musicBtnBg || "var(--site-accent)")};
      --music-btn-color: ${escHtml(settings?.musicBtnColor || "#ffffff")};
      --section-spacing: ${Number(settings?.sectionSpacing ?? 0) || 0}px;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { scrollbar-width: none; }
    body::-webkit-scrollbar { display: none; }
    body {
      background: var(--bg);
      ${escapedBgImageUrl && settings?.bgImageLayer !== "overlay" && settings?.bgImageBleed !== 0 ? `background-image: url('${escapedBgImageUrl}'); background-size: ${bgImageSize};${bgImageRepeat} background-position: ${bgImagePosition}; background-attachment: fixed;` : ""}
      color: var(--site-text);
      font-family: var(--body-font);
      font-size: 1rem;
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
      ${isFixed ? "padding-top: 4rem;" : ""}
      ${isScrollAway ? "position: relative;" : ""}
    }

    .margin-curtain-t, .margin-curtain-b { position:fixed; left:0; right:0; z-index:9990; pointer-events:none; height:0; overflow:hidden; }
    .margin-curtain-t { top:0; }
    .margin-curtain-b { bottom:0; }
    .margin-curtain-l, .margin-curtain-r { position:fixed; top:0; bottom:0; z-index:9990; pointer-events:none; width:0; overflow:hidden; }
    .margin-curtain-l { left:0; }
    .margin-curtain-r { right:0; }

    ${(() => {
      const mTop = Number(settings?.marginTop ?? 0) || 0;
      const mBottom = Number(settings?.marginBottom ?? 0) || 0;
      const mLeft = Number(settings?.marginLeft ?? 0) || 0;
      const mRight = Number(settings?.marginRight ?? 0) || 0;
      if (!mTop && !mBottom && !mLeft && !mRight) return "";
      const bgVal = escHtml(bg);
      const lines: string[] = [];
      if (mTop > 0)
        lines.push(
          `.margin-curtain-t { height:${mTop}px; background:${bgVal}; }`,
        );
      if (mBottom > 0)
        lines.push(
          `.margin-curtain-b { height:${mBottom}px; background:${bgVal}; }`,
        );
      if (mLeft > 0)
        lines.push(
          `.margin-curtain-l { width:${mLeft}px; background:${bgVal}; }`,
        );
      if (mRight > 0)
        lines.push(
          `.margin-curtain-r { width:${mRight}px; background:${bgVal}; }`,
        );
      lines.push(
        `.site-nav.site-nav, .site-nav-row.site-nav-row { z-index:9991; }`,
      );
      return lines.join("\n    ");
    })()}

    #site-content { min-height: 100dvh; position: relative; }

    ${escapedBgImageUrl && settings?.bgImageLayer !== "overlay" && settings?.bgImageBleed === 0 ? `#site-content { background-image: url('${escapedBgImageUrl}'); background-size: ${bgImageSize};${bgImageRepeat} background-position: ${bgImagePosition}; background-attachment: fixed; }` : ""}

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
        if (!bi?.url) return "";
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
        if (bi.scope === "page") {
          return `#site-content::before { content:''; position:absolute; inset:0; z-index:0; pointer-events:none; background-image:url('${safebi}'); background-size:${bsize}; background-repeat:${brepeat}; background-position:${bpos}; opacity:${bop}; }`;
        }
        return "";
      } catch {
        return "";
      }
    })()}

    /* ── Intro overlay base ── */
    .intro-overlay { position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center; background:transparent; cursor:pointer; overflow:hidden; }

    /* ════════════════════════════════
       FULL-SCREEN ENVELOPE
    ════════════════════════════════ */
    @keyframes envfs-names-bounce {
      0%,100% { transform:translate(-50%,-50%) translateY(0);    filter:drop-shadow(0 4px 18px rgba(0,0,0,0.55)); }
      50%     { transform:translate(-50%,-50%) translateY(-10px); filter:drop-shadow(0 14px 28px rgba(0,0,0,0.32)); }
    }
    .intro-env-fs {
      perspective:1600px;
      background:radial-gradient(ellipse at 50% 38%,#1e0e06 0%,#0a0402 100%);
      cursor:pointer;
    }
    /* Envelope body — fills entire screen */
    .envfs-body { position:absolute; inset:0; background:linear-gradient(135deg,var(--env-color,#e6d5b3),color-mix(in srgb,var(--env-color,#e6d5b3) 78%,#8a6535)); overflow:hidden; }
    /* Inner crease folds */
    .envfs-left-fold {
      position:absolute; top:0; left:0; bottom:0; width:62%;
      background:linear-gradient(to right,color-mix(in srgb,var(--env-color,#e6d5b3) 72%,#6b4c2a) 0%,transparent 100%);
      clip-path:polygon(0 0,100% 50%,0 100%);
    }
    .envfs-right-fold {
      position:absolute; top:0; right:0; bottom:0; width:62%;
      background:linear-gradient(to left,color-mix(in srgb,var(--env-color,#e6d5b3) 72%,#6b4c2a) 0%,transparent 100%);
      clip-path:polygon(100% 0,0 50%,100% 100%);
    }
    .envfs-bottom-fold {
      position:absolute; bottom:0; left:0; right:0; height:56%;
      background:linear-gradient(to top,color-mix(in srgb,var(--env-color,#e6d5b3) 83%,#6b4c2a) 0%,transparent 100%);
      clip-path:polygon(0 100%,50% 0,100% 100%);
    }
    /* Warm glow — hidden until flap opens */
    .envfs-glow {
      position:absolute; inset:0;
      background:radial-gradient(ellipse at 50% 42%,rgba(255,215,140,0.78) 0%,rgba(255,175,65,0.38) 38%,transparent 66%);
      opacity:0; z-index:4; pointer-events:none;
    }
    /* Invitation card — centered, off-screen below initially via GSAP */
    .envfs-card {
      position:absolute; left:50%; top:50%;
      width:min(400px,72vw);
      padding:clamp(1.75rem,4vw,2.75rem) clamp(1.5rem,3vw,2.25rem);
      background:var(--card-color,#fffaf4);
      border-radius:3px;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      text-align:center; z-index:30;
      box-shadow:0 18px 80px rgba(0,0,0,0.6),0 4px 16px rgba(0,0,0,0.35);
      pointer-events:none; opacity:0;
    }
    .envfs-card::before,.envfs-card::after {
      content:''; display:block; width:72%; height:1px;
      background:linear-gradient(to right,transparent,rgba(0,0,0,0.18),transparent);
    }
    .envfs-card::before { margin-bottom:1rem; }
    .envfs-card::after  { margin-top:1rem; }
    .envfs-card-ornament { font-size:1.2rem; opacity:0.3; margin-bottom:0.7rem; letter-spacing:0.35em; }
    .envfs-card-name {
      font-family:var(--heading-font,'Georgia',serif);
      font-size:clamp(1.25rem,4vw,2rem); font-weight:normal;
      color:#1c1008; margin-bottom:0.5rem; line-height:1.2;
    }
    .envfs-card-date { font-size:clamp(0.75rem,1.8vw,0.95rem); color:#78716c; font-style:italic; }
    /* Flap — large triangular top section that rotates open */
    .envfs-flap {
      position:absolute; top:0; left:0; right:0; height:58vh;
      background:linear-gradient(168deg,var(--env-color,#f0e2c8) 28%,color-mix(in srgb,var(--env-color,#f0e2c8) 80%,#5a3820) 100%);
      clip-path:polygon(0 0,100% 0,50% 100%);
      transform-origin:top center; transform-style:preserve-3d;
      z-index:20; will-change:transform;
    }
    .envfs-flap::after {
      content:''; position:absolute; inset:0;
      clip-path:polygon(0 0,100% 0,50% 100%);
      background:linear-gradient(168deg,color-mix(in srgb,var(--env-color,#f0e2c8) 55%,#3d2210) 0%,color-mix(in srgb,var(--env-color,#f0e2c8) 40%,#3d2210) 100%);
      transform:rotateX(180deg); backface-visibility:visible;
    }
    /* Couple's names — bounce over the envelope tip until clicked */
    .envfs-names {
      position:absolute; top:56vh; left:50%;
      transform:translate(-50%,-50%);
      display:flex; flex-direction:column; align-items:center; gap:0.1em;
      z-index:30; pointer-events:none; text-align:center;
      animation:envfs-names-bounce 2s ease-in-out infinite;
    }
    .envfs-name-line {
      font-family:var(--heading-font,'Georgia',serif);
      font-size:clamp(1.6rem,4.5vw,2.8rem);
      font-style:italic; font-weight:normal; line-height:1.1;
      color:rgba(255,255,255,0.93);
      text-shadow:0 2px 18px rgba(0,0,0,0.85),0 1px 4px rgba(0,0,0,0.65);
      letter-spacing:0.01em;
    }
    .envfs-names-amp {
      font-family:var(--heading-font,'Georgia',serif);
      font-size:clamp(0.85rem,2vw,1.15rem);
      font-style:italic; color:rgba(255,220,110,0.88);
      text-shadow:0 1px 8px rgba(0,0,0,0.7);
      letter-spacing:0.1em; line-height:1.5;
    }
    /* Slow shimmer light pass across envelope surface (runs once after entrance) */
    @keyframes envfs-shimmer-move {
      0%   { opacity:0; background-position:130% 0; }
      14%  { opacity:1; }
      86%  { opacity:1; }
      100% { opacity:0; background-position:-130% 0; }
    }
    .envfs-shimmer {
      position:absolute; inset:0; z-index:5; pointer-events:none;
      background:linear-gradient(108deg,transparent 25%,rgba(255,242,205,0.065) 50%,transparent 75%);
      background-size:260% 100%; opacity:0;
      animation:envfs-shimmer-move 3.4s ease-in-out 2.4s 1 forwards;
    }
    /* Dynamic light sweep — surface reflection as flap opens, simulates warm light flooding in */
    .envfs-light-sweep {
      position:absolute; inset:0; z-index:6; pointer-events:none;
      background:linear-gradient(128deg,transparent 18%,rgba(255,248,205,0.055) 46%,rgba(255,244,195,0.038) 52%,transparent 78%);
      background-size:260% 260%; background-position:160% 160%;
      opacity:0; mix-blend-mode:screen;
    }
    /* Flap leather surface micro-noise — breaks up perfect digital gradients */
    .envfs-flap-noise {
      position:absolute; inset:0; pointer-events:none;
      clip-path:polygon(0 0,100% 0,50% 100%);
      opacity:0.042; mix-blend-mode:overlay;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='flapn'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23flapn)'/%3E%3C/svg%3E");
      background-size:180px 180px;
    }

    /* ════════════════════════════════
       DOORS
    ════════════════════════════════ */
    .intro-doors { perspective:1400px; background:radial-gradient(ellipse at 50% 30%,#1a1208 0%,#080604 100%); }
    .door-glow {
      position:absolute; top:0; bottom:0; left:50%; width:3px;
      transform:translateX(-50%); z-index:4; pointer-events:none;
      background:linear-gradient(to bottom,transparent 0%,rgba(255,190,70,0.7) 20%,rgba(255,210,100,1) 50%,rgba(255,190,70,0.7) 80%,transparent 100%);
      box-shadow:0 0 40px 16px rgba(255,175,50,0.18),0 0 100px 40px rgba(255,140,20,0.08);
      filter:blur(2px);
    }
    .door {
      position:absolute; top:0; bottom:0; width:50%;
      background:
        repeating-linear-gradient(3deg,transparent,transparent 4px,rgba(0,0,0,0.06) 4px,rgba(0,0,0,0.06) 5px),
        linear-gradient(175deg,#2e2214 0%,#1e1608 50%,#120e06 100%);
      transform-style:preserve-3d; will-change:transform;
    }
    /* Horizontal panel lines at 30% and 65% */
    .door::before {
      content:''; position:absolute; left:0; right:0; top:30%; height:1px;
      background:rgba(255,220,120,0.07); pointer-events:none;
    }
    .door::after {
      content:''; position:absolute; left:0; right:0; top:65%; height:1px;
      background:rgba(255,220,120,0.06); pointer-events:none;
    }
    .door-l {
      left:0; transform-origin:left center;
      box-shadow:inset -60px 0 120px rgba(0,0,0,0.8),3px 0 6px rgba(0,0,0,0.5);
    }
    .door-r {
      right:0; transform-origin:right center;
      box-shadow:inset 60px 0 120px rgba(0,0,0,0.8),-3px 0 6px rgba(0,0,0,0.5);
    }
    .door-panel-inset {
      position:absolute; top:10%; bottom:10%; left:12%; right:12%;
      border:1px solid rgba(255,220,120,0.12); border-radius:3px;
    }
    .door-panel-inset::before {
      content:''; position:absolute; top:20%; bottom:20%; left:18%; right:18%;
      border:1px solid rgba(255,220,120,0.07); border-radius:2px;
    }
    .door-panel-inset::after {
      content:''; position:absolute; top:8%; left:8%; right:8%;
      height:1px; background:rgba(255,220,120,0.06);
    }
    .door-knob {
      position:absolute; top:50%;
      width:14px; height:14px; border-radius:50%;
      background:radial-gradient(circle at 35% 30%,#fce898,#c4981e);
      box-shadow:0 2px 10px rgba(0,0,0,0.6),inset 0 1px 3px rgba(255,255,255,0.25),0 0 8px rgba(255,200,50,0.2);
      transform:translateY(-50%);
    }
    .door-knob-l { right:22px; }
    .door-knob-r { left:22px; }
    .door-centre-text {
      position:relative; z-index:5;
      text-align:center; pointer-events:none;
      display:flex; flex-direction:column; align-items:center; gap:0.6rem;
    }
    .door-title {
      font-family:var(--heading-font); font-size:clamp(1.4rem,3.5vw,2.4rem);
      font-weight:normal; color:rgba(255,245,215,0.9);
      letter-spacing:0.06em; text-shadow:0 2px 20px rgba(255,180,50,0.2),0 0 60px rgba(255,150,30,0.1);
    }
    .door-cue { font-style:italic; color:rgba(255,210,90,0.45); font-size:0.82rem; letter-spacing:0.14em; }

    /* Ground fog / smoke layer */
    @keyframes door-cloud-drift-a {
      0%,100% { transform:translateX(0) scaleX(1); opacity:0.55; }
      50%     { transform:translateX(20px) scaleX(1.08); opacity:0.7; }
    }
    @keyframes door-cloud-drift-b {
      0%,100% { transform:translateX(0) scaleX(1); opacity:0.45; }
      50%     { transform:translateX(-18px) scaleX(1.06); opacity:0.62; }
    }
    @keyframes door-cloud-drift-c {
      0%,100% { transform:translateX(0); opacity:0.32; }
      50%     { transform:translateX(14px); opacity:0.5; }
    }
    .door-smoke {
      position:absolute; bottom:0; left:0; right:0; height:35%;
      z-index:3; pointer-events:none; overflow:hidden;
    }
    .door-smoke-cloud {
      position:absolute; bottom:0; border-radius:50%;
      background:radial-gradient(ellipse at 50% 80%,rgba(40,20,8,0.55) 0%,rgba(30,15,5,0.3) 40%,transparent 75%);
      pointer-events:none;
      filter:blur(22px) saturate(0.7);
      transform-origin:center bottom;
    }
    /* Warm light flood on door open */
    .door-light-flood {
      position:absolute; top:50%; left:50%;
      transform:translate(-50%,-50%) scaleX(0.1) scaleY(0.1);
      width:100%; height:100%;
      background:radial-gradient(ellipse at 50% 50%,rgba(255,200,100,0.85) 0%,rgba(255,160,50,0.45) 30%,transparent 68%);
      z-index:5; pointer-events:none; opacity:0;
    }
    /* Ambient occlusion strip — deepens crack shadow as doors strain to open */
    .door-ao {
      position:absolute; top:0; bottom:0; width:70px; pointer-events:none; z-index:2; opacity:0.55;
    }
    .door-l .door-ao { right:0; background:linear-gradient(to left,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.38) 40%,transparent 100%); }
    .door-r .door-ao { left:0; background:linear-gradient(to right,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.38) 40%,transparent 100%); }
    /* Wood grain micro-noise — elongated vertical striations (low-X / high-Y turbulence) */
    .door-wood-noise {
      position:absolute; inset:0; pointer-events:none; z-index:1;
      opacity:0.048; mix-blend-mode:overlay;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='wdn'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04 0.32' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23wdn)'/%3E%3C/svg%3E");
      background-size:200px 200px;
    }
    /* Surface light — interior warm light sweeps across door face as it opens */
    .door-surface-light {
      position:absolute; inset:0; pointer-events:none; z-index:3; opacity:0;
    }
    .door-l .door-surface-light { background:linear-gradient(to left,rgba(255,195,85,0.2) 0%,rgba(255,180,60,0.06) 40%,transparent 65%); }
    .door-r .door-surface-light { background:linear-gradient(to right,rgba(255,195,85,0.2) 0%,rgba(255,180,60,0.06) 40%,transparent 65%); }

    /* ════════════════════════════════
       STORYBOOK — Full-screen Disney book
    ════════════════════════════════ */
    .intro-book { background:#1e120a; perspective:2600px; perspective-origin:60% 50%; }
    .book-page-bg {
      position:absolute; inset:0;
      background:radial-gradient(ellipse at 30% 50%,#fff8ee 0%,#f0e0c0 45%,#ddc898 100%);
    }
    .book-cover {
      position:absolute; inset:0; z-index:9;
      transform-origin:right center; transform-style:preserve-3d; will-change:transform;
    }
    .book-cover-face {
      position:absolute; inset:0; backface-visibility:hidden;
      background:
        repeating-linear-gradient(45deg,transparent,transparent 1px,rgba(0,0,0,0.03) 1px,rgba(0,0,0,0.03) 2px),
        repeating-linear-gradient(-45deg,transparent,transparent 1px,rgba(255,255,255,0.012) 1px,rgba(255,255,255,0.012) 2px),
        linear-gradient(160deg,#1c0e08 0%,#2e1a0e 18%,#3d2412 50%,#2a1808 82%,#180c06 100%);
      display:flex; align-items:center; justify-content:center; overflow:hidden;
    }
    .book-cover-face::before {
      content:''; position:absolute; inset:0;
      background-image:repeating-linear-gradient(91deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 3px),
        repeating-linear-gradient(1deg,transparent,transparent 9px,rgba(255,255,255,0.008) 9px,rgba(255,255,255,0.008) 10px);
    }
    /* Aged leather crease marks */
    .book-cover-face::after {
      content:''; position:absolute; inset:0; pointer-events:none;
      background-image:
        linear-gradient(7deg,transparent 22%,rgba(0,0,0,0.045) 22.4%,transparent 22.8%),
        linear-gradient(-4deg,transparent 57%,rgba(0,0,0,0.03) 57.3%,transparent 57.7%),
        linear-gradient(11deg,transparent 70%,rgba(0,0,0,0.025) 70.3%,transparent 70.7%);
    }
    .book-ornate-border {
      position:absolute; inset:clamp(12px,2.5vw,40px);
      border:1px solid rgba(212,175,55,0.65);
    }
    .book-ornate-border::before {
      content:''; position:absolute; inset:9px;
      border:1px solid rgba(212,175,55,0.28);
    }
    .book-ornate-border::after {
      content:''; position:absolute; inset:17px;
      border:1px solid rgba(212,175,55,0.12);
    }
    .book-inner-frame {
      position:absolute; inset:0;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:clamp(0.45rem,1.8vh,1.3rem); padding:clamp(1.2rem,5vw,5rem); text-align:center;
    }
    .book-ornament-top {
      color:rgba(212,175,55,0.52); font-size:clamp(0.62rem,1.4vw,0.95rem);
      letter-spacing:0.52em;
    }
    .book-rule {
      width:clamp(60px,20vw,260px); height:1px;
      background:linear-gradient(to right,transparent,rgba(212,175,55,0.55),rgba(212,175,55,0.75),rgba(212,175,55,0.55),transparent);
    }
    .book-cover-title {
      font-family:var(--heading-font); font-size:clamp(1.7rem,5.5vw,4.8rem);
      font-weight:normal; color:rgba(255,245,210,0.93); letter-spacing:0.07em; line-height:1.2;
      text-shadow:0 0 70px rgba(212,175,55,0.22),0 2px 10px rgba(0,0,0,0.75);
    }
    .book-cover-date {
      font-size:clamp(0.78rem,1.8vw,1.2rem); color:rgba(212,175,55,0.62);
      font-style:italic; letter-spacing:0.14em;
    }
    .book-ornament-btm { color:rgba(212,175,55,0.48); font-size:clamp(1rem,2.5vw,2rem); }
    .book-cover-back {
      position:absolute; inset:0; backface-visibility:hidden;
      transform:rotateY(180deg);
      background:linear-gradient(to left,#f0e4cc 0%,#ecdcbe 40%,#e2d0aa 100%);
    }
    .book-spine {
      position:absolute; right:0; top:0; bottom:0; width:clamp(18px,2vw,38px);
      background:linear-gradient(to right,#0e0706,#1c1008,#0e0706);
      box-shadow:-8px 0 28px rgba(0,0,0,0.65),inset -3px 0 10px rgba(255,255,255,0.03);
      z-index:12; pointer-events:none;
    }
    .book-cue {
      position:absolute; bottom:clamp(1.2rem,3vh,2.5rem); left:0; right:0;
      text-align:center; font-style:italic; color:rgba(212,175,55,0.42);
      font-size:0.82rem; letter-spacing:0.16em; pointer-events:none; z-index:20;
    }
    /* Intermediate flip pages */
    .book-page-1,.book-page-2,.book-page-3 {
      position:absolute; inset:0;
      transform-origin:right center; transform-style:preserve-3d;
      will-change:transform; backface-visibility:hidden;
    }
    .book-page-1 { background:linear-gradient(160deg,#fdf8f0 0%,#f5e8d0 55%,#ecdcc0 100%); z-index:8; }
    .book-page-1::before { content:''; position:absolute; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(0,0,0,0.028) 18px,rgba(0,0,0,0.028) 19px); pointer-events:none; }
    /* Back face — visible when page flips past 90deg, simulates paper reverse */
    .book-page-1::after {
      content:''; position:absolute; inset:0;
      transform:rotateY(180deg); backface-visibility:hidden;
      background:linear-gradient(160deg,#f0e4cc 0%,#e6d4b0 55%,#d8c090 100%);
      box-shadow:inset 4px 0 18px rgba(0,0,0,0.14);
    }
    .book-page-2 { background:linear-gradient(160deg,#fef9f2 0%,#f7ece0 55%,#eedec8 100%); z-index:7; }
    .book-page-2::before { content:''; position:absolute; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(0,0,0,0.022) 18px,rgba(0,0,0,0.022) 19px); pointer-events:none; }
    .book-page-2::after {
      content:''; position:absolute; inset:0;
      transform:rotateY(180deg); backface-visibility:hidden;
      background:linear-gradient(160deg,#f2e6d0 0%,#e8d8b8 55%,#dacc98 100%);
      box-shadow:inset 4px 0 18px rgba(0,0,0,0.12);
    }
    .book-page-3 { background:linear-gradient(160deg,#fdf7ed 0%,#f3e5cc 55%,#e8d5b0 100%); z-index:6; }
    .book-page-3::after {
      content:''; position:absolute; inset:0;
      transform:rotateY(180deg); backface-visibility:hidden;
      background:linear-gradient(160deg,#f0e2c8 0%,#e4d0a8 55%,#d4bc88 100%);
      box-shadow:inset 4px 0 18px rgba(0,0,0,0.11);
    }
    /* Final reveal page */
    .book-final-page {
      position:absolute; inset:0; z-index:4; overflow:hidden; opacity:0;
    }
    .book-final-page-image { background-size:cover; background-position:center; }
    .book-final-page-image::after {
      content:''; position:absolute; inset:0;
      background:radial-gradient(ellipse at 50% 50%,transparent 48%,rgba(0,0,0,0.48) 100%);
    }
    .book-final-page-parchment {
      background:radial-gradient(ellipse at 40% 40%,#fdf6e3 0%,#f0e0b0 60%,#dcc890 100%);
    }
    .book-final-page-parchment::before {
      content:''; position:absolute; inset:0;
      background:radial-gradient(ellipse at 50% 50%,transparent 52%,rgba(10,5,0,0.55) 100%);
    }
    /* Rose petals (parchment default) */
    @keyframes rose-petal-fall {
      0%   { transform:translateY(-6vh) translateX(0) rotate(0deg); opacity:0; }
      8%   { opacity:0.42; }
      92%  { opacity:0.3; }
      100% { transform:translateY(108vh) translateX(var(--drift,28px)) rotate(var(--rot,255deg)); opacity:0; }
    }
    .book-petal {
      position:absolute; top:-4%; left:var(--left,40%);
      width:9px; height:7px; border-radius:60% 40% 60% 40%;
      background:radial-gradient(ellipse,rgba(220,148,118,0.62) 0%,rgba(195,95,85,0.32) 100%);
      pointer-events:none; z-index:2; opacity:0;
      animation:rose-petal-fall var(--dur,10s) var(--delay,0s) ease-in infinite;
    }
    /* Sparkle glints (parchment default) */
    @keyframes sparkle-glint {
      0%,100% { transform:scale(0) rotate(0deg); opacity:0; }
      40%,60% { transform:scale(1) rotate(15deg); opacity:0.72; }
    }
    .book-sparkle {
      position:absolute; width:6px; height:6px; border-radius:50%;
      background:radial-gradient(circle,rgba(255,240,178,0.9) 0%,transparent 100%);
      pointer-events:none; z-index:3; opacity:0;
      animation:sparkle-glint var(--dur,5s) var(--delay,0s) ease-in-out infinite;
    }
    .book-sparkle::before,.book-sparkle::after {
      content:''; position:absolute; background:rgba(255,238,172,0.72); border-radius:2px;
    }
    .book-sparkle::before { width:1px; height:14px; top:-4px; left:2.5px; }
    .book-sparkle::after  { width:14px; height:1px; top:2.5px; left:-4px; }

    /* ════════════════════════════════
       CINEMATIC OVERLAY ELEMENTS
    ════════════════════════════════ */

    /* Film grain */
    @keyframes grain-shift {
      0%,100% { background-position:0% 0%; }
      25%  { background-position:18% 9%; }
      50%  { background-position:-14% 22%; }
      75%  { background-position:9% -12%; }
    }
    .intro-grain {
      position:absolute; inset:0; z-index:90; pointer-events:none;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size:200px 200px;
      animation:grain-shift 0.14s steps(1) infinite;
      mix-blend-mode:overlay; opacity:0.05;
    }

    /* Cinematic letterbox bars */
    .intro-lbox {
      position:absolute; left:0; right:0; z-index:88; pointer-events:none;
      background:#000;
    }
    .intro-lbox-t { top:0;    height:48px; }
    .intro-lbox-b { bottom:0; height:48px; }

    /* Vignette */
    .intro-vignette {
      position:absolute; inset:0; z-index:89; pointer-events:none;
      background:radial-gradient(ellipse at 50% 50%, transparent 42%, rgba(0,0,0,0.78) 100%);
    }

    /* Floating dust motes */
    @keyframes dust-rise {
      0%   { transform:translateY(0) translateX(0); opacity:0; }
      12%  { opacity:1; }
      88%  { opacity:0.55; }
      100% { transform:translateY(-65vh) translateX(var(--dx,18px)); opacity:0; }
    }
    .intro-dust { position:absolute; inset:0; z-index:3; pointer-events:none; overflow:hidden; }
    .dust-mote {
      position:absolute; border-radius:50%;
      width:var(--sz,2px); height:var(--sz,2px);
      background:rgba(255,218,130,var(--op,0.55));
      bottom:var(--by,20%); left:var(--bx,50%);
      animation:dust-rise var(--dur,10s) var(--delay,0s) ease-in-out infinite;
    }

    /* Replay button */
    .intro-replay-btn {
      position:fixed; bottom:4.5rem; right:1.75rem; z-index:201;
      background:rgba(18,10,3,0.76); color:rgba(255,215,120,0.78);
      border:1px solid rgba(255,195,70,0.2); border-radius:999px;
      padding:0.38rem 1.05rem; font-size:0.75rem; letter-spacing:0.15em;
      cursor:pointer; backdrop-filter:blur(8px);
      font-family:var(--heading-font,'Georgia',serif); font-style:italic;
      transition:background 0.25s, color 0.25s, opacity 0.25s;
      opacity:0; pointer-events:none;
    }
    .intro-replay-btn.visible { opacity:1; pointer-events:auto; }
    .intro-replay-btn:hover { background:rgba(36,20,6,0.92); color:rgba(255,235,155,1); }

    /* Mobile: simplify grain + reduce letterbox */
    @media (max-width:600px) {
      .intro-grain { display:none; }
      .intro-lbox-t,.intro-lbox-b { height:28px; }
    }

    /* ── Layout ── */
    .site-wrapper { max-width: var(--max-width); margin: 0 auto; padding: 0 1.25rem; }
    .block { padding: 3.5rem 1.25rem; }
    .block-images, .block-video { padding-left: 0; padding-right: 0; }

    /* ── Hero ── */
    .block-home-hero {
      background: linear-gradient(160deg, color-mix(in srgb, var(--site-accent) 8%, white), var(--bg) 60%);
      text-align: center;
      padding: 5rem 1.25rem 4rem;
    }
    ${
      isFixed
        ? `.page-section.active > .block-home-hero:first-child {
      margin-top: -4rem;
      padding-top: 8rem;
    }`
        : ""
    }
    .hero-inner { max-width: 640px; margin: 0 auto; }
    .hero-eyebrow {
      font-family: var(--body-font);
      font-size: 0.8125rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--site-accent);
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
    .hero-date { font-size: 1.0625rem; color: var(--site-muted); margin-bottom: 0.375rem; }
    .hero-location { font-size: 0.9375rem; color: var(--site-muted); }
    .hero-divider { margin-top: 2rem; font-size: 1.25rem; color: var(--site-accent); opacity: 0.5; }

    /* ── Section heading ── */
    .section-heading {
      font-family: var(--heading-font);
      font-size: clamp(1.5rem, 3.5vw, 2rem);
      font-weight: normal;
      text-align: center;
      color: var(--block-text, var(--heading-color));
      margin-bottom: 0.75rem;
    }
    .section-rule {
      width: 3rem; height: 1px;
      background: var(--site-accent);
      margin: 0 auto 2.5rem;
      opacity: 0.6;
    }

    /* ── Text ── */
    /* Long-form body reads best left-aligned (a centered multi-paragraph block
       has a ragged left edge). The block itself still centers on the page via
       margin auto; owners can re-center per block via the body-align control. */
    .text-body { max-width: 640px; margin: 0 auto; text-align: left; color: var(--block-text, var(--body-color)); font-size: 1.0625rem; }

    /* ── Countdown ── */
    .block-countdown { text-align: center; position: relative; z-index: 1; background: var(--bg, transparent); min-height: 4rem; }
    .countdown-label { font-family: var(--heading-font); font-size: 1.375rem; font-weight: normal; margin-bottom: 1.75rem; }
    .countdown-units { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; }
    .countdown-unit { display: flex; flex-direction: column; align-items: center; min-width: 72px; }
    .countdown-num {
      font-family: var(--heading-font);
      font-size: clamp(2rem, 6vw, 3rem);
      font-weight: normal;
      color: var(--site-accent);
      line-height: 1;
    }
    .countdown-unit-label { font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--site-muted); margin-top: 0.375rem; }
    .video-cd-overlay { position:absolute; left:50%; z-index:10; text-align:center; color:#fff; pointer-events:none; }
    .video-cd-overlay .countdown-units { justify-content:center; }
    .video-cd-overlay .countdown-num { color:#fff; }
    .video-cd-overlay .countdown-unit-label { color:rgba(255,255,255,0.75); }

    /* ── Bundle popup card (inside entrance animations) ── */
    .intro-bundle-card {
      position:absolute; left:50%; top:50%; z-index:50;
      transform:translate(-50%,-50%) scale(0.95);
      width:min(360px,82vw); padding:clamp(1.5rem,4vw,2.5rem) clamp(1.25rem,3vw,2rem);
      background:var(--card-color,#fffaf4); border-radius:4px; text-align:center;
      box-shadow:0 20px 80px rgba(0,0,0,0.55),0 4px 16px rgba(0,0,0,0.3);
      opacity:0; pointer-events:none;
    }
    .intro-bundle-card::before,.intro-bundle-card::after {
      content:''; display:block; width:72%; height:1px; margin:0 auto;
      background:linear-gradient(to right,transparent,rgba(0,0,0,0.15),transparent);
    }
    .intro-bundle-card::before { margin-bottom:1rem; }
    .intro-bundle-card::after  { margin-top:1rem; }
    .intro-bundle-card-title {
      font-family:var(--heading-font,'Georgia',serif);
      font-size:clamp(1.1rem,3.5vw,1.75rem); font-weight:normal;
      color:var(--text,#1c1008); margin-bottom:0.6rem; line-height:1.2;
    }
    .intro-bundle-card-body {
      font-size:clamp(0.8rem,2vw,0.95rem); color:var(--site-muted,#78716c);
      line-height:1.6; margin-bottom:1.25rem;
    }
    .intro-bundle-card-close {
      display:inline-block; padding:0.5rem 1.75rem;
      background:var(--site-accent); color:#fff; border:none;
      border-radius:99px; font-size:0.85rem; cursor:pointer;
      letter-spacing:0.04em; font-family:var(--body-font);
    }

    /* ── Timeline ── */
    .timeline { list-style: none; max-width: 540px; margin: 0 auto; }
    .timeline-item { display: flex; gap: 1.5rem; padding: 1.25rem 0; border-bottom: 1px solid var(--site-border); }
    .timeline-item:last-child { border-bottom: none; }
    .timeline-time { flex-shrink: 0; font-size: 0.875rem; color: var(--site-accent); padding-top: 0.125rem; min-width: 80px; }
    .timeline-content strong { display: block; margin-bottom: 0.25rem; }
    .timeline-content p { font-size: 0.9375rem; color: var(--site-muted); }

    /* ── FAQ ── */
    .faq-list { max-width: 640px; margin: 0 auto; }
    .faq-question {
      font-family: var(--heading-font);
      font-size: 1.0625rem;
      font-weight: normal;
      padding: 1.125rem 0 0.375rem;
      border-top: 1px solid var(--site-border);
    }
    .faq-list dt:first-of-type { border-top: none; }
    .faq-answer { color: var(--site-muted); padding-bottom: 0.75rem; font-size: 0.9375rem; }

    /* ── RSVP ── */
    .rsvp-form { max-width: 480px; margin: 0 auto; }
    .form-group { margin-bottom: 1.375rem; }
    .form-label { display: block; font-size: 0.875rem; letter-spacing: 0.04em; margin-bottom: 0.5rem; color: var(--text); }
    .form-input {
      width: 100%;
      border: 1px solid var(--site-border);
      border-radius: 6px;
      padding: 0.625rem 0.875rem;
      font-family: var(--body-font);
      font-size: 0.9375rem;
      color: var(--text);
      background: #fff;
      outline: none;
      transition: border-color 0.15s;
    }
    .form-input:focus { border-color: var(--site-accent); }
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
    .media-element { width: 100%; border-radius: var(--site-radius); display: block; }
    .video-wrap { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--site-radius); }
    .youtube-iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }

    /* ── Media placeholder ── */
    .media-placeholder {
      border: 2px dashed var(--site-border);
      border-radius: var(--site-radius);
      padding: 3rem 2rem;
      text-align: center;
      color: var(--site-muted);
    }
    .media-placeholder-icon { font-size: 2rem; display: block; margin-bottom: 0.75rem; }

    /* ── Info cards (registry / hotel) ── */
    .info-card {
      max-width: 420px;
      margin: 0 auto;
      border: 1px solid var(--site-border);
      border-radius: var(--site-radius);
      padding: 1.5rem;
      text-align: center;
    }
    .card-title { font-family: var(--heading-font); font-size: 1.25rem; font-weight: normal; margin-bottom: 0.5rem; }
    .card-note { color: var(--site-muted); font-size: 0.9375rem; margin-bottom: 0.75rem; }
    .card-link { font-size: 0.9375rem; font-weight: 500; text-decoration: none; }
    .card-link:hover { text-decoration: underline; }

    /* ── Venue map ── */
    .venue-name { text-align: center; font-family: var(--heading-font); font-size: 1.125rem; font-weight: normal; margin-bottom: 0.375rem; }
    .venue-note { text-align: center; color: var(--site-muted); font-size: 0.9375rem; margin-bottom: 1.25rem; }
    .map-wrap { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--site-radius); max-width: var(--max-width); margin-left: auto; margin-right: auto; }
    .map-iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
    .venue-address { text-align: center; color: var(--site-muted); font-size: 0.875rem; margin-top: 0.75rem; }

    /* ── Placeholder ── */
    .placeholder-text {
      text-align: center;
      color: #d6d3d1;
      font-style: italic;
      font-size: 0.9375rem;
      padding: 1.5rem;
      border: 2px dashed var(--site-border);
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
      border-radius: var(--site-radius);
      padding: 2.5rem;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18);
      overflow: hidden;
    }
    .greeting-title {
      font-family: var(--heading-font);
      font-size: 1.35rem;
      font-weight: normal;
      color: var(--text);
      margin: 0 0 0.75rem;
    }
    .greeting-modal p {
      font-family: var(--heading-font);
      font-size: 1.125rem;
      line-height: 1.65;
      color: var(--text);
      margin-bottom: 1.75rem;
      font-weight: normal;
    }
    .greeting-ticker-wrap {
      overflow: hidden;
      width: 100%;
      margin: -0.75rem 0 1.25rem;
    }
    .greeting-ticker {
      display: inline-block;
      white-space: nowrap;
      font-family: var(--body-font);
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      color: var(--site-accent);
      text-transform: uppercase;
      animation: ticker-scroll 14s linear infinite;
    }
    @keyframes ticker-scroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .greeting-close {
      display: inline-block;
      padding: 0.65rem 1.75rem;
      background: var(--site-accent);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-family: var(--body-font);
      font-size: 0.9375rem;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .greeting-close:hover { opacity: 0.88; }

    /* ── Nav bar ── */
    .site-nav {
      ${isFixed ? "position: fixed; top: 0; width: 100%; z-index: 100;" : "position: absolute; top: 0; width: 100%; z-index: 100;"}
      background: var(--nav-bg);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--site-border);
      padding: 0;
    }
    /* Pill / floating outer row — brand left, pill center, lang right */
    .site-nav-row {
      ${isFixed ? "position: fixed; top: 0; left: 0; right: 0;" : "position: absolute; top: 0; left: 0; right: 0;"}
      z-index: 100;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      padding: 6px 1.5rem;
    }
    .site-nav-brand-outside {
      font-family: var(--heading-font);
      font-size: 1rem;
      font-weight: normal;
      font-style: italic;
      color: var(--nav-brand);
      text-decoration: none;
      white-space: nowrap;
    }
    .site-nav-lang-outside {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .site-nav-lang-outside .lang-toggle { display: contents; }
    .site-nav.nav-pill {
      border-radius: 999px;
      width: fit-content;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      background: var(--nav-bg);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid var(--site-border);
      padding: 0 0.25rem;
      position: static;
    }
    .site-nav.nav-floating {
      border-radius: 14px;
      width: fit-content;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
      background: var(--nav-bg);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid transparent;
      padding: 0 0.5rem;
      position: static;
    }
    .site-nav-inner {
      max-width: var(--max-width);
      margin: 0 auto;
      padding: 0 1.25rem;
      display: flex;
      align-items: center;
      gap: 0;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .site-nav-inner::-webkit-scrollbar { display: none; }
    .site-nav.nav-pill .site-nav-inner,
    .site-nav.nav-floating .site-nav-inner { padding: 0; max-width: none; }
    .site-nav-brand {
      font-family: var(--heading-font);
      font-size: 1rem;
      font-weight: normal;
      color: var(--nav-brand);
      text-decoration: none;
      white-space: nowrap;
      padding: var(--nav-link-padding) 0;
      margin-right: 1.5rem;
      flex-shrink: 0;
    }
    .site-nav-links {
      display: flex;
      list-style: none;
      gap: 0;
      margin: 0;
      padding: 0;
      flex: 1;
    }
    .site-nav-links li { flex-shrink: 0; }
    .site-nav-link {
      display: block;
      padding: var(--nav-link-padding) 0.875rem;
      font-size: 0.85rem;
      letter-spacing: 0.03em;
      color: var(--nav-link);
      text-decoration: none;
      cursor: pointer;
      white-space: nowrap;
      background: none;
      border: none;
      font-family: var(--body-font);
      transition: color 0.15s;
    }
    .site-nav-link:hover { color: var(--nav-brand); }
    .site-nav-link.active { color: var(--nav-highlight); }
    .site-nav.nav-underline .site-nav-link.active {
      text-decoration: underline;
      text-decoration-color: var(--nav-highlight);
      text-underline-offset: 3px;
      text-decoration-thickness: 2px;
    }
    .site-nav.nav-glass {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(12px) saturate(1.2);
      -webkit-backdrop-filter: blur(12px) saturate(1.2);
      border-bottom-color: rgba(255,255,255,0.25);
    }
    .site-nav.nav-glass.nav-pill,
    .site-nav.nav-glass.nav-floating {
      border-color: rgba(255,255,255,0.25);
      box-shadow: 0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.3);
    }
    .site-nav.nav-frosted {
      background: rgba(255,255,255,0.3);
      backdrop-filter: blur(24px) saturate(1.4);
      -webkit-backdrop-filter: blur(24px) saturate(1.4);
      border-bottom-color: rgba(255,255,255,0.4);
    }
    .site-nav.nav-frosted.nav-pill,
    .site-nav.nav-frosted.nav-floating {
      border-color: rgba(255,255,255,0.4);
      box-shadow: 0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5);
    }
    .site-nav-row.nav-glass-row { backdrop-filter: blur(12px) saturate(1.2); -webkit-backdrop-filter: blur(12px) saturate(1.2); }
    .site-nav-row.nav-frosted-row { backdrop-filter: blur(24px) saturate(1.4); -webkit-backdrop-filter: blur(24px) saturate(1.4); }

    /* ── Page sections ── */
    .page-section { display: none; }
    .page-section.active { display: flex; flex-direction: column; gap: var(--section-spacing, 0px); }

    /* ── Music player ── */
    .music-player {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 200;
    }
    .music-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--music-btn-bg);
      color: var(--music-btn-color);
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.18);
      transition: opacity 0.15s, transform 0.15s;
    }
    .music-btn:hover { opacity: 0.88; transform: scale(1.07); }
    .music-btn.playing { background: var(--music-btn-bg); opacity: 1; }

    /* ── Language toggle ── */
    .lang-toggle {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      margin-left: auto;
      padding-left: 0.75rem;
    }
    .lang-btn {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.9rem;
      font-size: 0.78rem;
      letter-spacing: 0.04em;
      color: var(--nav-link);
      background: rgba(255,255,255,0.14);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.28);
      border-radius: 999px;
      font-family: var(--body-font);
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.2s, border-color 0.2s, color 0.15s;
      font-weight: 500;
    }
    .lang-btn:hover {
      background: rgba(255,255,255,0.24);
      border-color: rgba(255,255,255,0.45);
      color: var(--nav-brand);
    }

    /* ── Responsive ── */
    @media (max-width: 600px) {
      .block { padding: 2.5rem 0; }
      .block-home-hero { padding: 3.5rem 1rem 3rem; }
      .countdown-units { gap: 1rem; }
      .timeline-item { flex-direction: column; gap: 0.25rem; }
      .timeline-time { min-width: unset; }
    }
  `;

  return { fonts: fontsTag, css };
}
