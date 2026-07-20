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
  renderPhotoSplitReact,
  renderStoryTimelineReact,
  renderRsvpReact,
  renderRsvpFormReact,
  renderGuestBookReact,
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
  rsvp: renderRsvpReact,
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
  "photo-split": renderPhotoSplitReact,
  "multi-text": renderMultiTextReact,
  "media-video": renderMediaVideoReact,
  gallery: renderGalleryReact,
  "info-card": renderInfoCardReact,
  "rsvp-form": renderRsvpFormReact,
  "story-timeline": renderStoryTimelineReact,
  "guest-book": renderGuestBookReact,
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
