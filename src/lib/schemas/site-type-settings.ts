import { z } from "zod";
import { safeJsonParse } from "@/lib/validation";

/**
 * Site type settings schemas with discriminated unions for type-specific configurations.
 * Each site_type (wedding, insurance_agent, nonprofit, etc.) has its own settings shape.
 */

// Wedding settings: event details, styling, and features
export const WeddingSettingsSchema = z.object({
  siteType: z.literal("wedding"),
  eventName: z.string().nullable().default(null),
  eventDate: z.string().nullable().default(null),
  eventLocation: z.string().nullable().default(null),
  greeting: z.string().nullable().default(null),
  musicUrl: z.string().nullable().default(null),
  songPages: z.string().nullable().default(null),
  songResetPages: z.string().nullable().default(null),
  sealInitials: z.string().nullable().default(null),
  cardColor: z.string().nullable().default(null),
  cardImage: z.string().nullable().default(null),
  envelopeColor: z.string().nullable().default(null),
});

// Insurance agent settings: stub for future expansion
export const InsuranceAgentSettingsSchema = z.object({
  siteType: z.literal("insurance_agent"),
  agencyName: z.string().nullable().default(null),
  licenseNumber: z.string().nullable().default(null),
});

// Nonprofit settings: stub for future expansion
export const NonprofitSettingsSchema = z.object({
  siteType: z.literal("nonprofit"),
  organizationName: z.string().nullable().default(null),
  ein: z.string().nullable().default(null),
});

// Discriminated union of all site type settings
export const TypeSettingsSchema = z.discriminatedUnion("siteType", [
  WeddingSettingsSchema,
  InsuranceAgentSettingsSchema,
  NonprofitSettingsSchema,
]);

// Full site_type_settings schema
export const SiteTypeSettingsSchema = z.object({
  siteId: z.string(),
  siteType: z.string(),
  settings: TypeSettingsSchema,
  createdAt: z.number().nullable().default(null),
  updatedAt: z.number().nullable().default(null),
});

export type SiteTypeSettings = z.infer<typeof SiteTypeSettingsSchema>;
export type WeddingSettings = z.infer<typeof WeddingSettingsSchema>;
export type InsuranceAgentSettings = z.infer<typeof InsuranceAgentSettingsSchema>;
export type NonprofitSettings = z.infer<typeof NonprofitSettingsSchema>;
export type TypeSettings = z.infer<typeof TypeSettingsSchema>;

/**
 * Parse and validate site type settings from raw JSON.
 * Returns the validated settings object or throws a ZodError.
 *
 * @param siteType - The site_type value from the database
 * @param json - The raw settings JSON string or object
 * @returns Validated TypeSettings
 */
export function parseTypeSettings(
  siteType: string,
  json: unknown,
): TypeSettings {
  const parsed: Record<string, unknown> = typeof json === "string" ? safeJsonParse<Record<string, unknown>>(json, {}) : (json as Record<string, unknown>);
  return TypeSettingsSchema.parse({
    siteType,
    ...parsed,
  });
}

/**
 * Partial site type settings schema for PATCH-like updates.
 */
export const SiteTypeSettingsPatchSchema = SiteTypeSettingsSchema.partial();
export type SiteTypeSettingsPatch = z.infer<typeof SiteTypeSettingsPatchSchema>;

/**
 * Get site type settings from database.
 * Returns null if no row exists.
 */
export async function getSiteTypeSettings(
  db: D1Database,
  siteId: string,
): Promise<SiteTypeSettings | null> {
  const row = await db
    .prepare("SELECT site_id, site_type, settings, created_at, updated_at FROM site_type_settings WHERE site_id = ?")
    .bind(siteId)
    .first<{
      site_id: string;
      site_type: string;
      settings: string;
      created_at: number | null;
      updated_at: number | null;
    }>();

  if (!row) return null;

  const settingsJson = typeof row.settings === "string" ? safeJsonParse<Record<string, unknown>>(row.settings, {}) : row.settings;
  const validated = TypeSettingsSchema.parse({
    siteType: row.site_type,
    ...settingsJson,
  });

  return {
    siteId: row.site_id,
    siteType: row.site_type,
    settings: validated,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Upsert site type settings for a given site.
 * If no row exists, INSERTs with defaults for the site type.
 * If row exists, UPDATEs only the fields present in patch.
 */
export async function upsertSiteTypeSettings(
  db: D1Database,
  siteId: string,
  siteType: string,
  patch: Partial<TypeSettings>,
  now: number = Date.now(),
): Promise<void> {
  const existing = await db
    .prepare("SELECT site_id FROM site_type_settings WHERE site_id = ?")
    .bind(siteId)
    .first<{ site_id: string }>();

  if (!existing) {
    // Create new row with defaults merged with patch
    const defaults = getTypeDefaults(siteType);
    const merged = { ...defaults, ...patch, siteType };
    const settingsJson = JSON.stringify(merged);

    await db
      .prepare(
        "INSERT INTO site_type_settings (site_id, site_type, settings, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(siteId, siteType, settingsJson, now, now)
      .run();
    return;
  }

  // Update existing row - merge patch with existing settings
  const current = await getSiteTypeSettings(db, siteId);
  if (!current) return; // Should not happen, but type safety

  const merged = { ...current.settings, ...patch };
  const settingsJson = JSON.stringify(merged);

  await db
    .prepare("UPDATE site_type_settings SET settings = ?, updated_at = ? WHERE site_id = ?")
    .bind(settingsJson, now, siteId)
    .run();
}

/**
 * Get default settings for a site type.
 */
function getTypeDefaults(siteType: string): TypeSettings {
  switch (siteType) {
    case "wedding":
      return WeddingSettingsSchema.parse({ siteType: "wedding" });
    case "insurance_agent":
      return InsuranceAgentSettingsSchema.parse({ siteType: "insurance_agent" });
    case "nonprofit":
      return NonprofitSettingsSchema.parse({ siteType: "nonprofit" });
    default:
      throw new Error(`Unknown site type: ${siteType}`);
  }
}
