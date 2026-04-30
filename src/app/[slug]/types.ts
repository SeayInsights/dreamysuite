// ── Domain types ──────────────────────────────────────────────────────────────

export interface SiteRow {
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

export interface SiteSettingRow {
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
  showNavBrand?: number | null;
  navPosition: string | null;       // "fixed" | "scroll-away" | null
  navShape: string | null;          // "bar" | "pill" | "floating" | null
  navMaterial: string | null;       // "solid" | "glass" | "frosted" | null
  navBrandColor: string | null;
  navLinkColor: string | null;
  navHighlightColor: string | null;
  animation: string | null;
  bgImage: string | null;
  envelopeColor: string | null;
  sealInitials: string | null;
  cardColor: string | null;
  cardImage: string | null;
  navLinkPadding: string | null;
  navUnderline: string | null;
  siteLanguages: string | null;
  popupEnabled: number | null;
  popupTitle: string | null;
  popupTicker: number | null;
  popupBundle: number | null;
  musicBtnBg: string | null;
  musicBtnColor: string | null;
  marginTop: number | null;
  marginRight: number | null;
  marginBottom: number | null;
  marginLeft: number | null;
  bgImageLayer: string | null;
  bgImageOpacity: number | null;
  bgImageBleed: number | null;
  backgroundImage: string | null;
  siteMaxWidth: number | null;
  sectionSpacing: string | null;
  passwordPages: string | null;
  effectPreset: string | null;
  effectBg: string | null;
  effectNavStyle: string | null;
  effectText: string | null;
  effectCard: string | null;
  effectTransition: string | null;
  effectCursor: string | null;
  effectDecoration: string | null;
  effectColor1: string | null;
  effectColor2: string | null;
  effectColor3: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
}

export interface PageRow {
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

export interface BlockRow {
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

export interface ParsedBlock extends Omit<BlockRow, "config"> {
  config: Record<string, unknown>;
}

export interface PageWithBlocks extends PageRow {
  blocks: ParsedBlock[];
}

// contentMap[pageSlug][lang] = parsed content object
export type ContentMap = Map<string, Map<string, Record<string, unknown>>>;

export type BlockTransMap = Record<string, Record<string, Record<string, string>>>;
