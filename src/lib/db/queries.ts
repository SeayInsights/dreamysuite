/**
 * Database Queries - Single Source of Truth
 *
 * All database queries live here. No scattered SQL in API routes.
 *
 * ## Architecture Decision
 *
 * This module centralizes all database access patterns for the application.
 * It consolidates:
 * - Typed query functions for all tables
 * - Standard CRUD operations
 * - Complex multi-table operations
 * - Transaction handling
 *
 * ## Why This Pattern?
 *
 * **Before:** SQL scattered across 50+ API routes
 * - Duplicate queries in multiple files
 * - No type safety on results
 * - Hard to audit data access
 * - Difficult to test query logic
 *
 * **After:** Single import path for all queries
 * - `import { getBlockById, createBlock } from '@/lib/db/queries'`
 * - Typed inputs and outputs
 * - Easy to audit and maintain
 * - Testable query layer
 *
 * ## Usage Guidelines
 *
 * ### Basic CRUD Operations
 * ```typescript
 * import { getBlockById, createBlock } from '@/lib/db/queries';
 *
 * // Read
 * const block = await getBlockById(env.DB, blockId);
 * if (!block) {
 *   return apiError('NOT_FOUND', 'Block not found', 404);
 * }
 *
 * // Create
 * const newBlock = await createBlock(env.DB, {
 *   siteId,
 *   pageId,
 *   type: 'hero',
 *   config: JSON.stringify(config),
 *   sortOrder: 0
 * });
 * ```
 *
 * ### Complex Operations
 * ```typescript
 * import { getBlocksByPageId, reorderBlocks } from '@/lib/db/queries';
 *
 * // Fetch multiple
 * const blocks = await getBlocksByPageId(env.DB, pageId);
 *
 * // Batch update
 * await reorderBlocks(env.DB, [
 *   { id: 'block-1', sortOrder: 0 },
 *   { id: 'block-2', sortOrder: 1 },
 * ]);
 * ```
 *
 * ## Adding New Queries
 *
 * 1. Define input/output types (if not already defined)
 * 2. Add query function with JSDoc
 * 3. Export from this module
 * 4. Update API routes to use query function
 * 5. Test thoroughly
 *
 * ## Database Schema
 *
 * Primary tables:
 * - `site` - Site configuration
 * - `page` - Pages within sites
 * - `block` - Content blocks (tiles)
 * - `contact` - Guest list
 * - `media_item` - Uploaded media
 * - `site_setting` - Site-specific settings
 * - `site_invite` - Collaboration invites
 * - `site_template` - Saved templates
 * - `block_translation` - i18n translations
 * - `page_view` - Analytics data
 *
 * ## Refactor Status
 *
 * - [ ] Block queries (priority 1)
 * - [ ] Page queries
 * - [ ] Site queries
 * - [ ] Contact/Guest queries
 * - [ ] Media queries
 * - [ ] Site setting queries
 * - [ ] Site invite queries
 * - [ ] Template queries
 * - [ ] Translation queries
 * - [ ] Analytics queries
 *
 * @module db/queries
 */

import { DatabaseError, NotFoundError } from '../errors';

// =============================================================================
// TYPE DEFINITIONS
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
  sortOrder?: number;
  isVisible?: number;
}

export interface Block {
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

export interface CreatePageInput {
  id?: string;
  siteId: string;
  slug: string;
  title: string;
  sortOrder?: number;
}

export interface UpdatePageInput {
  slug?: string;
  title?: string;
  sortOrder?: number;
  isPublished?: number;
}

export interface Page {
  id: string;
  siteId: string;
  slug: string;
  title: string;
  sortOrder: number;
  isPublished: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreateSiteInput {
  id?: string;
  userId: string;
  site_type: string;
  slug?: string;
  title?: string;
}

export interface UpdateSiteInput {
  site_type?: string;
  slug?: string;
  title?: string;
}

export interface Site {
  id: string;
  userId: string;
  site_type: string;
  slug: string | null;
  title: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreateContactInput {
  id?: string;
  site_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  contact_type?: string;
  tags?: string | null;
  status?: string;
  metadata?: string | Record<string, unknown>;
}

export interface UpdateContactInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  contact_type?: string;
  tags?: string | null;
  status?: string;
  metadata?: string | Record<string, unknown>;
}

export interface ContactRow {
  id: string;
  site_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contact_type: string;
  tags: string | null;
  status: string;
  metadata: string | Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

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

// =============================================================================
// PAGE QUERIES
// =============================================================================

/**
 * Get a page by ID
 *
 * @param db - D1 database instance
 * @param id - Page ID
 * @returns Page or null if not found
 */
export async function getPageById(
  db: D1Database,
  id: string
): Promise<Page | null> {
  return db.prepare("SELECT * FROM page WHERE id = ?").bind(id).first<Page>();
}

/**
 * Get all pages for a site
 *
 * @param db - D1 database instance
 * @param siteId - Site ID
 * @returns Array of pages
 */
export async function getPagesBySiteId(
  db: D1Database,
  siteId: string
): Promise<Page[]> {
  const result = await db
    .prepare("SELECT * FROM page WHERE siteId = ? ORDER BY sortOrder ASC")
    .bind(siteId)
    .all<Page>();

  return result.results || [];
}

/**
 * Create a new page
 *
 * @param db - D1 database instance
 * @param data - Page data
 * @returns Created page
 */
export async function createPage(
  db: D1Database,
  data: CreatePageInput
): Promise<Page> {
  const id = data.id || crypto.randomUUID();
  const now = Date.now();
  const sortOrder = data.sortOrder ?? 0;

  const page = await db
    .prepare(
      "INSERT INTO page (id, siteId, slug, title, sortOrder, isPublished, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, ?, ?) RETURNING *"
    )
    .bind(id, data.siteId, data.slug, data.title, sortOrder, now, now)
    .first<Page>();

  if (!page) {
    throw new DatabaseError("Failed to create page", {
      operation: 'INSERT',
      table: 'page',
      siteId: data.siteId,
    });
  }

  return page;
}

/**
 * Update a page
 *
 * @param db - D1 database instance
 * @param id - Page ID
 * @param data - Partial page data
 * @returns Updated page
 */
export async function updatePage(
  db: D1Database,
  id: string,
  data: UpdatePageInput
): Promise<Page> {
  const now = Date.now();
  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (data.slug !== undefined) {
    updates.push("slug = ?");
    bindings.push(data.slug);
  }
  if (data.title !== undefined) {
    updates.push("title = ?");
    bindings.push(data.title);
  }
  if (data.sortOrder !== undefined) {
    updates.push("sortOrder = ?");
    bindings.push(data.sortOrder);
  }
  if (data.isPublished !== undefined) {
    updates.push("isPublished = ?");
    bindings.push(data.isPublished);
  }

  updates.push("updatedAt = ?");
  bindings.push(now);

  bindings.push(id);

  const page = await db
    .prepare(`UPDATE page SET ${updates.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...bindings)
    .first<Page>();

  if (!page) {
    throw new NotFoundError("Page not found", { pageId: id });
  }

  return page;
}

/**
 * Delete a page
 *
 * @param db - D1 database instance
 * @param id - Page ID
 */
export async function deletePage(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM page WHERE id = ?").bind(id).run();
}

// =============================================================================
// SITE QUERIES
// =============================================================================

/**
 * Get a site by ID
 *
 * @param db - D1 database instance
 * @param id - Site ID
 * @returns Site or null if not found
 */
export async function getSiteById(
  db: D1Database,
  id: string
): Promise<Site | null> {
  return db.prepare("SELECT * FROM site WHERE id = ?").bind(id).first<Site>();
}

/**
 * Check if a user owns a site
 *
 * @param db - D1 database instance
 * @param siteId - Site ID
 * @param userId - User ID
 * @returns true if user owns site
 */
export async function checkSiteOwnership(
  db: D1Database,
  siteId: string,
  userId: string
): Promise<boolean> {
  const site = await db
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, userId)
    .first<{ id: string }>();

  return !!site;
}

/**
 * Get all sites for a user
 *
 * @param db - D1 database instance
 * @param userId - User ID
 * @returns Array of sites
 */
export async function getSitesByUserId(
  db: D1Database,
  userId: string
): Promise<Site[]> {
  const result = await db
    .prepare("SELECT * FROM site WHERE userId = ? ORDER BY createdAt DESC")
    .bind(userId)
    .all<Site>();

  return result.results || [];
}

/**
 * Create a new site
 *
 * @param db - D1 database instance
 * @param data - Site data
 * @returns Created site
 */
export async function createSite(
  db: D1Database,
  data: CreateSiteInput
): Promise<Site> {
  const id = data.id || crypto.randomUUID();
  const now = Date.now();

  const site = await db
    .prepare(
      "INSERT INTO site (id, userId, site_type, slug, title, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *"
    )
    .bind(id, data.userId, data.site_type, data.slug || null, data.title || null, now, now)
    .first<Site>();

  if (!site) {
    throw new DatabaseError("Failed to create site", {
      operation: 'INSERT',
      table: 'site',
      userId: data.userId,
    });
  }

  return site;
}

/**
 * Update a site
 *
 * @param db - D1 database instance
 * @param id - Site ID
 * @param data - Partial site data
 * @returns Updated site
 */
export async function updateSite(
  db: D1Database,
  id: string,
  data: UpdateSiteInput
): Promise<Site> {
  const now = Date.now();
  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (data.site_type !== undefined) {
    updates.push("site_type = ?");
    bindings.push(data.site_type);
  }
  if (data.slug !== undefined) {
    updates.push("slug = ?");
    bindings.push(data.slug);
  }
  if (data.title !== undefined) {
    updates.push("title = ?");
    bindings.push(data.title);
  }

  updates.push("updatedAt = ?");
  bindings.push(now);

  bindings.push(id);

  const site = await db
    .prepare(`UPDATE site SET ${updates.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...bindings)
    .first<Site>();

  if (!site) {
    throw new NotFoundError("Site not found", { siteId: id });
  }

  return site;
}

// =============================================================================
// CONTACT/GUEST QUERIES
// =============================================================================

/**
 * Get a contact by ID
 *
 * @param db - D1 database instance
 * @param id - Contact ID
 * @returns Contact or null if not found
 */
export async function getContactById(
  db: D1Database,
  id: string
): Promise<ContactRow | null> {
  return db
    .prepare("SELECT * FROM contact WHERE id = ?")
    .bind(id)
    .first<ContactRow>();
}

/**
 * Get all contacts for a site
 *
 * @param db - D1 database instance
 * @param siteId - Site ID
 * @returns Array of contacts
 */
export async function getContactsBySiteId(
  db: D1Database,
  siteId: string
): Promise<ContactRow[]> {
  const result = await db
    .prepare("SELECT * FROM contact WHERE site_id = ? ORDER BY created_at DESC")
    .bind(siteId)
    .all<ContactRow>();

  return result.results || [];
}

/**
 * Create a new contact
 *
 * @param db - D1 database instance
 * @param data - Contact data
 * @returns Created contact
 */
export async function createContact(
  db: D1Database,
  data: CreateContactInput
): Promise<ContactRow> {
  const id = data.id || crypto.randomUUID();
  const now = new Date().toISOString();

  const metadataStr = typeof data.metadata === 'string'
    ? data.metadata
    : JSON.stringify(data.metadata || {});

  const contact = await db
    .prepare(
      "INSERT INTO contact (id, site_id, name, email, phone, contact_type, tags, status, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
    )
    .bind(
      id,
      data.site_id,
      data.name,
      data.email || null,
      data.phone || null,
      data.contact_type || 'guest',
      data.tags || null,
      data.status || 'active',
      metadataStr,
      now,
      now
    )
    .first<ContactRow>();

  if (!contact) {
    throw new DatabaseError("Failed to create contact", {
      operation: 'INSERT',
      table: 'contact',
      site_id: data.site_id,
    });
  }

  return contact;
}

/**
 * Update a contact
 *
 * @param db - D1 database instance
 * @param id - Contact ID
 * @param data - Partial contact data
 * @returns Updated contact
 */
export async function updateContact(
  db: D1Database,
  id: string,
  data: UpdateContactInput
): Promise<ContactRow> {
  const now = new Date().toISOString();
  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    bindings.push(data.name);
  }
  if (data.email !== undefined) {
    updates.push("email = ?");
    bindings.push(data.email);
  }
  if (data.phone !== undefined) {
    updates.push("phone = ?");
    bindings.push(data.phone);
  }
  if (data.contact_type !== undefined) {
    updates.push("contact_type = ?");
    bindings.push(data.contact_type);
  }
  if (data.tags !== undefined) {
    updates.push("tags = ?");
    bindings.push(data.tags);
  }
  if (data.status !== undefined) {
    updates.push("status = ?");
    bindings.push(data.status);
  }
  if (data.metadata !== undefined) {
    updates.push("metadata = ?");
    const metadataStr = typeof data.metadata === 'string'
      ? data.metadata
      : JSON.stringify(data.metadata);
    bindings.push(metadataStr);
  }

  updates.push("updated_at = ?");
  bindings.push(now);

  bindings.push(id);

  const contact = await db
    .prepare(
      `UPDATE contact SET ${updates.join(", ")} WHERE id = ? RETURNING *`
    )
    .bind(...bindings)
    .first<ContactRow>();

  if (!contact) {
    throw new NotFoundError("Contact not found", { contactId: id });
  }

  return contact;
}

/**
 * Delete a contact
 *
 * @param db - D1 database instance
 * @param id - Contact ID
 */
export async function deleteContact(
  db: D1Database,
  id: string
): Promise<void> {
  await db.prepare("DELETE FROM contact WHERE id = ?").bind(id).run();
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
