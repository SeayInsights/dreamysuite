import { z } from "zod";

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
  const parsed = typeof json === "string" ? JSON.parse(json) : json;
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
