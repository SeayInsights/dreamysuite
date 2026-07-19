import { DatabaseError, NotFoundError } from "../../errors";

// =============================================================================
// TYPE DEFINITIONS — CONTACTS / GUESTS
// =============================================================================

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
  created_at: number;
  updated_at: number;
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
  id: string,
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
  siteId: string,
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
  data: CreateContactInput,
): Promise<ContactRow> {
  const id = data.id || crypto.randomUUID();
  const now = Date.now();

  const metadataStr =
    typeof data.metadata === "string"
      ? data.metadata
      : JSON.stringify(data.metadata || {});

  const contact = await db
    .prepare(
      "INSERT INTO contact (id, site_id, name, email, phone, contact_type, tags, status, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
    )
    .bind(
      id,
      data.site_id,
      data.name,
      data.email || null,
      data.phone || null,
      data.contact_type || "guest",
      data.tags || null,
      data.status || "active",
      metadataStr,
      now,
      now,
    )
    .first<ContactRow>();

  if (!contact) {
    throw new DatabaseError("Failed to create contact", {
      operation: "INSERT",
      table: "contact",
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
  data: UpdateContactInput,
): Promise<ContactRow> {
  const now = Date.now();
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
    const metadataStr =
      typeof data.metadata === "string"
        ? data.metadata
        : JSON.stringify(data.metadata);
    bindings.push(metadataStr);
  }

  updates.push("updated_at = ?");
  bindings.push(now);

  bindings.push(id);

  const contact = await db
    .prepare(
      `UPDATE contact SET ${updates.join(", ")} WHERE id = ? RETURNING *`,
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
export async function deleteContact(db: D1Database, id: string): Promise<void> {
  await db.prepare("DELETE FROM contact WHERE id = ?").bind(id).run();
}
