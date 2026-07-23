// ── Curated stock image library ──────────────────────────────────────────────
//
// Self-hosted, original background art shipped as static SVGs under
// /public/stock. No external stock API (Unsplash/Pexels), no API keys, no rate
// limits, no attribution burden — every image here is original work, license-
// clean, and served same-origin so it renders on published + custom-domain
// sites unchanged (see rewritePhotoUrlsToPublic, which only rewrites /api/sites
// photo URLs and passes /stock URLs through).
//
// This manifest is the single source of truth. Adding an image = drop the file
// in /public/stock and add one entry here. Entries can also point at future
// .webp photo assets — the picker only cares about `url`.

export type StockCategory =
  | "romance"
  | "botanical"
  | "celebration"
  | "night"
  | "texture"
  | "minimal";

/**
 * texture — subtle full-page background fills (marble/linen/gradients).
 * scene   — bold, visible illustrated art suited to hero backgrounds/galleries.
 * photo   — real photography dropped into /stock/photos (see that README).
 */
export type StockKind = "texture" | "scene" | "photo";

export interface StockImage {
  /** Stable id (also the filename stem). */
  id: string;
  /** Public, same-origin URL under /stock. */
  url: string;
  /** Human label shown in the picker. */
  label: string;
  category: StockCategory;
  /** Visual role; defaults to "texture" when omitted. */
  kind?: StockKind;
}

export const STOCK_CATEGORIES: { id: StockCategory; label: string }[] = [
  { id: "romance", label: "Romance" },
  { id: "botanical", label: "Botanical" },
  { id: "celebration", label: "Celebration" },
  { id: "night", label: "Night" },
  { id: "texture", label: "Texture" },
  { id: "minimal", label: "Minimal" },
];

export const STOCK_IMAGES: StockImage[] = [
  {
    id: "romance-blush",
    url: "/stock/romance-blush.svg",
    label: "Blush Bloom",
    category: "romance",
  },
  {
    id: "romance-sunset",
    url: "/stock/romance-sunset.svg",
    label: "Sunset Wash",
    category: "romance",
  },
  {
    id: "botanical-eucalyptus",
    url: "/stock/botanical-eucalyptus.svg",
    label: "Eucalyptus",
    category: "botanical",
  },
  {
    id: "botanical-arch",
    url: "/stock/botanical-arch.svg",
    label: "Floral Arch",
    category: "botanical",
  },
  {
    id: "celebration-confetti",
    url: "/stock/celebration-confetti.svg",
    label: "Confetti",
    category: "celebration",
  },
  {
    id: "celebration-gold",
    url: "/stock/celebration-gold.svg",
    label: "Gold Arcs",
    category: "celebration",
  },
  {
    id: "night-aurora",
    url: "/stock/night-aurora.svg",
    label: "Aurora",
    category: "night",
  },
  {
    id: "night-starfield",
    url: "/stock/night-starfield.svg",
    label: "Starfield",
    category: "night",
  },
  {
    id: "texture-marble",
    url: "/stock/texture-marble.svg",
    label: "Marble",
    category: "texture",
  },
  {
    id: "texture-linen",
    url: "/stock/texture-linen.svg",
    label: "Linen",
    category: "texture",
  },
  {
    id: "minimal-sage",
    url: "/stock/minimal-sage.svg",
    label: "Sage Fade",
    category: "minimal",
  },
  {
    id: "minimal-dusk",
    url: "/stock/minimal-dusk.svg",
    label: "Dusk",
    category: "minimal",
  },

  // ── Scenes: bold, visible illustrated art for hero backgrounds/galleries ──
  {
    id: "scene-romance-arch",
    url: "/stock/scene-romance-arch.svg",
    label: "Floral Archway",
    category: "romance",
    kind: "scene",
  },
  {
    id: "scene-garden",
    url: "/stock/scene-garden.svg",
    label: "Garden Landscape",
    category: "botanical",
    kind: "scene",
  },
  {
    id: "scene-night-vows",
    url: "/stock/scene-night-vows.svg",
    label: "Starlit Mountains",
    category: "night",
    kind: "scene",
  },
  {
    id: "scene-celebration",
    url: "/stock/scene-celebration.svg",
    label: "Confetti Burst",
    category: "celebration",
    kind: "scene",
  },
  {
    id: "scene-elegant-gold",
    url: "/stock/scene-elegant-gold.svg",
    label: "Deco Gold",
    category: "texture",
    kind: "scene",
  },
  {
    id: "scene-modern",
    url: "/stock/scene-modern.svg",
    label: "Modern Blocks",
    category: "minimal",
    kind: "scene",
  },
];

/** True when a URL points at a bundled stock image. */
export function isStockUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && url.startsWith("/stock/");
}

/** The effective kind of an entry (defaults to "texture"). */
export function stockKind(img: StockImage): StockKind {
  return img.kind ?? "texture";
}

/** All entries of a given kind. */
export function stockByKind(kind: StockKind): StockImage[] {
  return STOCK_IMAGES.filter((i) => stockKind(i) === kind);
}

/** A hero-suitable scene URL for a category (falls back to any scene). */
export function sceneUrlFor(category: StockCategory): string | null {
  const scenes = stockByKind("scene");
  return (
    scenes.find((s) => s.category === category)?.url ?? scenes[0]?.url ?? null
  );
}
