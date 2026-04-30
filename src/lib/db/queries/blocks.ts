import { DatabaseError, NotFoundError } from '../../errors';

// =============================================================================
// TYPE DEFINITIONS — BLOCKS
// =============================================================================

export interface CreateBlockInput {
  id?: string;
  siteId: string;
  pageId: string;
  type: string;
  config: string; // JSON string
  sortOrder?: number;
}

export interface UpdateBlockInput {
  type?: string;
  config?: string;
  overrides?: string | null;
  sortOrder?: number;
  isVisible?: number;
}

/**
 * Block (Database Layer)
 *
 * Represents a content block as stored in the database.
 *
 * Note: This is the DATABASE type. Store and component layers use different Block types:
 * - Store Block: config is parsed object, has overrides field, optional fields
 * - Component Block: flexible config (string | object), index signature for extensibility
 *
 * Transform DB → Store: JSON.parse(config), make fields optional
 * Transform Store → DB: JSON.stringify(config), ensure required fields present
 */
export interface Block {
  id: string;
  siteId: string;
  pageId: string;
  type: string;
  config: string; // JSON string from database
  overrides: string | null; // JSON string: { tablet?, mobile? } per-breakpoint config
  sortOrder: number; // Always present (DB has default value)
  isVisible: number; // SQLite boolean: 0=hidden, 1=visible
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

// =============================================================================
// BLOCK QUERIES
// =============================================================================

/**
 * Get a block by ID
 *
 * @param db - D1 database instance
 * @param id - Block ID
 * @returns Block or null if not found
 *
 * @example
 * const block = await getBlockById(env.DB, 'block-123');
 * if (!block) return apiError('NOT_FOUND', 'Block not found', 404);
 */
export async function getBlockById(
  db: D1Database,
  id: string
): Promise<Block | null> {
  return db.prepare("SELECT * FROM block WHERE id = ?").bind(id).first<Block>();
}

/**
 * Get all blocks for a page, ordered by sortOrder
 *
 * @param db - D1 database instance
 * @param pageId - Page ID
 * @returns Array of blocks
 *
 * @example
 * const blocks = await getBlocksByPageId(env.DB, 'page-123');
 */
export async function getBlocksByPageId(
  db: D1Database,
  pageId: string
): Promise<Block[]> {
  const result = await db
    .prepare("SELECT * FROM block WHERE pageId = ? ORDER BY sortOrder ASC")
    .bind(pageId)
    .all<Block>();

  return result.results || [];
}

/**
 * Get the maximum sortOrder for blocks in a page
 *
 * @param db - D1 database instance
 * @param pageId - Page ID
 * @returns Maximum sortOrder (-1 if no blocks)
 *
 * @example
 * const maxOrder = await getMaxBlockSortOrder(env.DB, pageId);
 * const newOrder = maxOrder + 1;
 */
export async function getMaxBlockSortOrder(
  db: D1Database,
  pageId: string
): Promise<number> {
  const result = await db
    .prepare(
      "SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM block WHERE pageId = ?"
    )
    .bind(pageId)
    .first<{ maxOrder: number }>();

  return result?.maxOrder ?? -1;
}

/**
 * Create a new block
 *
 * @param db - D1 database instance
 * @param data - Block data
 * @returns Created block
 *
 * @example
 * const block = await createBlock(env.DB, {
 *   siteId: 'site-123',
 *   pageId: 'page-123',
 *   type: 'hero',
 *   config: JSON.stringify(config),
 *   sortOrder: 0
 * });
 */
export async function createBlock(
  db: D1Database,
  data: CreateBlockInput
): Promise<Block> {
  const id = data.id || crypto.randomUUID();
  const now = Date.now();
  const sortOrder = data.sortOrder ?? 0;

  const block = await db
    .prepare(
      "INSERT INTO block (id, siteId, pageId, type, config, sortOrder, isVisible, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?) RETURNING *"
    )
    .bind(
      id,
      data.siteId,
      data.pageId,
      data.type,
      data.config,
      sortOrder,
      now,
      now
    )
    .first<Block>();

  if (!block) {
    throw new DatabaseError("Failed to create block", {
      operation: 'INSERT',
      table: 'block',
      siteId: data.siteId,
      pageId: data.pageId,
    });
  }

  return block;
}

/**
 * Update a block
 *
 * @param db - D1 database instance
 * @param id - Block ID
 * @param data - Partial block data
 * @returns Updated block
 *
 * @example
 * const block = await updateBlock(env.DB, 'block-123', {
 *   config: JSON.stringify(newConfig)
 * });
 */
export async function updateBlock(
  db: D1Database,
  id: string,
  data: UpdateBlockInput
): Promise<Block> {
  const now = Date.now();
  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (data.type !== undefined) {
    updates.push("type = ?");
    bindings.push(data.type);
  }
  if (data.config !== undefined) {
    updates.push("config = ?");
    bindings.push(data.config);
  }
  if (data.overrides !== undefined) {
    updates.push("overrides = ?");
    bindings.push(data.overrides);
  }
  if (data.sortOrder !== undefined) {
    updates.push("sortOrder = ?");
    bindings.push(data.sortOrder);
  }
  if (data.isVisible !== undefined) {
    updates.push("isVisible = ?");
    bindings.push(data.isVisible);
  }

  updates.push("updatedAt = ?");
  bindings.push(now);

  bindings.push(id);

  const block = await db
    .prepare(
      `UPDATE block SET ${updates.join(", ")} WHERE id = ? RETURNING *`
    )
    .bind(...bindings)
    .first<Block>();

  if (!block) {
    throw new NotFoundError("Block not found", { blockId: id });
  }

  return block;
}

/**
 * Delete a block
 *
 * @param db - D1 database instance
 * @param id - Block ID
 *
 * @example
 * await deleteBlock(env.DB, 'block-123');
 */
export async function deleteBlock(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM block WHERE id = ?").bind(id).run();
}
