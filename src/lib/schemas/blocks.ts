import { z } from "zod";

/**
 * Zod schemas for all supported block types.
 *
 * Each schema validates the render-critical fields typed.
 * Unknown additional fields are allowed (`.catchall`) so editor-side config
 * can store extra keys without being rejected. Later phases may tighten.
 *
 * When a new block type is added:
 *   1. Add its component to `src/app/components/blocks/`
 *   2. Add its schema here
 *   3. Add it to the `BLOCK_TYPES` union below and the discriminated union
 *   4. Register it in `src/app/components/blocks/index.ts` BLOCK_COMPONENTS
 */

const passthrough = z.unknown();

// ─── Legacy schemas (kept for un-migrated records) ───────────────────────────

const HomeHeroConfig = z.object({
  coupleNames: z.string().optional(),
  dateText: z.string().optional(),
  locationText: z.string().optional(),
}).catchall(passthrough);

const HeaderConfig = z.object({
  title: z.string().optional(),
  heading: z.string().optional(),
  text: z.string().optional(),
  titleSize: z.string().optional(),
  titleAlign: z.enum(["left", "center", "right"]).optional(),
  titleBold: z.boolean().optional(),
  titleItalic: z.boolean().optional(),
  titleUnderline: z.boolean().optional(),
}).catchall(passthrough);

const MultiTextConfig = z.object({
  mode: z.enum(["text", "schedule", "faq", "tidbits", "travel"]).optional(),
  heading: z.string().optional(),
  body: z.string().optional(),
  text: z.string().optional(),
  events: z.array(z.unknown()).optional(),
}).catchall(passthrough);

const VideoConfig = z.object({
  url: z.string().optional(),
  height: z.string().optional(),
}).catchall(passthrough);

const CountdownConfig = z.object({
  label: z.string().optional(),
}).catchall(passthrough);

const ImagesConfig = z.object({
  urls: z.array(z.string()).optional(),
  imageSlot: z.string().optional(),
}).catchall(passthrough);

const YoutubeConfig = z.object({
  url: z.string().optional(),
}).catchall(passthrough);

const SpacerConfig = z.object({
  height: z.string().optional(),
}).catchall(passthrough);

const RegistryCardConfig = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
}).catchall(passthrough);

const HotelCardConfig = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  address: z.string().optional(),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
}).catchall(passthrough);

const VenueMapConfig = z.object({
  heading: z.string().optional(),
  venueName: z.string().optional(),
  venuePlaceId: z.string().optional(),
  venueCoordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  noteToGuests: z.string().optional(),
  hotels: z.array(z.object({
    id: z.string(),
    placeId: z.string(),
    name: z.string(),
    photo: z.string().optional(),
    photoRefs: z.array(z.string()).optional(),
    photoIndex: z.number().optional(),
    rating: z.number().optional(),
    featured: z.boolean().optional(),
    stayingHere: z.boolean().optional(),
  })).optional(),
}).catchall(passthrough);

const PhotoSplitConfig = z.object({
  imageUrl: z.string().optional(),
  heading: z.string().optional(),
  body: z.string().optional(),
  text: z.string().optional(),
  layout: z.enum(["left", "right"]).optional(),
}).catchall(passthrough);

// ─── Consolidated schemas (Task 18) ──────────────────────────────────────────

const MediaVideoConfig = z.object({
  provider: z.enum(["direct", "youtube", "vimeo", "gif"]).optional(),
  url: z.string().optional(),
  height: z.string().optional(),
}).catchall(passthrough);

const GalleryConfig = z.object({
  layout: z.enum(["grid", "split"]).optional(),
  urls: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  heading: z.string().optional(),
  body: z.string().optional(),
  imageLayout: z.enum(["left", "right"]).optional(),
}).catchall(passthrough);

const InfoCardConfig = z.object({
  variant: z.enum(["registry", "hotel"]).optional(),
  name: z.string().optional(),
  title: z.string().optional(),
  address: z.string().optional(),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
}).catchall(passthrough);

// ─── New block schemas (Task 19) ─────────────────────────────────────────────

const TimelineEvent = z.object({
  date: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

const RsvpFormConfig = z.object({
  heading: z.string().optional(),
  subheading: z.string().optional(),
  siteId: z.string().optional(),
}).catchall(passthrough);

const StoryTimelineConfig = z.object({
  heading: z.string().optional(),
  events: z.array(TimelineEvent).optional(),
}).catchall(passthrough);

const GuestBookConfig = z.object({
  heading: z.string().optional(),
  placeholder: z.string().optional(),
}).catchall(passthrough);

// ─── New block schemas (Task 3) ─────────────────────────────────────────────

const ContentCardConfig = z.object({
  heading: z.string().optional(),
  displayMode: z.enum(["facts", "faq", "travel", "general"]).optional(),
  columns: z.union([z.literal("auto"), z.literal("2"), z.literal("3"), z.literal("4")]).optional(),
  cardStyle: z.enum(["card", "bordered", "flat", "numbered", "accordion", "list"]).optional(),
  items: z.array(z.object({
    id: z.string().optional(),
    question: z.string().optional(),
    body: z.string().optional(),
    icon: z.string().optional(),
    links: z.array(z.object({
      label: z.string(),
      url: z.string(),
    })).optional(),
  })).optional(),
}).catchall(passthrough);

const FaqConfig = ContentCardConfig;
const FunFactsConfig = ContentCardConfig;
const TravelConfig = ContentCardConfig;

const RegistryItemConfig = z.object({
  id: z.string(),
  type: z.enum(["store", "fund"]),
  store: z.string().optional(),
  customName: z.string().optional(),
  logoUrl: z.string().optional(),
  url: z.string().optional(),
  message: z.string().optional(),
  fundTitle: z.string().optional(),
  fundDescription: z.string().optional(),
  fundGoal: z.number().optional(),
  platform: z.enum(["paypal", "venmo", "zelle", "cashapp", "other"]).optional(),
  platformUrl: z.string().optional(),
  platformHandle: z.string().optional(),
});

const RegistryConfig = z.object({
  heading: z.string().optional(),
  subheading: z.string().optional(),
  displayMode: z.enum(["grid", "list"]).optional(),
  items: z.array(RegistryItemConfig).optional(),
}).catchall(passthrough);

const ScheduleConfig = z.object({
  heading: z.string().optional(),
  displayMode: z.enum(["timeline", "cards"]).optional(),
  events: z.array(z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    endTime: z.string().optional(),
    location: z.string().optional(),
    description: z.string().optional(),
    dressCode: z.string().optional(),
    icon: z.string().optional(),
    mapsUrl: z.string().optional(),
  })).optional(),
}).catchall(passthrough);

// ─── Registry ─────────────────────────────────────────────────────────────────

export const BLOCK_TYPES = [
  // Legacy (preserved for un-migrated records)
  "home-hero",
  "couple",
  "header",
  "multi-text",
  "video",
  "countdown",
  "images",
  "youtube",
  "spacer",
  "registry-card",
  "hotel-card",
  "venue-map",
  "photo-split",
  // Consolidated (Task 18)
  "media-video",
  "gallery",
  "info-card",
  // Legacy aliases
  "rsvp",
  // New (Task 19)
  "rsvp-form",
  "story-timeline",
  "guest-book",
  // New (Task 3)
  "faq",
  "schedule",
  "fun-facts",
  "travel",
  "content-card",
  "registry",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

const CONFIG_BY_TYPE: Record<BlockType, z.ZodTypeAny> = {
  // Legacy
  "home-hero": HomeHeroConfig,
  couple: HomeHeroConfig,
  header: HeaderConfig,
  "multi-text": MultiTextConfig,
  video: VideoConfig,
  countdown: CountdownConfig,
  images: ImagesConfig,
  youtube: YoutubeConfig,
  spacer: SpacerConfig,
  "registry-card": RegistryCardConfig,
  "hotel-card": HotelCardConfig,
  "venue-map": VenueMapConfig,
  "photo-split": PhotoSplitConfig,
  // Consolidated
  "media-video": MediaVideoConfig,
  gallery: GalleryConfig,
  "info-card": InfoCardConfig,
  // Legacy alias
  rsvp: RsvpFormConfig,
  // New (Task 19)
  "rsvp-form": RsvpFormConfig,
  "story-timeline": StoryTimelineConfig,
  "guest-book": GuestBookConfig,
  // New (Task 3)
  faq: FaqConfig,
  schedule: ScheduleConfig,
  "fun-facts": FunFactsConfig,
  travel: TravelConfig,
  "content-card": ContentCardConfig,
  registry: RegistryConfig,
};

export function isKnownBlockType(type: string): type is BlockType {
  return (BLOCK_TYPES as readonly string[]).includes(type);
}

export type BlockParseResult<T = unknown> =
  | { ok: true; config: T }
  | { ok: false; error: string; fallback: Record<string, unknown> };

/**
 * Parse raw block config (string JSON or object) against the schema for its type.
 * Unknown block types pass through as objects for forward-compat.
 * Invalid JSON or schema mismatch returns { ok: false } with a safe fallback —
 * callers should log and degrade gracefully rather than silently use {}.
 */
export function parseBlockConfig(
  type: string,
  raw: unknown,
): BlockParseResult {
  let candidate: unknown;
  if (typeof raw === "string") {
    try {
      candidate = raw.length === 0 ? {} : JSON.parse(raw);
    } catch {
      return {
        ok: false,
        error: `Invalid JSON in ${type} block config`,
        fallback: {},
      };
    }
  } else if (raw == null) {
    candidate = {};
  } else {
    candidate = raw;
  }

  if (!isKnownBlockType(type)) {
    if (typeof candidate === "object" && candidate !== null) {
      return { ok: true, config: candidate };
    }
    return {
      ok: false,
      error: `Unknown block type ${type}`,
      fallback: {},
    };
  }

  const schema = CONFIG_BY_TYPE[type];
  const result = schema.safeParse(candidate);
  if (result.success) return { ok: true, config: result.data };

  return {
    ok: false,
    error: result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; "),
    fallback:
      typeof candidate === "object" && candidate !== null
        ? (candidate as Record<string, unknown>)
        : {},
  };
}

/**
 * Convenience wrapper for read paths: parse, log a diagnostic on mismatch,
 * and return the config (or fallback) as a plain record.
 */
export function safeBlockConfig(block: {
  id?: string;
  type: string;
  config: unknown;
}): Record<string, unknown> {
  const result = parseBlockConfig(block.type, block.config);
  if (!result.ok) {
    const label = block.id ? `block:${block.id}` : `block:${block.type}`;
    console.warn(`[${label}] invalid config: ${result.error}`);
  }
  const out = result.ok ? result.config : result.fallback;
  return typeof out === "object" && out !== null
    ? (out as Record<string, unknown>)
    : {};
}
