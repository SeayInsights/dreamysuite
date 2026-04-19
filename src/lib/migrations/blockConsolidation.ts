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

const MIGRATORS: Record<string, (b: RawBlock) => RawBlock> = {
  video: migrateVideo,
  youtube: migrateYoutube,
  images: migrateImages,
  "photo-split": migratePhotoSplit,
  "registry-card": migrateRegistryCard,
  "hotel-card": migrateHotelCard,
  rsvp: migrateRsvp,
  tidbits: migrateTidbits,
};

// ── Public API ────────────────────────────────────────────────────────────────

export interface MigrationResult {
  blocks: RawBlock[];
  migrated: number;
  unchanged: number;
}

export function consolidateBlocks(blocks: RawBlock[]): MigrationResult {
  let migrated = 0;
  const result = blocks.map((block) => {
    const migrator = MIGRATORS[block.type];
    if (migrator) {
      migrated++;
      return migrator(block);
    }
    return block;
  });
  return { blocks: result, migrated, unchanged: blocks.length - migrated };
}

export function needsMigration(block: RawBlock): boolean {
  return block.type in MIGRATORS;
}
