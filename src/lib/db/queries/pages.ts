import { DatabaseError, NotFoundError } from '../../errors';

// =============================================================================
// TYPE DEFINITIONS — PAGES
// =============================================================================

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
