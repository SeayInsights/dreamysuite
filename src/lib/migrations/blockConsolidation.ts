/**
 * Block consolidation migration — Task 18
 *
 * Converts legacy block types to their consolidated replacements:
 *   video + youtube      → media-video
 *   images + photo-split → gallery
 *   registry-card + hotel-card → info-card
 *
 * Pure function: takes a block array, returns a new array with migrated
 * records. Safe to run multiple times (idempotent). Legacy block types
 * remain renderable even without migration — this just normalises the type
 * field so the registry can drop legacy aliases in a future phase.
 */

interface RawBlock {
  id: string;
  type: string;
  config?: string | Record<string, unknown>;
  sortOrder?: number;
  isVisible?: number;
  [key: string]: unknown;
}

function parseConfig(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try { return raw.length ? JSON.parse(raw) : {}; } catch { return {}; }
  }
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

function serializeConfig(cfg: Record<string, unknown>): string {
  return JSON.stringify(cfg);
}

// ── Migrators ─────────────────────────────────────────────────────────────────

function migrateVideo(block: RawBlock): RawBlock {
  const cfg = parseConfig(block.config);
  return {
    ...block,
    type: "media-video",
    config: serializeConfig({ provider: "direct", ...cfg }),
  };
}

function migrateYoutube(block: RawBlock): RawBlock {
  const cfg = parseConfig(block.config);
  return {
    ...block,
    type: "media-video",
    config: serializeConfig({ provider: "youtube", ...cfg }),
  };
}

function migrateImages(block: RawBlock): RawBlock {
  const cfg = parseConfig(block.config);
  return {
    ...block,
    type: "gallery",
    config: serializeConfig({ layout: "grid", ...cfg }),
  };
}

function migratePhotoSplit(block: RawBlock): RawBlock {
  const cfg = parseConfig(block.config);
  const { layout: imageLayout, ...rest } = cfg as { layout?: string; [k: string]: unknown };
  return {
    ...block,
    type: "gallery",
    config: serializeConfig({ layout: "split", imageLayout: imageLayout ?? "left", ...rest }),
  };
}

function migrateRegistryCard(block: RawBlock): RawBlock {
  const cfg = parseConfig(block.config);
  return {
    ...block,
    type: "info-card",
    config: serializeConfig({ variant: "registry", ...cfg }),
  };
}

function migrateHotelCard(block: RawBlock): RawBlock {
  const cfg = parseConfig(block.config);
  return {
    ...block,
    type: "info-card",
    config: serializeConfig({ variant: "hotel", ...cfg }),
  };
}

function migrateRsvp(block: RawBlock): RawBlock {
  const cfg = parseConfig(block.config);
  return {
    ...block,
    type: "rsvp-form",
    config: serializeConfig(cfg),
  };
}

function migrateTidbits(block: RawBlock): RawBlock {
  const cfg = parseConfig(block.config);
  return {
    ...block,
    type: "fun-facts",
    config: serializeConfig(cfg),
  };
}

function migrateTravelSection(block: RawBlock): RawBlock {
  const cfg = parseConfig(block.config);
  return {
    ...block,
    type: "travel",
    config: serializeConfig(cfg),
  };
}

// multi-text blocks whose mode maps to a dedicated v2 block type
const MULTI_TEXT_MODE_MAP: Record<string, string> = {
  schedule: "schedule",
  faq: "faq",
  tidbits: "fun-facts",
  travel: "travel",
};

function migrateMultiText(block: RawBlock): RawBlock | null {
  const cfg = parseConfig(block.config);
  const mode = typeof cfg.mode === "string" ? cfg.mode : "";
  const targetType = MULTI_TEXT_MODE_MAP[mode];
  if (!targetType) return null;
  return { ...block, type: targetType, config: serializeConfig(cfg) };
}

const MIGRATORS: Record<string, (b: RawBlock) => RawBlock> = {
  video: migrateVideo,
  youtube: migrateYoutube,
  images: migrateImages,
  "photo-split": migratePhotoSplit,
  "registry-card": migrateRegistryCard,
  "hotel-card": migrateHotelCard,
  rsvp: migrateRsvp,
  tidbits: migrateTidbits,
  "travel-section": migrateTravelSection,
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Result of a block consolidation migration
 */
export interface MigrationResult {
  /** Migrated blocks (includes both changed and unchanged) */
  blocks: RawBlock[];
  /** Count of blocks that were migrated */
  migrated: number;
  /** Count of blocks that did not need migration */
  unchanged: number;
}

/**
 * Consolidate legacy block types to current v2 block types
 *
 * Converts:
 * - video, youtube → media-video (with provider flag)
 * - images, photo-split → gallery (with layout flag)
 * - registry-card, hotel-card → info-card (with variant flag)
 * - rsvp → rsvp-form
 * - tidbits → fun-facts
 * - travel-section → travel
 * - multi-text (mode-specific) → dedicated block types
 *
 * @param blocks - Array of blocks to potentially migrate
 * @returns Migration result with updated blocks and migration stats
 *
 * @example
 * const result = consolidateBlocks([
 *   { id: "1", type: "video", config: "{}" },
 *   { id: "2", type: "countdown", config: "{}" }, // No migration needed
 * ]);
 * // result.blocks: [
 * //   { id: "1", type: "media-video", config: '{"provider":"direct"}' },
 * //   { id: "2", type: "countdown", config: "{}" }
 * // ]
 * // result.migrated: 1
 * // result.unchanged: 1
 */
export function consolidateBlocks(blocks: RawBlock[]): MigrationResult {
  let migrated = 0;
  const result = blocks.map((block) => {
    // multi-text mode consolidation (mode-dependent, handled separately)
    if (block.type === "multi-text") {
      const converted = migrateMultiText(block);
      if (converted) {
        migrated++;
        return converted;
      }
      return block;
    }
    const migrator = MIGRATORS[block.type];
    if (migrator) {
      migrated++;
      return migrator(block);
    }
    return block;
  });
  return { blocks: result, migrated, unchanged: blocks.length - migrated };
}

/**
 * Check if a block needs consolidation migration
 *
 * @param block - Block to check
 * @returns True if block type is legacy and needs migration
 *
 * @example
 * needsMigration({ id: "1", type: "video", config: "{}" }) // true
 * needsMigration({ id: "2", type: "media-video", config: "{}" }) // false
 */
export function needsMigration(block: RawBlock): boolean {
  if (block.type === "multi-text") {
    const cfg = parseConfig(block.config);
    const mode = typeof cfg.mode === "string" ? cfg.mode : "";
    return mode in MULTI_TEXT_MODE_MAP;
  }
  return block.type in MIGRATORS;
}
