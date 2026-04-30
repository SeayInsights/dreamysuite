import { DatabaseError, NotFoundError } from '../../errors';

// =============================================================================
// TYPE DEFINITIONS — MEDIA
// =============================================================================

export interface CreateMediaInput {
  id?: string;
  siteId: string;
  key: string;
  url: string;
  filename: string;
  size?: number;
  type?: string;
  metadata?: string;
}

export interface UpdateMediaInput {
  filename?: string;
  metadata?: string;
}

export interface MediaItem {
  id: string;
  siteId: string;
  key: string;
  url: string;
  filename: string;
  size: number | null;
  type: string | null;
  metadata: string | null;
  createdAt: number;
  updatedAt: number;
}

// =============================================================================
// MEDIA QUERIES
// =============================================================================

/**
 * Get a media item by ID
 *
 * @param db - D1 database instance
 * @param id - Media ID
 * @returns MediaItem or null if not found
 */
export async function getMediaById(
  db: D1Database,
  id: string
): Promise<MediaItem | null> {
  return db
    .prepare("SELECT * FROM media_item WHERE id = ?")
    .bind(id)
    .first<MediaItem>();
}

/**
 * Get all media for a site
 *
 * @param db - D1 database instance
 * @param siteId - Site ID
 * @returns Array of media items
 */
export async function getMediaBySiteId(
  db: D1Database,
  siteId: string
): Promise<MediaItem[]> {
  const result = await db
    .prepare("SELECT * FROM media_item WHERE siteId = ? ORDER BY createdAt DESC")
    .bind(siteId)
    .all<MediaItem>();

  return result.results || [];
}

/**
 * Create a new media item
 *
 * @param db - D1 database instance
 * @param data - Media data
 * @returns Created media item
 */
export async function createMediaItem(
  db: D1Database,
  data: CreateMediaInput
): Promise<MediaItem> {
  const id = data.id || crypto.randomUUID();
  const now = Date.now();

  const media = await db
    .prepare(
      "INSERT INTO media_item (id, siteId, key, url, filename, size, type, metadata, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
    )
    .bind(
      id,
      data.siteId,
      data.key,
      data.url,
      data.filename,
      data.size || null,
      data.type || null,
      data.metadata || null,
      now,
      now
    )
    .first<MediaItem>();

  if (!media) {
    throw new DatabaseError("Failed to create media item", {
      operation: 'INSERT',
      table: 'media_item',
      siteId: data.siteId,
    });
  }

  return media;
}

/**
 * Update a media item
 *
 * @param db - D1 database instance
 * @param id - Media ID
 * @param data - Partial media data
 * @returns Updated media item
 */
export async function updateMediaItem(
  db: D1Database,
  id: string,
  data: UpdateMediaInput
): Promise<MediaItem> {
  const now = Date.now();
  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (data.filename !== undefined) {
    updates.push("filename = ?");
    bindings.push(data.filename);
  }
  if (data.metadata !== undefined) {
    updates.push("metadata = ?");
    bindings.push(data.metadata);
  }

  updates.push("updatedAt = ?");
  bindings.push(now);

  bindings.push(id);

  const media = await db
    .prepare(
      `UPDATE media_item SET ${updates.join(", ")} WHERE id = ? RETURNING *`
    )
    .bind(...bindings)
    .first<MediaItem>();

  if (!media) {
    throw new NotFoundError("Media item not found", { mediaId: id });
  }

  return media;
}

/**
 * Delete a media item
 *
 * @param db - D1 database instance
 * @param id - Media ID
 */
export async function deleteMediaItem(
  db: D1Database,
  id: string
): Promise<void> {
  await db.prepare("DELETE FROM media_item WHERE id = ?").bind(id).run();
}
