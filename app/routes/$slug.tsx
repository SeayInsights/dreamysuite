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
  headingColor: string | null;
  bodyColor: string | null;
  siteTextColor: string | null;
  siteBorderColor: string | null;
  navBg: string | null;
  navPosition: string | null;       // "fixed" | "scroll-away" | null
  navShape: string | null;          // "bar" | "pill" | "floating" | null
  navBrandColor: string | null;
  navLinkColor: string | null;
  navHighlightColor: string | null;
  navItemsConfig: string | null;    // JSON string
  buttonStyle: string | null;
  buttonBorderWidth: string | null;
  animation: string | null;
  bgImage: string | null;
  envelopeColor: string | null;
  sealInitials: string | null;
  cardColor: string | null;
  cardImage: string | null;
  navLinkPadding: string | null;
  navUnderline: string | null;
  popupEnabled: number | null;
  popupTitle: string | null;
  popupTicker: number | null;
  popupAfterAnimation: number | null;
  popupBundle: number | null;
  musicBtnBg: string | null;
  musicBtnColor: string | null;
  marginTop: number | null;
  marginRight: number | null;
  marginBottom: number | null;
  marginLeft: number | null;
  bgImageLayer: string | null;
  bgImageOpacity: number | null;
  siteMaxWidth: number | null;
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

// contentMap[pageSlug][lang] = parsed content object
type ContentMap = Map<string, Map<string, Record<string, unknown>>>;

// Native language names shown in the toggle
const LANG_NATIVE: Record<string, string> = {
  en: "English", vi: "Tiếng Việt", es: "Español", fr: "Français",
  "zh-CN": "中文 (简体)", "zh-TW": "中文 (繁體)", ko: "한국어", ja: "日本語",
  de: "Deutsch", pt: "Português", it: "Italiano", th: "ภาษาไทย",
  tl: "Filipino", hi: "हिन्दी", ar: "العربية",
};

// ── HTML helpers ──────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) return "#";
  return raw;
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

// System fonts that do not need a Google Fonts import
const SYSTEM_FONTS = new Set(["Georgia", "Inter"]);

// Google Fonts config: name → URL family param segment
const GFONTS_MAP: Record<string, string> = {
  "Playfair Display": "Playfair+Display:wght@400;600",
  "Cormorant Garamond": "Cormorant+Garamond:wght@400;600",
  "EB Garamond": "EB+Garamond:wght@400;600",
};

interface BuiltStyles {
  fonts: string;
  css: string;
}

function buildStyles(settings: SiteSettingRow | null): BuiltStyles {
  const accent = settings?.accentColor ?? "#0d9488";
  const headingFont = settings?.headingFont ?? "Georgia";
  const bodyFont = settings?.bodyFont ?? "Inter";
  const bg = settings?.bgColor ?? "#ffffff";
  const navPosition = settings?.navPosition ?? null;
  const isFixed = navPosition === "fixed";
  const isScrollAway = navPosition === "scroll-away";
  const navLinkPadding = settings?.navLinkPadding ?? "0.875rem";
  const bgImage = settings?.bgImage ?? null;
  // Escape a URL for safe use inside CSS url('...')
  const escapedBgImageUrl = bgImage ? bgImage.replace(/\\/g, "\\\\").replace(/'/g, "\\'") : null;

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
      --accent: ${escHtml(accent)};
      --heading-font: ${escHtml(headingFont)}, Georgia, serif;
      --body-font: ${escHtml(bodyFont)}, system-ui, sans-serif;
      --bg: ${escHtml(bg)};
      --text: #292524;
      --muted: #78716c;
      --border: #e7e5e4;
      --radius: 12px;
      --max-width: 820px;
      --heading-color: ${escHtml(settings?.headingColor ?? "var(--text)")};
      --body-color: ${escHtml(settings?.bodyColor ?? "var(--muted)")};
      --site-text: ${escHtml(settings?.siteTextColor ?? "var(--text)")};
      --site-border: ${escHtml(settings?.siteBorderColor ?? "var(--border)")};
      --nav-bg: ${(() => { const nb = settings?.navBg ?? ""; if (!nb || nb === "white") return "rgba(255,255,255,0.96)"; if (nb === "glass" || nb === "transparent") return "rgba(255,255,255,0.65)"; if (nb === "custom") return "rgba(255,255,255,0.96)"; return escHtml(nb); })()};
      --nav-brand: ${escHtml(settings?.navBrandColor ?? "var(--text)")};
      --nav-link: ${escHtml(settings?.navLinkColor ?? "var(--muted)")};
      --nav-highlight: ${escHtml(settings?.navHighlightColor ?? "var(--accent)")};
      --nav-link-padding: ${escHtml(navLinkPadding)};
      --music-btn-bg: ${escHtml(settings?.musicBtnBg || "var(--accent)")};
      --music-btn-color: ${escHtml(settings?.musicBtnColor || "#ffffff")};
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      background: var(--bg);
      ${escapedBgImageUrl && settings?.bgImageLayer !== "overlay" ? `background-image: url('${escapedBgImageUrl}'); background-size: cover; background-position: center; background-attachment: fixed;` : ""}
      color: var(--site-text);
      font-family: var(--body-font);
      font-size: 1rem;
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
      ${isFixed ? "padding-top: 4rem;" : ""}
      ${isScrollAway ? "position: relative;" : ""}
    }

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
      color: var(--heading-color);
      margin-bottom: 0.75rem;
    }
    .section-rule {
      width: 3rem; height: 1px;
      background: var(--accent);
      margin: 0 auto 2.5rem;
      opacity: 0.6;
    }

    /* ── Text ── */
    .text-body { max-width: 640px; margin: 0 auto; text-align: center; color: var(--body-color); font-size: 1.0625rem; }

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
      font-size:clamp(0.8rem,2vw,0.95rem); color:var(--muted,#78716c);
      line-height:1.6; margin-bottom:1.25rem;
    }
    .intro-bundle-card-close {
      display:inline-block; padding:0.5rem 1.75rem;
      background:var(--accent); color:#fff; border:none;
      border-radius:99px; font-size:0.85rem; cursor:pointer;
      letter-spacing:0.04em; font-family:var(--body-font);
    }

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
    .map-wrap { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--radius); max-width: var(--max-width); margin-left: auto; margin-right: auto; }
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
      color: var(--accent);
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
      justify-content: flex-end;
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

    /* ── Page sections ── */
    .page-section { display: none; }
    .page-section.active { display: block; }

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

// ── Block renderers ───────────────────────────────────────────────────────────

function renderBlock(
  block: ParsedBlock,
  settings: SiteSettingRow | null,
  pageContent?: Record<string, unknown>,
  siteSlug?: string
): string {
  const cfg = block.config;
  const accent = settings?.accentColor ?? "#0d9488";
  // Helper: get value from content tab data, falling back to block config, then fallback
  const cnt = (contentKey: string, cfgKey?: string, fallback = "") =>
    String(pageContent?.[contentKey] ?? (cfgKey ? cfg[cfgKey] : undefined) ?? fallback);

  // Compute inline style for block container (background color + text color from tile settings)
  const _bsParts: string[] = [];
  const _bgCfg = cfg.background as { type?: string; value?: string } | null | undefined;
  if (_bgCfg?.type === 'color' && _bgCfg?.value) _bsParts.push(`background-color:${escHtml(String(_bgCfg.value))}`);
  const _tcCfg = cfg.textColor as string | undefined;
  if (_tcCfg) _bsParts.push(`color:${escHtml(_tcCfg)}`);
  const _bcCfg = cfg.borderColor as string | undefined;
  if (_bcCfg && !cfg.hideBorder) _bsParts.push(`border:1px solid ${escHtml(_bcCfg)}`);
  const bsAttr = _bsParts.length ? ` style="${_bsParts.join(';')}"` : '';

  switch (block.type) {
    case "home-hero":
    case "couple": {
      const title = cnt("couple", "coupleNames", settings?.eventName ?? "Our Special Day");
      const date = cnt("date", "dateText", settings?.eventDate ?? "");
      const location = cnt("location", "locationText", settings?.eventLocation ?? "");
      return `
        <section class="block block-home-hero"${bsAttr} aria-label="Hero" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
          <div class="hero-inner">
            <p class="hero-eyebrow">We&#39;re getting married</p>
            <h1 class="hero-title" data-lang-field="couple">${escHtml(title)}</h1>
            ${date ? `<p class="hero-date" data-lang-field="date">${escHtml(date)}</p>` : ""}
            ${location ? `<p class="hero-location" data-lang-field="location">${escHtml(location)}</p>` : ""}
            <div class="hero-divider" aria-hidden="true">&#10038;</div>
          </div>
        </section>`;
    }

    case "header": {
      const text = cnt("title", "title", cnt("heading", "heading", cnt("text", "text", "Section")));
      const tSize = cfg.titleSize as string | undefined;
      const tAlign = cfg.titleAlign as string | undefined;
      const tBold = !!cfg.titleBold;
      const tItalic = !!cfg.titleItalic;
      const tUnder = !!cfg.titleUnderline;
      const titleStyle = [
        tSize ? `font-size:${escHtml(tSize)}` : "",
        tAlign ? `text-align:${escHtml(tAlign)}` : "",
        tBold ? "font-weight:700" : "",
        tItalic ? "font-style:italic" : "",
        tUnder ? "text-decoration:underline" : "",
      ].filter(Boolean).join(";");
      return `
        <section class="block block-header"${bsAttr} data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
          <h2 class="section-heading"${titleStyle ? ` style="${titleStyle}"` : ""}>${escHtml(text)}</h2>
          <div class="section-rule" aria-hidden="true"></div>
        </section>`;
    }

    case "text": {
      // contentKey lets a text block pull from the content tab by key
      const contentKey = cfg.contentKey as string | undefined;
      const heading = contentKey
        ? String(pageContent?.[`${contentKey}_heading`] ?? cfg.heading ?? "")
        : String(cfg.heading ?? "");
      const body = contentKey
        ? String(pageContent?.[contentKey] ?? cfg.body ?? "")
        : String(cfg.body ?? cfg.text ?? cfg.content ?? "");
      // Heading style
      const hSize = cfg.headingSize as string | undefined;
      const hAlign = cfg.headingAlign as string | undefined;
      const hStyle = [
        hSize ? `font-size:${escHtml(hSize)}` : "",
        hAlign ? `text-align:${escHtml(hAlign)}` : "",
        cfg.headingBold ? "font-weight:700" : "",
        cfg.headingItalic ? "font-style:italic" : "",
        cfg.headingUnderline ? "text-decoration:underline" : "",
      ].filter(Boolean).join(";");
      // Body style
      const bSize = cfg.bodySize as string | undefined;
      const bAlign = cfg.bodyAlign as string | undefined;
      const bStyle = [
        bSize ? `font-size:${escHtml(bSize)}` : "",
        bAlign ? `text-align:${escHtml(bAlign)}` : "",
        cfg.bodyBold ? "font-weight:700" : "",
        cfg.bodyItalic ? "font-style:italic" : "",
        cfg.bodyUnderline ? "text-decoration:underline" : "",
      ].filter(Boolean).join(";");
      return `
        <section class="block block-text"${bsAttr} data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
          ${heading ? `<h2 class="section-heading"${hStyle ? ` style="${hStyle}"` : ""}${contentKey ? ` data-lang-field="${escHtml(contentKey)}_heading"` : ""}>${escHtml(heading)}</h2><div class="section-rule" aria-hidden="true"></div>` : ""}
          <div class="text-body"${bStyle ? ` style="${bStyle}"` : ""}>
            ${body ? `<p${contentKey ? ` data-lang-field="${escHtml(contentKey)}"` : ""}>${escHtml(body)}</p>` : placeholder("Story text will appear here once added.")}
          </div>
        </section>`;
    }

    case "countdown": {
      const targetDate = settings?.eventDate ?? "";
      const label = (cfg.label as string | undefined) ?? "Until we say I do";
      const showRsvp = !!cfg.showRsvpButton;
      const rsvpText = escHtml(String(cfg.rsvpButtonText ?? "RSVP Now"));
      const rsvpBg = escHtml(String(cfg.rsvpButtonColor ?? accent));
      const rsvpFg = escHtml(String(cfg.rsvpButtonTextColor ?? "#fff"));
      const rsvpBorder = cfg.rsvpButtonBorderColor
        ? `border:2px solid ${escHtml(String(cfg.rsvpButtonBorderColor))};` : "";
      return `
    <section class="block block-countdown"${bsAttr} aria-label="Countdown" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
      <p class="countdown-label">${escHtml(label)}</p>
      ${targetDate
        ? `<div class="countdown-units" data-cd-clock data-date="${escHtml(targetDate)}" data-block-id="${escHtml(block.id)}">
             <div class="countdown-unit"><span class="countdown-num" id="cd-days-${escHtml(block.id)}">--</span><span class="countdown-unit-label">Days</span></div>
             <div class="countdown-unit"><span class="countdown-num" id="cd-hours-${escHtml(block.id)}">--</span><span class="countdown-unit-label">Hours</span></div>
             <div class="countdown-unit"><span class="countdown-num" id="cd-mins-${escHtml(block.id)}">--</span><span class="countdown-unit-label">Minutes</span></div>
             <div class="countdown-unit"><span class="countdown-num" id="cd-secs-${escHtml(block.id)}">--</span><span class="countdown-unit-label">Seconds</span></div>
           </div>`
        : placeholder("Set an event date in Site Settings to show the countdown.")
      }
      <div class="rsvp-wrap" style="text-align:center;margin-top:2rem;${showRsvp ? '' : 'display:none;'}">
        <a href="#rsvp" class="rsvp-submit" style="background:${rsvpBg};color:${rsvpFg};${rsvpBorder}text-decoration:none;display:inline-block">${rsvpText}</a>
      </div>
    </section>`;
    }

    case "schedule": {
      const events = Array.isArray(pageContent?.events)
        ? (pageContent.events as Array<{ name?: string; date?: string; time?: string; location?: string; description?: string }>)
        : [];
      return `
    <section class="block block-schedule"${bsAttr} aria-label="Schedule" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
      <h2 class="section-heading">The Day</h2>
      <div class="section-rule" aria-hidden="true"></div>
      ${events.length > 0
        ? `<ol class="timeline">
             ${events.map(ev => `
               <li class="timeline-item">
                 ${ev.time ? `<span class="timeline-time">${escHtml(ev.time)}</span>` : ""}
                 <div class="timeline-content">
                   ${ev.name ? `<strong>${escHtml(ev.name)}</strong>` : ""}
                   ${ev.date ? `<p style="font-size:0.85em;color:var(--muted);margin:0.2rem 0 0;">${escHtml(ev.date)}</p>` : ""}
                   ${ev.location ? `<p style="font-size:0.85em;color:var(--muted);margin:0.2rem 0 0;">📍 ${escHtml(ev.location)}</p>` : ""}
                   ${ev.description ? `<p>${escHtml(ev.description)}</p>` : ""}
                 </div>
               </li>`).join("")}
           </ol>`
        : placeholder("The wedding day schedule will appear here once added in the Content tab.")
      }
    </section>`;
    }

    case "faq": {
      const questions = Array.isArray(pageContent?.questions)
        ? (pageContent.questions as Array<{ q?: string; a?: string }>)
        : [];
      return `
    <section class="block block-faq"${bsAttr} aria-label="Frequently asked questions" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
      <h2 class="section-heading">Questions &amp; Answers</h2>
      <div class="section-rule" aria-hidden="true"></div>
      ${questions.length > 0
        ? `<dl class="faq-list">
             ${questions.map(item =>
               `${item.q ? `<dt class="faq-question">${escHtml(item.q)}</dt>` : ""}${item.a ? `<dd class="faq-answer">${escHtml(item.a)}</dd>` : ""}`
             ).join("")}
           </dl>`
        : placeholder("Frequently asked questions will appear here once added in the Content tab.")
      }
    </section>`;
    }

    case "rsvp": {
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
            <button class="rsvp-submit" type="submit" style="background:var(--accent)">Send RSVP</button>
          </form>
          <div id="${msgId}" role="alert" aria-live="polite" style="display:none;margin-top:1.25rem;text-align:center;font-size:0.9375rem;padding:0.875rem 1rem;border-radius:6px;"></div>
        </section>`;
    }

    case "images": {
      const urls = cfg.urls as string[] | undefined;
      const imageSlot = cfg.imageSlot as string | undefined;
      const focusX = escHtml(String(cfg.imageFocusX ?? "center"));
      const focusY = escHtml(String(cfg.imageFocusY ?? "center"));
      const objPos = `${focusX} ${focusY}`;
      const phRaw = Number(cfg.photoHeight);
      const photoH = phRaw > 0 ? `${phRaw}px` : null;
      const pwRaw = Number(cfg.photoWidth);
      const photoW = pwRaw > 0 ? `${pwRaw}px` : null;
      const photoR = escHtml(String(cfg.photoRadius ?? '8px'));
      const photoBW = String(cfg.photoBorder ?? '0');
      const photoBColor = escHtml(String(cfg.photoBorderColor ?? '#e0dbd4'));
      const imgStyle = [
        `object-position:${objPos}`,
        `border-radius:${photoR}`,
        photoBW !== '0' ? `border:${escHtml(photoBW)} solid ${photoBColor}` : '',
        photoH ? `height:${photoH}` : "",
        photoW ? `width:${photoW}` : "",
      ].filter(Boolean).join(";");
      const offsetXRaw = Number(cfg.galleryOffsetX ?? 0);
      const layout = String(cfg.layout ?? 'grid-3');
      const wrapperStyleParts: string[] = [];
      if (offsetXRaw !== 0) wrapperStyleParts.push(`transform:translateX(${offsetXRaw}px)`);
      switch (layout) {
        case 'grid-2': wrapperStyleParts.push('display:grid', 'grid-template-columns:repeat(2,1fr)', 'gap:0.75rem'); break;
        case 'masonry': wrapperStyleParts.push('columns:2', 'column-gap:0.75rem'); break;
        case 'filmstrip': wrapperStyleParts.push('display:flex', 'overflow-x:auto', 'gap:0.75rem', 'scroll-snap-type:x mandatory', '-webkit-overflow-scrolling:touch', 'padding-bottom:0.5rem'); break;
        case 'full-bleed': wrapperStyleParts.push('display:grid', 'grid-template-columns:1fr', 'gap:0.5rem'); break;
        case 'featured-grid': wrapperStyleParts.push('display:grid', 'grid-template-columns:2fr 1fr', 'gap:0.75rem'); break;
        // grid-3: rely on .image-grid CSS default
      }
      const wrapperStyle = wrapperStyleParts.join(';');
      const getImgExtraStyle = (idx: number): string => {
        if (layout === 'masonry') return ';break-inside:avoid;aspect-ratio:auto';
        if (layout === 'filmstrip') return ';height:220px;width:auto;max-width:none;flex-shrink:0;scroll-snap-align:start';
        if (layout === 'featured-grid' && idx === 0 && urls.length > 1) return ';grid-row:span 2;height:100%';
        if (layout === 'full-bleed') return ';width:100%;height:auto';
        return '';
      };
      return `
        <section class="block block-images"${bsAttr} aria-label="Photo gallery" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
          ${
            urls && urls.length > 0
              ? `<div class="image-grid"${wrapperStyle ? ` style="${wrapperStyle}"` : ""}>
                   ${urls.map((u, i) => `<img src="${escHtml(u)}" alt="Wedding photo ${i + 1}" loading="lazy" class="gallery-img" style="${imgStyle}${getImgExtraStyle(i)}" />`).join("")}
                 </div>`
              : placeholder(imageSlot ? `Photos for "${escHtml(imageSlot)}" will appear here.` : "Photos will appear here once uploaded.")
          }
        </section>`;
    }

    case "video": {
      const url = cfg.url as string | undefined;
      const vimeoId = cfg.vimeoId as string | undefined;
      const height = (cfg.height as string | undefined) ?? "100dvh";
      const showCountdown = !!cfg.showCountdown;
      const cdXRaw = Number(cfg.countdownX ?? 0);
      const cdX = isFinite(cdXRaw) ? cdXRaw : 0;
      const cdYRaw = Number(cfg.countdownY ?? 120);
      const cdY = isFinite(cdYRaw) ? cdYRaw : 120;
      const targetDate = settings?.eventDate ?? "";

      const overlayHtml = showCountdown && targetDate
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
          ${url ? `<video src="${escHtml(url)}" controls class="media-element" aria-label="Wedding video"></video>` : mediaPlaceholder("Video")}
          ${overlayHtml}
        </section>`;
    }

    case "youtube": {
      const videoId = cfg.videoId as string | undefined;
      return `
        <section class="block block-youtube"${bsAttr} aria-label="YouTube video" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
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
        <section class="block block-registry-card"${bsAttr} aria-label="Gift registry" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
          <h2 class="section-heading">Registry</h2>
          <div class="section-rule" aria-hidden="true"></div>
          ${
            name || url
              ? `<div class="info-card">
                   ${name ? `<p class="card-title">${escHtml(name)}</p>` : ""}
                   ${note ? `<p class="card-note">${escHtml(note)}</p>` : ""}
                   ${url ? `<a href="${escHtml(safeUrl(url))}" target="_blank" rel="noopener noreferrer" class="card-link" style="color:${escHtml(accent)}">View Registry</a>` : ""}
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
        <section class="block block-hotel-card"${bsAttr} aria-label="Hotel and accommodations" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
          <h2 class="section-heading">Hotels &amp; Accommodations</h2>
          <div class="section-rule" aria-hidden="true"></div>
          ${
            name || address
              ? `<div class="info-card">
                   ${name ? `<p class="card-title">${escHtml(name)}</p>` : ""}
                   ${address ? `<p class="card-note">${escHtml(address)}</p>` : ""}
                   ${note ? `<p class="card-note">${escHtml(note)}</p>` : ""}
                   ${url ? `<a href="${escHtml(safeUrl(url))}" target="_blank" rel="noopener noreferrer" class="card-link" style="color:${escHtml(accent)}">Book Now</a>` : ""}
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
        <section class="block block-venue-map"${bsAttr} aria-label="Venue location" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
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

    case "tidbits": {
      const items = Array.isArray(pageContent?.tidbits)
        ? (pageContent.tidbits as Array<{ icon?: string; title?: string; body?: string }>)
        : [];
      const cols = String(cfg.columns ?? "auto");
      const colsCss = cols === "2" ? "repeat(2,1fr)" : cols === "3" ? "repeat(3,1fr)" : "repeat(auto-fill,minmax(200px,1fr))";
      const cardStyle = String(cfg.cardStyle ?? "card");
      const cardCss = cardStyle === "flat"
        ? "padding:1.25rem;text-align:center;color:var(--block-text,var(--site-text));"
        : cardStyle === "bordered"
        ? "border:1px solid var(--site-border,var(--border));border-radius:12px;padding:1.25rem;text-align:center;color:var(--block-text,var(--site-text));"
        : "background:#fff;border:1px solid var(--site-border,var(--border));border-radius:12px;padding:1.25rem;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.05);color:var(--block-text,var(--text));";
      return `
    <section class="block block-tidbits"${bsAttr} aria-label="Fun facts" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
      ${cfg.showTitle !== false ? `<h2 class="section-heading">Fun Facts</h2><div class="section-rule" aria-hidden="true"></div>` : ""}
      ${items.length > 0
        ? `<div style="display:grid;grid-template-columns:${colsCss};gap:1rem;">
             ${items.map(it => `<div style="${cardCss}">
               ${it.icon ? `<div style="font-size:2rem;margin-bottom:0.5rem;">${escHtml(it.icon)}</div>` : ""}
               ${it.title ? `<strong style="display:block;margin-bottom:0.375rem;">${escHtml(it.title)}</strong>` : ""}
               ${it.body ? `<p style="color:var(--block-text,var(--muted));font-size:0.9375rem;margin:0;">${escHtml(it.body)}</p>` : ""}
             </div>`).join("")}
           </div>`
        : placeholder("Fun facts will appear here once added in the Content tab.")
      }
    </section>`;
    }

    case "travel-section": {
      const title = (cfg.title as string | undefined) ?? "Getting There";
      const travelItems = Array.isArray(pageContent?.travelItems)
        ? (pageContent.travelItems as Array<{ heading?: string; body?: string; linkLabel?: string; linkUrl?: string }>)
        : [];
      return `
    <section class="block block-travel"${bsAttr} aria-label="Travel information" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
      <h2 class="section-heading">${escHtml(title)}</h2>
      <div class="section-rule" aria-hidden="true"></div>
      ${travelItems.length > 0
        ? travelItems.map(item => `
            <div style="margin-bottom:1.5rem;">
              ${item.heading ? `<h3 style="font-size:1.05rem;margin:0 0 0.4rem;">${escHtml(item.heading)}</h3>` : ""}
              ${item.body ? `<p style="margin:0 0 0.4rem;line-height:1.7;">${escHtml(item.body)}</p>` : ""}
              ${item.linkUrl && item.linkLabel
                ? `<a href="${escHtml(safeUrl(item.linkUrl))}" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">${escHtml(item.linkLabel)}</a>`
                : ""}
            </div>`).join("")
        : placeholder("Travel details will appear here once added in the Content tab.")
      }
    </section>`;
    }

    case "spacer": {
      const height = Math.max(0, Math.min(400, Number(cfg.height ?? 60)));
      return `<div class="block-spacer" style="height:${height}px" aria-hidden="true"></div>`;
    }

    case "photo-split": {
      const photo = (cfg.photo as Record<string, unknown> | undefined) ?? {};
      const photoUrl = String(photo.url ?? "");
      const photoSide = String(cfg.photoSide ?? "left");
      const cropVal = escHtml(String(photo.crop ?? "center"));
      const wPx = photo.widthPx ? `${Number(photo.widthPx)}px` : "auto";
      const hPx = photo.heightPx ? `${Number(photo.heightPx)}px` : "auto";
      const offsetXRaw = Number(photo.offsetX ?? 0);
      const marginDir = photoSide === "right" ? "right" : "left";
      const photoContainerStyle = `flex-shrink:0;${offsetXRaw !== 0 ? `margin-${marginDir}:${offsetXRaw}px;` : ""}`;
      const components = (cfg.components as Array<Record<string, unknown>>) ?? [];

      const imgEl = photoUrl
        ? `<div class="ps-photo" style="${photoContainerStyle}">
             <img src="${escHtml(photoUrl)}" alt="Photo" loading="lazy"
               style="width:${wPx};height:${hPx};max-width:100%;object-fit:cover;object-position:${cropVal};border-radius:8px;" />
           </div>`
        : "";

      const compsHtml = components.map((c) => {
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
          ].filter(Boolean).join(";");
          const bSize = c.bodySize as string | undefined;
          const bAlign = c.bodyAlign as string | undefined;
          const bStyleParts = [
            "margin:0;line-height:1.75",
            bSize ? `font-size:${escHtml(bSize)}` : "",
            bAlign ? `text-align:${escHtml(bAlign)}` : "",
            c.bodyBold ? "font-weight:700" : "",
            c.bodyItalic ? "font-style:italic" : "",
            c.bodyUnderline ? "text-decoration:underline" : "",
          ].filter(Boolean).join(";");
          const h = c.heading ? `<h3 style="${hStyleParts}">${escHtml(String(c.heading))}</h3>` : "";
          const b = c.body
            ? `<p style="${bStyleParts}">${escHtml(String(c.body)).replace(/\n\n/g, `</p><p style="${bStyleParts}">`).replace(/\n/g, "<br>")}</p>`
            : "";
          return `<div class="ps-comp-text">${h}${b}</div>`;
        }
        return "";
      }).join("");

      const photoFirst = photoSide !== "right";
      const flex = photoFirst
        ? `${imgEl}<div class="ps-content" style="flex:1;min-width:200px;">${compsHtml}</div>`
        : `<div class="ps-content" style="flex:1;min-width:200px;">${compsHtml}</div>${imgEl}`;

      return `<section class="block block-photo-split"${bsAttr} data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
        <div style="display:flex;gap:2rem;align-items:center;flex-wrap:wrap;">${flex}</div>
      </section>`;
    }

    case "multi-text": {
      const mode = String(cfg.mode ?? 'text');
      const sectionTitle = escHtml(String(cfg.title ?? ""));

      if (mode === 'schedule') {
        const events = Array.isArray(pageContent?.events)
          ? (pageContent.events as Array<{ name?: string; date?: string; time?: string; location?: string; description?: string }>)
          : [];
        return `
  <section class="block block-schedule"${bsAttr} aria-label="Schedule" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
    <h2 class="section-heading">${sectionTitle || "The Day"}</h2>
    <div class="section-rule" aria-hidden="true"></div>
    ${events.length > 0
      ? `<ol class="timeline">
           ${events.map(ev => `
             <li class="timeline-item">
               ${ev.time ? `<span class="timeline-time">${escHtml(ev.time)}</span>` : ""}
               <div class="timeline-content">
                 ${ev.name ? `<strong>${escHtml(ev.name)}</strong>` : ""}
                 ${ev.date ? `<p style="font-size:0.85em;color:var(--muted);margin:0.2rem 0 0;">${escHtml(ev.date)}</p>` : ""}
                 ${ev.location ? `<p style="font-size:0.85em;color:var(--muted);margin:0.2rem 0 0;">📍 ${escHtml(ev.location)}</p>` : ""}
                 ${ev.description ? `<p>${escHtml(ev.description)}</p>` : ""}
               </div>
             </li>`).join("")}
         </ol>`
      : placeholder("The schedule will appear here once added in the Content tab.")
    }
  </section>`;
      }

      if (mode === 'faq') {
        const questions = Array.isArray(pageContent?.questions)
          ? (pageContent.questions as Array<{ q?: string; a?: string }>)
          : [];
        return `
  <section class="block block-faq"${bsAttr} aria-label="Frequently asked questions" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
    <h2 class="section-heading">${sectionTitle || "Questions &amp; Answers"}</h2>
    <div class="section-rule" aria-hidden="true"></div>
    ${questions.length > 0
      ? `<dl class="faq-list">
           ${questions.map(item =>
             `${item.q ? `<dt class="faq-question">${escHtml(item.q)}</dt>` : ""}${item.a ? `<dd class="faq-answer">${escHtml(item.a)}</dd>` : ""}`
           ).join("")}
         </dl>`
      : placeholder("Q&A items will appear here once added in the Content tab.")
    }
  </section>`;
      }

      if (mode === 'tidbits') {
        const items = Array.isArray(pageContent?.tidbits)
          ? (pageContent.tidbits as Array<{ icon?: string; title?: string; body?: string }>)
          : [];
        const cols = String(cfg.columns ?? "auto");
        const colsCss = cols === "2" ? "repeat(2,1fr)" : cols === "3" ? "repeat(3,1fr)" : "repeat(auto-fill,minmax(200px,1fr))";
        const cardStyle = String(cfg.cardStyle ?? "card");
        const cardCss = cardStyle === "flat"
          ? "padding:1.25rem;text-align:center;color:var(--block-text,var(--site-text));"
          : cardStyle === "bordered"
          ? "border:1px solid var(--site-border,var(--border));border-radius:12px;padding:1.25rem;text-align:center;color:var(--block-text,var(--site-text));"
          : "background:#fff;border:1px solid var(--site-border,var(--border));border-radius:12px;padding:1.25rem;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.05);color:var(--block-text,var(--text));";
        return `
  <section class="block block-tidbits"${bsAttr} aria-label="Fun facts" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
    ${sectionTitle ? `<h2 class="section-heading">${sectionTitle}</h2><div class="section-rule" aria-hidden="true"></div>` : cfg.showTitle !== false ? `<h2 class="section-heading">Fun Facts</h2><div class="section-rule" aria-hidden="true"></div>` : ""}
    ${items.length > 0
      ? `<div style="display:grid;grid-template-columns:${colsCss};gap:1rem;">
           ${items.map(it => `<div style="${cardCss}">
             ${it.icon ? `<div style="font-size:2rem;margin-bottom:0.5rem;">${escHtml(it.icon)}</div>` : ""}
             ${it.title ? `<strong style="display:block;margin-bottom:0.375rem;">${escHtml(it.title)}</strong>` : ""}
             ${it.body ? `<p style="color:var(--block-text,var(--muted));font-size:0.9375rem;margin:0;">${escHtml(it.body)}</p>` : ""}
           </div>`).join("")}
         </div>`
      : placeholder("Fun facts will appear here once added in the Content tab.")
    }
  </section>`;
      }

      if (mode === 'travel') {
        const travelItems = Array.isArray(pageContent?.travelItems)
          ? (pageContent.travelItems as Array<{ heading?: string; body?: string; linkLabel?: string; linkUrl?: string }>)
          : [];
        return `
  <section class="block block-travel"${bsAttr} aria-label="Travel information" data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
    <h2 class="section-heading">${sectionTitle || "Getting There"}</h2>
    <div class="section-rule" aria-hidden="true"></div>
    ${travelItems.length > 0
      ? travelItems.map(item => `
          <div style="margin-bottom:1.5rem;">
            ${item.heading ? `<h3 style="font-size:1.05rem;margin:0 0 0.4rem;">${escHtml(item.heading)}</h3>` : ""}
            ${item.body ? `<p style="margin:0 0 0.4rem;line-height:1.7;">${escHtml(item.body)}</p>` : ""}
            ${item.linkUrl && item.linkLabel
              ? `<a href="${escHtml(safeUrl(item.linkUrl))}" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">${escHtml(item.linkLabel)}</a>`
              : ""}
          </div>`).join("")
      : placeholder("Travel details will appear here once added in the Content tab.")
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
      ].filter(Boolean).join(";");
      const bSize = cfg.bodySize as string | undefined;
      const bAlign = cfg.bodyAlign as string | undefined;
      const bStyle = [
        bSize ? `font-size:${escHtml(bSize)}` : "",
        bAlign ? `text-align:${escHtml(bAlign)}` : "",
        cfg.bodyBold ? "font-weight:700" : "",
        cfg.bodyItalic ? "font-style:italic" : "",
        cfg.bodyUnderline ? "text-decoration:underline" : "",
      ].filter(Boolean).join(";");
      // Support textItems array; fall back to single heading/body for backward compat
      const textItemsArr = Array.isArray(cfg.textItems)
        ? (cfg.textItems as Array<{heading?: string; body?: string}>)
        : null;
      const singleHeading = contentKey
        ? String(pageContent?.[`${contentKey}_heading`] ?? cfg.heading ?? sectionTitle)
        : String(cfg.heading ?? sectionTitle ?? "");
      const singleBody = contentKey
        ? String(pageContent?.[contentKey] ?? cfg.body ?? "")
        : String(cfg.body ?? cfg.text ?? cfg.content ?? "");
      const itemsToRender = textItemsArr ?? [{ heading: singleHeading, body: singleBody }];
      const langHeadAttr = !textItemsArr && contentKey ? ` data-lang-field="${escHtml(contentKey)}_heading"` : "";
      const langBodyAttr = !textItemsArr && contentKey ? ` data-lang-field="${escHtml(contentKey)}"` : "";
      return `
    <section class="block block-text"${bsAttr} data-block-id="${escHtml(block.id)}" data-block-type="${escHtml(block.type)}">
      ${itemsToRender.map((item, idx) => {
        const h = escHtml(String(item.heading ?? ""));
        const b = escHtml(String(item.body ?? ""));
        const itemDivStyle = [idx > 0 ? "margin-top:1.5rem" : "", bStyle].filter(Boolean).join(";");
        return `${h ? `<h2 class="section-heading"${hStyle ? ` style="${hStyle}"` : ""}${langHeadAttr}>${h}</h2>${idx === 0 ? `<div class="section-rule" aria-hidden="true"></div>` : ""}` : ""}
      <div class="text-body"${itemDivStyle ? ` style="${itemDivStyle}"` : ""}>${b ? `<p${langBodyAttr}>${b}</p>` : (idx === 0 ? placeholder("Text will appear here once added.") : "")}</div>`;
      }).join("")}
    </section>`;
    }

    default:
      return `<section class="block block-unknown">${placeholder(`This block (${escHtml(block.type)}) is not yet supported.`)}</section>`;
  }
}

// ── Countdown script ──────────────────────────────────────────────────────────

function buildCountdownScript(): string {
  return `<script>
(function(){
  document.querySelectorAll('[data-cd-clock]').forEach(function(container){
    var raw = container.getAttribute('data-date');
    if (!raw) return;
    var target = raw.includes('T') ? new Date(raw) : new Date(raw + 'T00:00:00');
    if (isNaN(target.getTime())) return;
    var bid = container.getAttribute('data-block-id') || '';
    var els = {
      days:  document.getElementById('cd-days-'  + bid),
      hours: document.getElementById('cd-hours-' + bid),
      mins:  document.getElementById('cd-mins-'  + bid),
      secs:  document.getElementById('cd-secs-'  + bid),
    };
    var timer;
    function tick() {
      var diff = target.getTime() - Date.now();
      if (diff <= 0) {
        ['days','hours','mins','secs'].forEach(function(k){ if(els[k]) els[k].textContent='0'; });
        clearInterval(timer);
        return;
      }
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      if (els.days)  els.days.textContent  = String(d);
      if (els.hours) els.hours.textContent = String(h).padStart(2, '0');
      if (els.mins)  els.mins.textContent  = String(m).padStart(2, '0');
      if (els.secs)  els.secs.textContent  = String(s).padStart(2, '0');
    }
    tick();
    timer = setInterval(tick, 1000);
  });
})();
</script>`;
}

// ── postMessage listener script ───────────────────────────────────────────────

function buildMessageListenerScript(): string {
  return `<script>
(function(){
  function applySiteSettings(delta) {
    var root = document.documentElement;
    var map = {
      accentColor: '--accent',
      bgColor: '--bg',
      headingColor: '--heading-color',
      bodyColor: '--body-color',
      siteTextColor: '--site-text',
      siteBorderColor: '--site-border',
      navBg: '--nav-bg',
      navBrandColor: '--nav-brand',
      navLinkColor: '--nav-link',
      navHighlightColor: '--nav-highlight',
      musicBtnBg: '--music-btn-bg',
      musicBtnColor: '--music-btn-color',
    };
    Object.keys(delta).forEach(function(k) {
      if (map[k]) root.style.setProperty(map[k], String(delta[k]));
    });
    if ('marginTop' in delta || 'marginRight' in delta || 'marginBottom' in delta || 'marginLeft' in delta) {
      var siteContent = document.getElementById('site-content');
      if (siteContent) {
        var mt = delta.marginTop  != null ? Number(delta.marginTop)  : 0;
        var mr = delta.marginRight != null ? Number(delta.marginRight) : 0;
        var mb = delta.marginBottom != null ? Number(delta.marginBottom) : 0;
        var ml = delta.marginLeft != null ? Number(delta.marginLeft) : 0;
        siteContent.style.padding = mt + 'px ' + mr + 'px ' + mb + 'px ' + ml + 'px';
      }
    }
    if ('siteMaxWidth' in delta) {
      var sc = document.getElementById('site-content');
      if (sc) {
        var mw = delta.siteMaxWidth ? Number(delta.siteMaxWidth) : 0;
        sc.style.maxWidth = mw ? mw + 'px' : '';
        sc.style.marginLeft = mw ? 'auto' : '';
        sc.style.marginRight = mw ? 'auto' : '';
      }
    }
    if ('bgImageLayer' in delta || 'bgImageOpacity' in delta) {
      var bgOv = document.getElementById('bg-overlay');
      if (bgOv) {
        if ('bgImageLayer' in delta) {
          var isOverlay = delta.bgImageLayer === 'overlay';
          bgOv.style.display = isOverlay ? '' : 'none';
          document.body.style.backgroundImage = isOverlay ? '' : bgOv.style.backgroundImage;
        }
        if ('bgImageOpacity' in delta && delta.bgImageOpacity != null) {
          bgOv.style.opacity = String(delta.bgImageOpacity);
        }
      }
    }
  }

  function applyBlockConfig(blockId, cfg) {
    var node = document.querySelector('[data-block-id="' + blockId + '"]');
    if (!node) return;
    var type = node.getAttribute('data-block-type');

    if (type === 'countdown') {
      var labelEl = node.querySelector('.countdown-label');
      if (labelEl && cfg.label != null) labelEl.textContent = String(cfg.label);
      var rsvpWrap = node.querySelector('.rsvp-wrap');
      if (rsvpWrap) rsvpWrap.style.display = cfg.showRsvpButton ? '' : 'none';
      var rsvpBtn = node.querySelector('.rsvp-wrap .rsvp-submit');
      if (rsvpBtn) {
        if ('rsvpButtonColor' in cfg) rsvpBtn.style.background = cfg.rsvpButtonColor ? String(cfg.rsvpButtonColor) : '';
        if ('rsvpButtonTextColor' in cfg) rsvpBtn.style.color = cfg.rsvpButtonTextColor ? String(cfg.rsvpButtonTextColor) : '';
        if ('rsvpButtonBorderColor' in cfg) rsvpBtn.style.border = cfg.rsvpButtonBorderColor ? '2px solid ' + String(cfg.rsvpButtonBorderColor) : '';
      }
    }

    if (type === 'video') {
      // show/hide countdown overlay
      var overlay = node.querySelector('.video-cd-overlay');
      if (overlay) overlay.style.display = cfg.showCountdown ? '' : 'none';
      // update overlay position
      if (overlay && cfg.countdownX != null) overlay.style.transform = 'translateX(calc(-50% + ' + cfg.countdownX + 'px))';
      if (overlay && cfg.countdownY != null) overlay.style.bottom = cfg.countdownY + 'px';
      // update block height
      if (cfg.height && /^[\d.]+(px|dvh|vh|svh|%)$/.test(String(cfg.height))) {
        node.style.height = cfg.height;
      }
    }

    if (type === 'text') {
      var heading = node.querySelector('.section-heading');
      if (heading && cfg.heading != null) heading.textContent = String(cfg.heading);
      var body = node.querySelector('.text-body p');
      if (body && cfg.body != null) body.textContent = String(cfg.body);
    }

    if (type === 'images') {
      var imgs = node.querySelectorAll('.gallery-img');
      var photoR = cfg.photoRadius ? String(cfg.photoRadius) : '8px';
      var photoBW = cfg.photoBorder ? String(cfg.photoBorder) : '0';
      var photoBColor = cfg.photoBorderColor ? String(cfg.photoBorderColor) : '#e0dbd4';
      var phH = cfg.photoHeight ? String(Number(cfg.photoHeight)) + 'px' : '';
      var phW = cfg.photoWidth ? String(Number(cfg.photoWidth)) + 'px' : '';
      imgs.forEach(function(img) {
        img.style.borderRadius = photoR;
        img.style.border = (photoBW && photoBW !== '0') ? photoBW + ' solid ' + photoBColor : '';
        if (phH) img.style.height = phH;
        if (phW) img.style.width = phW;
      });
      var grid = node.querySelector('.image-grid');
      if (grid && cfg.galleryOffsetX != null) {
        var ox = Number(cfg.galleryOffsetX);
        grid.style.transform = ox !== 0 ? 'translateX(' + ox + 'px)' : '';
      }
    }

    if (type === 'photo-split') {
      var psImg = node.querySelector('.ps-photo img');
      if (psImg && cfg.photo) {
        var ph = cfg.photo;
        if (ph.widthPx) psImg.style.width = String(Number(ph.widthPx)) + 'px';
        else psImg.style.width = 'auto';
        if (ph.heightPx) psImg.style.height = String(Number(ph.heightPx)) + 'px';
        else psImg.style.height = 'auto';
        if (ph.crop) psImg.style.objectPosition = String(ph.crop);
        var psContainer = node.querySelector('.ps-photo');
        if (psContainer && ph.offsetX != null) {
          var pox = Number(ph.offsetX);
          psContainer.style.marginLeft = (cfg.photoSide !== 'right' && pox !== 0) ? pox + 'px' : '';
          psContainer.style.marginRight = (cfg.photoSide === 'right' && pox !== 0) ? pox + 'px' : '';
        }
      }
    }

    // Generic: background / text color
    if (cfg.background && cfg.background.type === 'color') {
      node.style.backgroundColor = cfg.background.value || '';
    } else if (cfg.background === null) {
      node.style.backgroundColor = '';
    }
    if (cfg.textColor) {
      node.style.color = String(cfg.textColor);
    } else if (cfg.textColor === null) {
      node.style.color = '';
    }
    if ('borderColor' in cfg) {
      node.style.border = (cfg.borderColor && !cfg.hideBorder) ? '1px solid ' + String(cfg.borderColor) : '';
    }
  }

  window.addEventListener('message', function(event) {
    if (event.origin !== location.origin) return;
    var d = event.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'block_config_update') {
      applyBlockConfig(String(d.blockId), d.config || {});
    } else if (d.type === 'site_settings_update') {
      applySiteSettings(d.delta || {});
    }
  });
})();
</script>`;
}

// ── Intro overlay builder ─────────────────────────────────────────────────────

function buildIntroHtml(
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

// ── Full-document HTML builder ────────────────────────────────────────────────

function buildHtml(
  site: SiteRow,
  settings: SiteSettingRow | null,
  pages: PageWithBlocks[],
  contentMap: ContentMap,
  siteSlug: string,
  activeLang?: string | null
): string {
  const mainLang = settings?.mainLanguage ?? "en";
  const lang = escHtml(mainLang);
  const eventTitle = settings?.eventName ?? site.name;
  const eventDate = settings?.eventDate ?? null;
  const eventLocation = settings?.eventLocation ?? null;
  const greeting = settings?.greeting ?? null;
  const accent = settings?.accentColor ?? "#0d9488";

  const bgImageRaw = settings?.bgImage ?? null;
  const escapedBgImageUrl = bgImageRaw ? bgImageRaw.replace(/\\/g, "\\\\").replace(/'/g, "\\'") : null;

  const allBlocks = pages.flatMap((p) => p.blocks);
  const hasCountdown = allBlocks.some((b) => b.type === "countdown")
    || (!!settings?.eventDate && allBlocks.some((b) => b.type === "video" && !!(b.config as Record<string, unknown>).showCountdown));

  // Build nav bar (only if there are multiple pages, all visible)
  const visiblePages = pages.filter((p) => p.isVisible !== 0);
  const hasMultiplePages = visiblePages.length > 1;

  // Nav labels: use page label, fall back to slug with initial cap
  function pageLabel(p: PageRow): string {
    return escHtml(p.label || p.slug.charAt(0).toUpperCase() + p.slug.slice(1));
  }

  const secondLang = settings?.secondLanguage ?? null;

  const navShape = settings?.navShape ?? "";
  const navUnderlineClass = (settings?.navUnderline ?? "on") !== "off" ? " nav-underline" : "";
  const navShapeClass = (navShape === "pill" ? " nav-pill" : navShape === "floating" ? " nav-floating" : "") + navUnderlineClass;
  const isPillOrFloating = navShape === "pill" || navShape === "floating";
  const navLinksHtml = visiblePages
    .map(
      (p, i) =>
        `<li><button class="site-nav-link${i === 0 ? " active" : ""}" data-page="${escHtml(p.id)}" onclick="showPage('${escHtml(p.id)}')">${pageLabel(p)}</button></li>`
    )
    .join("");
  const secondNative = secondLang ? (LANG_NATIVE[secondLang] ?? secondLang.toUpperCase()) : "";
  const mainNative = LANG_NATIVE[mainLang] ?? mainLang.toUpperCase();
  const isSecondActive = activeLang === secondLang;
  const navLangToggle = secondLang
    ? `<div class="lang-toggle">
        <button class="lang-btn" id="lang-toggle-btn"
          data-main="${escHtml(mainLang)}" data-second="${escHtml(secondLang)}"
          data-main-label="${escHtml(mainNative)}" data-second-label="${escHtml(secondNative)}"
          onclick="switchLang()"
          aria-label="Switch language"
        >${isSecondActive ? escHtml(mainNative) : escHtml(secondNative)}</button>
      </div>`
    : "";
  const navHtml = hasMultiplePages
    ? isPillOrFloating
      ? `<div class="site-nav-row" role="navigation" aria-label="Site navigation">
          <a class="site-nav-brand-outside" href="#" onclick="return false;">${escHtml(eventTitle)}</a>
          <nav class="site-nav${navShapeClass}">
            <div class="site-nav-inner">
              <ul class="site-nav-links" role="list">
                ${navLinksHtml}
              </ul>
            </div>
          </nav>
          <div class="site-nav-lang-outside">${navLangToggle}</div>
        </div>`
      : `<nav class="site-nav${navShapeClass}" aria-label="Site navigation">
          <div class="site-nav-inner">
            <a class="site-nav-brand" href="#" onclick="return false;">${escHtml(eventTitle)}</a>
            <ul class="site-nav-links" role="list">
              ${navLinksHtml}
            </ul>
            ${navLangToggle}
          </div>
        </nav>`
    : "";

  // Page sections with show/hide
  const pageSectionsHtml = visiblePages
    .map((page, i) => {
      // Get content for this page — use activeLang if set, fall back to mainLang
      const pageContentByLang = contentMap.get(page.slug);
      const renderLang = activeLang ?? mainLang;
      const pageContent = pageContentByLang?.get(renderLang)
        ?? pageContentByLang?.get(mainLang)
        ?? (pageContentByLang ? [...pageContentByLang.values()][0] : undefined);
      const blocksHtml = page.blocks
        .map((block) => renderBlock(block, settings, pageContent, siteSlug))
        .join("\n");
      const sectionClass = hasMultiplePages
        ? `page-section${i === 0 ? " active" : ""}`
        : "page-section active";
      return `<div class="${sectionClass}" id="page-${escHtml(page.id)}">${blocksHtml}</div>`;
    })
    .join("\n");

  // Content margin padding
  const mTop    = Number(settings?.marginTop    ?? 0) || 0;
  const mRight  = Number(settings?.marginRight  ?? 0) || 0;
  const mBottom = Number(settings?.marginBottom ?? 0) || 0;
  const mLeft   = Number(settings?.marginLeft   ?? 0) || 0;
  const mMaxWidth = Number(settings?.siteMaxWidth ?? 0) || 0;
  const contentStyles: string[] = [];
  if (mTop || mRight || mBottom || mLeft) contentStyles.push(`padding:${mTop}px ${mRight}px ${mBottom}px ${mLeft}px`);
  if (mMaxWidth) contentStyles.push(`max-width:${mMaxWidth}px`, `margin-left:auto`, `margin-right:auto`);
  const contentPadStyle = contentStyles.length ? ` style="${contentStyles.join(';')}"` : '';

  // No-pages fallback — site exists but has no pages yet
  const fallbackHtml = visiblePages.length === 0
    ? `<div class="site-wrapper"><p style="text-align:center;padding:4rem 1rem;color:var(--muted);font-style:italic;">This site has no published content yet.</p></div>`
    : "";

  const navScript = hasMultiplePages
    ? `<script>
function showPage(pageId) {
  document.querySelectorAll('.page-section').forEach(function(s){ s.classList.remove('active'); });
  document.querySelectorAll('.site-nav-link').forEach(function(b){ b.classList.remove('active'); });
  var section = document.getElementById('page-' + pageId);
  if (section) { section.classList.add('active'); window.scrollTo({top:0,behavior:'smooth'}); }
  document.querySelectorAll('[data-page="' + pageId + '"]').forEach(function(b){ b.classList.add('active'); });
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'dreamysuite_pageChange', pageId: pageId }, '*');
  }
}
(function(){
  var pid = new URLSearchParams(location.search).get('_page');
  if (pid) showPage(pid);
})();
</script>`
    : "";

  const popupEnabled = settings?.popupEnabled ?? 1;
  const popupTitle = settings?.popupTitle ?? null;
  const popupTicker = settings?.popupTicker ?? 0;
  const popupAfterAnimation = settings?.popupAfterAnimation ?? 0;
  const showPopup = greeting && popupEnabled !== 0;
  const tickerText = popupTicker ? escHtml(eventTitle + (eventDate ? "  ·  " + eventDate : "")) : null;
  const greetingHtml = showPopup
    ? `<div class="greeting-overlay${popupAfterAnimation && settings?.animation ? " hidden" : ""}" id="greeting-overlay" role="dialog" aria-modal="true" aria-label="Welcome message"
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

  // Language toggle — shown when a second language is configured
  // Normally injected into the nav bar; this fallback is only for single-page sites with no nav.
  const langToggleHtml = secondLang && !hasMultiplePages
    ? `<div style="position:fixed;top:1rem;right:1rem;z-index:200">
        <button class="lang-btn" id="lang-toggle-btn"
          data-main="${escHtml(mainLang)}" data-second="${escHtml(secondLang)}"
          data-main-label="${escHtml(mainNative)}" data-second-label="${escHtml(secondNative)}"
          onclick="switchLang()"
          aria-label="Switch language"
        >${escHtml(secondNative)}</button>
      </div>`
    : "";
  const langScript = secondLang
    ? `<script>
function switchLang() {
  var btn = document.getElementById('lang-toggle-btn');
  if (!btn) return;
  var main = btn.getAttribute('data-main');
  var second = btn.getAttribute('data-second');
  var cur = '${escHtml(activeLang ?? mainLang)}';
  var target = (cur === second) ? main : second;
  var url = new URL(location.href);
  if (target === main) { url.searchParams.delete('_lang'); } else { url.searchParams.set('_lang', target); }
  location.href = url.toString();
}
</script>`
    : "";

  // Serialize the per-lang content for client-side switching
  const langContentJson = secondLang
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

  const pageTitle = `${escHtml(eventTitle)}${eventDate ? ` &middot; ${escHtml(eventDate)}` : ""}`;
  const metaDesc = [eventTitle, eventDate, eventLocation]
    .filter(Boolean)
    .join(" \u00b7 ");

  const { fonts: fontsTag, css: siteCss } = buildStyles(settings);

  // Animation
  const animation = settings?.animation ?? null;
  const envelopeColor = settings?.envelopeColor ?? null;
  const sealInitials = settings?.sealInitials ?? null;
  const cardColor = settings?.cardColor ?? null;
  const cardImage = settings?.cardImage ?? null;
  const popupBundleActive = !!(settings?.popupBundle) && !!animation && animation !== "none" && animation !== "envelope";
  const introHtml = buildIntroHtml(
    animation, eventTitle, eventDate, envelopeColor, sealInitials, cardColor, cardImage,
    settings?.bgImage ?? null,
    popupBundleActive,
    settings?.popupTitle ?? null,
    greeting
  );
  const gsapCdn = introHtml
    ? `<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>\n  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/CustomEase.min.js"></script>`
    : "";

  const triggerPopupAfterAnim = showPopup && popupAfterAnimation;
  const introScript = introHtml
    ? `<script>
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
      gsap.set(el, { opacity:1, clearProps:'background' });
      ${animation === "envelope" ? `
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
      ` : animation === "doors" ? `
      gsap.set('.door-l', { rotateY:0, opacity:1 });
      gsap.set('.door-r', { rotateY:0, opacity:1 });
      gsap.set('.door-glow', { width:'3px', filter:'blur(2px)', opacity:1 });
      gsap.set('.door-cue', { opacity:1 });
      gsap.set('.door-centre-text', { opacity:1 });
      gsap.set('.door-smoke-cloud', { scaleY:1, scaleX:1, y:'0%', opacity:1, clearProps:'background' });
      gsap.set('.door-light-flood', { scaleX:0.1, scaleY:0.1, opacity:0 });
      gsap.set('.door-ao',            { opacity:0.55, width:'70px' });
      gsap.set('.door-surface-light', { opacity:0 });
      ` : animation === "storybook" ? `
      gsap.set('.book-cover', { rotateY:0, transformOrigin:'right center' });
      gsap.set(['.book-page-1','.book-page-2','.book-page-3'], { rotateY:0, opacity:1 });
      gsap.set('.book-final-page', { opacity:0 });
      gsap.set('.book-page-bg', { filter:'none' });
      gsap.set('.book-cue', { opacity:1 });
      ` : ``}
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
  ${animation === "envelope" ? `
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
    /* Card rises — motion and focus are separate: focus snaps faster like autofocus */
    .to('.envfs-card',        { y:0, opacity:1, duration:2.0, ease:'power3.out' }, 3.82)
    .to('.envfs-card',        { filter:'blur(0px)', duration:1.55, ease:'expo.out' }, 3.82)
    .to('.envfs-card',        { scale:1.02, duration:0.6, ease:'sine.inOut' }, 5.82)
    .to('.envfs-card',        { scale:1.0,  duration:0.6, ease:'sine.inOut' }, 6.42)
    .to({},                   { duration:1.5 })
    .to(el,                   { opacity:0, duration:0.95, ease:'power2.in' });
  ` : animation === "doors" ? `
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
    .to('.door-cue',          { opacity:0, duration:0.2 }, 0)
    /* Smoke surges — explosive power4, individual cloud character */
    .to('.door-smoke-cloud',  { scaleY:1.65, opacity:0.9, duration:0.32, ease:'power4.out', stagger:0.055 }, 0)
    .to('.door-glow',         { width:'110px', filter:'blur(20px)', opacity:1.0, duration:0.55, ease:'power3.in' }, 0)
    /* AO intensifies at crack as hinges load — darkness deepens before doors move */
    .to('.door-ao',           { opacity:1.0, width:'100px', duration:0.2, ease:'power3.in' }, 0.08)
    /* Doors break free and swing */
    .to('.door-l',            { rotateY:-122, duration:1.45, ease:'power4.inOut' }, 0.28)
    .to('.door-r',            { rotateY:122,  duration:1.45, ease:'power4.inOut' }, 0.28)
    /* Interior light sweeps across door face from crack side as it opens */
    .to('.door-surface-light',{ opacity:1, duration:0.5, ease:'power2.in' }, 0.34)
    /* AO releases as door swings away from the crack */
    .to('.door-ao',           { opacity:0, duration:0.52, ease:'power2.out' }, 0.44)
    .to('.door-surface-light',{ opacity:0, duration:0.72, ease:'power1.in' }, 0.88)
    .to('.door-light-flood',  { scaleX:6, scaleY:4, opacity:1, duration:0.28, ease:'power3.out' }, 0.55)
    .to('.door-light-flood',  { opacity:0, duration:0.88, ease:'power1.in' }, 0.83)
    .to('.door-smoke-cloud',  { y:'-30%', scaleX:2, opacity:0.35, duration:0.85, ease:'power1.out' }, 0.72)
    .to('.door-glow',         { width:'360px', filter:'blur(44px)', opacity:0.55, duration:0.5, ease:'power1.out' }, 0.72)
    .to('.door-glow',         { opacity:0, duration:0.55, ease:'power2.in' }, '-=0.15')
    ${popupBundleActive ? `.to(['.door-l','.door-r','.door-centre-text'], { opacity:0, duration:0.4 }, '-=0.35')` : `.to(el, { opacity:0, duration:0.52, ease:'power2.in' }, '-=0.38')`};
  ` : animation === "storybook" ? `
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
    .to('.book-cue',    { opacity:0, duration:0.25 }, 0)
    .to('.book-cover',  { rotateY:-60,  duration:0.8,  ease:'power2.inOut', transformOrigin:'right center' }, 0.1)
    .to('.book-page-1', { rotateY:-160, duration:0.6,  ease:'power3.inOut', transformOrigin:'right center' }, 0.85)
    .to('.book-page-2', { rotateY:-160, duration:0.58, ease:'power3.inOut', transformOrigin:'right center' }, 1.4)
    .to('.book-page-3', { rotateY:-160, duration:0.55, ease:'power3.inOut', transformOrigin:'right center' }, 1.88)
    .to('.book-cover',  { rotateY:-162, duration:1.1,  ease:'power4.inOut', transformOrigin:'right center' }, 1.62)
    .to('.book-final-page', { opacity:1, duration:0.85, ease:'power1.inOut' }, 2.42)
    .to('.book-page-bg', { filter:'brightness(1.12)', duration:0.65, ease:'power1.inOut' }, 2.52)
    ${popupBundleActive
      ? `.to(['.book-cover','.book-spine','.book-page-bg','.book-page-1','.book-page-2','.book-page-3'], { opacity:0, duration:0.45 }, '-=0.28')`
      : `.to(el, { opacity:0, duration:0.72, ease:'power2.in' }, '-=0.45')`};
  ` : `
  gsap.to(el, { opacity:0, duration:0.4, onComplete:function(){ _afterAnimDone(el); } });
  `}
}
${animation === "envelope" ? `
if (!_introOpened) {
  gsap.set('.envfs-card',   { xPercent:-50, yPercent:-50, y:'100vh', opacity:0, filter:'blur(12px)' });
  gsap.set('.intro-env-fs', { scale:0.93, y:20, opacity:0 });
  gsap.set('#intro-lbox-t', { height:0 });
  gsap.set('#intro-lbox-b', { height:0 });
  gsap.timeline()
    .to('.intro-env-fs', { scale:1, y:0, opacity:1, duration:1.85, ease:'power2.out' })
    .to(['#intro-lbox-t','#intro-lbox-b'], { height:48, duration:1.0, ease:'power2.out' }, 0.55);
}` : ""}
if (_introOpened) {
  var _skipEl = document.getElementById('intro-overlay');
  if (_skipEl) _afterAnimDone(_skipEl);
} else {
  document.getElementById('intro-overlay').addEventListener('click', openIntro);
  document.addEventListener('keydown', function(e){
    if (e.key==='Enter' || e.key===' ') openIntro();
  });
}
</script>`
    : "";

  // Music player
  const musicUrl = settings?.musicUrl ?? null;
  let musicPlayerHtml = "";
  let musicScript = "";
  if (musicUrl) {
    // Parse YouTube video ID from both youtube.com/watch?v=ID and youtu.be/ID
    let videoId: string | null = null;
    try {
      const u = new URL(musicUrl);
      if (u.hostname === "youtu.be") {
        videoId = u.pathname.slice(1).split("?")[0] || null;
      } else if (u.hostname.includes("youtube.com")) {
        videoId = u.searchParams.get("v");
      }
    } catch {
      // not a valid URL — skip
    }
    if (videoId) {
      const vid = escHtml(videoId);
      musicPlayerHtml = `
  <div class="music-player" id="music-player">
    <iframe id="yt-player" src="https://www.youtube.com/embed/${vid}?enablejsapi=1&autoplay=0&loop=1&playlist=${vid}" allow="autoplay" style="display:none" title="Background music"></iframe>
    <button class="music-btn" id="music-btn" aria-label="Play background music" onclick="toggleMusic()">&#9834;</button>
  </div>`;
      musicScript = `<script>
function toggleMusic() {
  var iframe = document.getElementById('yt-player');
  var btn = document.getElementById('music-btn');
  if (!iframe) return;
  var playing = btn.classList.contains('playing');
  if (playing) {
    iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    btn.classList.remove('playing');
    btn.setAttribute('aria-label', 'Play background music');
  } else {
    iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    btn.classList.add('playing');
    btn.setAttribute('aria-label', 'Pause background music');
  }
}
</script>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <meta name="description" content="${escHtml(metaDesc)}" />
  ${fontsTag}
  ${gsapCdn}
  <style>${siteCss}</style>
</head>
<body>
  ${escapedBgImageUrl ? `<div id="bg-overlay" style="position:fixed;inset:0;z-index:0;pointer-events:none;background-image:url('${escapedBgImageUrl}');background-size:cover;background-position:center;background-attachment:fixed;opacity:${settings?.bgImageOpacity ?? 1};display:${settings?.bgImageLayer === 'overlay' ? '' : 'none'};"></div>` : ""}
  ${introHtml}
  ${introScript}
  ${greetingHtml}
  ${navHtml}
  <div id="site-content"${contentPadStyle}>
  ${fallbackHtml}
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
  </script>
</body>
</html>`;
}

// ── Coming soon page ──────────────────────────────────────────────────────────

function comingSoonHtml(siteName: string): string {
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

  // Attempt to identify a logged-in owner/collaborator so they can preview unpublished sites.
  let viewerUserId: string | null = null;
  let viewerEmail: string | null = null;
  try {
    const auth = createAuth(context.cloudflare.env);
    const session = await auth.api.getSession({ headers: request.headers });
    viewerUserId = session?.user?.id ?? null;
    viewerEmail = session?.user?.email ?? null;
  } catch {
    // Unauthenticated visitor — continue as public.
  }

  let site: SiteRow | null = null;
  let isOwner = false;

  // Owners can preview regardless of isLive; visitors only see published + live sites.
  if (viewerUserId) {
    site = await db
      .prepare("SELECT * FROM site WHERE slug = ? AND userId = ?")
      .bind(slug, viewerUserId)
      .first<SiteRow>();
    if (site) isOwner = true;
  }

  // Collaborators (invited via site_invite) can also preview draft sites.
  if (!site && viewerEmail) {
    const invited = await db
      .prepare("SELECT s.* FROM site s JOIN site_invite i ON i.siteId = s.id WHERE s.slug = ? AND i.email = ?")
      .bind(slug, viewerEmail.toLowerCase())
      .first<SiteRow>();
    if (invited) { site = invited; isOwner = true; }
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

  // Non-owners cannot view a site that hasn't been marked live.
  if (!isOwner && !settings?.isLive) {
    return new Response(comingSoonHtml(site.name), {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // Password gate — non-owners must supply the correct ?pw= query param.
  if (!isOwner && settings?.guestPassword) {
    const url = new URL(request.url);
    const pw = url.searchParams.get("pw");
    if (pw !== settings.guestPassword) {
      const accent = settings.accentColor ?? "#0d9488";
      const siteName = settings.eventName ?? site.name;
      const gateHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(siteName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, serif;
      background: #faf8f5;
      color: #292524;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      padding: 1.5rem;
    }
    .gate-wrap {
      text-align: center;
      max-width: 360px;
      width: 100%;
    }
    h1 {
      font-size: 1.75rem;
      font-weight: normal;
      margin-bottom: 0.5rem;
    }
    p {
      color: #78716c;
      margin-bottom: 1.75rem;
      font-size: 0.9375rem;
    }
    .gate-form {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }
    .gate-input {
      width: 100%;
      border: 1px solid #e7e5e4;
      border-radius: 6px;
      padding: 0.625rem 0.875rem;
      font-family: inherit;
      font-size: 1rem;
      color: #292524;
      outline: none;
      transition: border-color 0.15s;
    }
    .gate-input:focus { border-color: ${escHtml(accent)}; }
    .gate-btn {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 6px;
      background: ${escHtml(accent)};
      color: #fff;
      font-family: inherit;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .gate-btn:hover { opacity: 0.88; }
  </style>
</head>
<body>
  <div class="gate-wrap">
    <h1>${escHtml(siteName)}</h1>
    <p>This site is password protected. Please enter the password to continue.</p>
    <form class="gate-form" method="get">
      <input class="gate-input" type="password" name="pw" placeholder="Enter password" aria-label="Site password" required />
      <button class="gate-btn" type="submit">Enter</button>
    </form>
  </div>
</body>
</html>`;
      return new Response(gateHtml, {
        status: 401,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  }

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

  // Load content tab data from site_content table
  const contentResult = await db
    .prepare("SELECT pageSlug, lang, content FROM site_content WHERE siteId = ?")
    .bind(site.id)
    .all<{ pageSlug: string; lang: string; content: string }>();

  const contentMap: ContentMap = new Map();
  for (const row of contentResult.results) {
    if (!contentMap.has(row.pageSlug)) contentMap.set(row.pageSlug, new Map());
    try {
      contentMap.get(row.pageSlug)!.set(row.lang, JSON.parse(row.content) as Record<string, unknown>);
    } catch { /* skip malformed */ }
  }

  // Return a raw HTML Response — the site has its own full document with
  // inlined CSS and does not participate in the app shell.
  const reqUrl = new URL(request.url);
  const activeLang = reqUrl.searchParams.get("_lang") ?? null;
  return new Response(buildHtml(site, settings ?? null, pages, contentMap, site.slug, activeLang), {
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
