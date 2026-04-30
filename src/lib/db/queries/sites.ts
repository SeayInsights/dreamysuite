import { DatabaseError, NotFoundError } from '../../errors';

// =============================================================================
// TYPE DEFINITIONS — SITES
// =============================================================================

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
