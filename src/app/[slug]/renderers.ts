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
  /** translated value → content-tab data → block config → fallback */
  cnt: (contentKey: string, cfgKey?: string, fallback?: string) => string;
}

type BlockRenderer = (ctx: RenderContext) => string | Promise<string>;

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

export async function renderBlock(
  block: ParsedBlock,
  settings: SiteSettingRow | null,
  pageContent?: Record<string, unknown>,
  siteSlug?: string,
  blockTransMap?: BlockTransMap,
  renderLang?: string,
  mainLang?: string,
): Promise<string> {
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

  const ctx: RenderContext = {
    block,
    settings,
    pageContent,
    siteSlug,
    cfg,
    accent,
    cnt,
  };
  return await (BLOCK_RENDERERS[block.type] ?? renderUnknown)(ctx);
}
