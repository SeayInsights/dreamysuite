import { z } from "zod";

/**
 * Contact metadata schemas with discriminated unions for type-specific fields.
 * Each contact_type (guest, lead, donor, attendee) has its own metadata shape.
 */

// Guest metadata: RSVP and party size
export const GuestMetadataSchema = z.object({
  type: z.literal("guest"),
  plusOne: z.boolean().nullable().default(null),
  dietaryRestrictions: z.string().nullable().default(null),
  songRequest: z.string().nullable().default(null),
  partySize: z.number().nullable().default(null),
});

// Lead metadata: source and qualification
export const LeadMetadataSchema = z.object({
  type: z.literal("lead"),
  source: z.string().nullable().default(null),
  leadQuality: z.enum(["hot", "warm", "cold"]).nullable().default(null),
  lastContactDate: z.string().nullable().default(null),
});

// Donor metadata: donation history and preferences
export const DonorMetadataSchema = z.object({
  type: z.literal("donor"),
  totalDonated: z.number().nullable().default(null),
  donationFrequency: z.string().nullable().default(null),
  preferredCause: z.string().nullable().default(null),
  anonymousDonation: z.boolean().nullable().default(null),
});

// Attendee metadata: event attendance and engagement
export const AttendeeMetadataSchema = z.object({
  type: z.literal("attendee"),
  eventRsvpStatus: z.enum(["yes", "no", "maybe"]).nullable().default(null),
  ticketNumber: z.string().nullable().default(null),
  checkInTime: z.number().nullable().default(null),
});

// Discriminated union of all contact metadata types
export const ContactMetadataSchema = z.discriminatedUnion("type", [
  GuestMetadataSchema,
  LeadMetadataSchema,
  DonorMetadataSchema,
  AttendeeMetadataSchema,
]);

// Full contact schema
export const ContactSchema = z.object({
  id: z.string(),
  siteId: z.string(),
  name: z.string().nullable().default(null),
  email: z.string().email().nullable().default(null),
  phone: z.string().nullable().default(null),
  contactType: z.enum(["guest", "lead", "donor", "attendee"]),
  metadata: ContactMetadataSchema,
  tags: z.array(z.string()).nullable().default(null),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
  createdAt: z.number().nullable().default(null),
  updatedAt: z.number().nullable().default(null),
});

export type Contact = z.infer<typeof ContactSchema>;
export type GuestMetadata = z.infer<typeof GuestMetadataSchema>;
export type LeadMetadata = z.infer<typeof LeadMetadataSchema>;
export type DonorMetadata = z.infer<typeof DonorMetadataSchema>;
export type AttendeeMetadata = z.infer<typeof AttendeeMetadataSchema>;
export type ContactMetadata = z.infer<typeof ContactMetadataSchema>;

/**
 * Parse and validate contact metadata from raw JSON.
 * Returns the validated metadata object or throws a ZodError.
 *
 * @param contactType - The contact_type value from the database
 * @param json - The raw metadata JSON string or object
 * @returns Validated ContactMetadata
 */
export function parseContactMetadata(
  contactType: string,
  json: unknown,
): ContactMetadata {
  const parsed = typeof json === "string" ? JSON.parse(json) : json;
  return ContactMetadataSchema.parse({
    type: contactType,
    ...parsed,
  });
}

/**
 * Partial contact schema for PATCH-like updates.
 */
export const ContactPatchSchema = ContactSchema.partial();
export type ContactPatch = z.infer<typeof ContactPatchSchema>;
