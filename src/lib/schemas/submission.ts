import { z } from "zod";
import { safeJsonParse } from "@/lib/validation";

/**
 * Submission data schemas with discriminated unions for type-specific fields.
 * Each submission_type has its own data shape for polymorphic form submissions.
 */

// RSVP submission: attendance confirmation
export const RsvpSubmissionSchema = z.object({
  type: z.literal("rsvp"),
  guestName: z.string().nullable().default(null),
  rsvpStatus: z.enum(["yes", "no", "maybe"]).nullable().default(null),
  partySize: z.number().nullable().default(null),
  dietaryRestrictions: z.string().nullable().default(null),
});

// Guestbook submission: message and sentiment
export const GuestbookSubmissionSchema = z.object({
  type: z.literal("guestbook"),
  message: z.string().nullable().default(null),
  sentimentScore: z.number().nullable().default(null),
  photoUrl: z.string().nullable().default(null),
});

// Donation submission: amount and campaign
export const DonationSubmissionSchema = z.object({
  type: z.literal("donation"),
  amountCents: z.number().nullable().default(null),
  donorName: z.string().nullable().default(null),
  donationMessage: z.string().nullable().default(null),
  campaignId: z.string().nullable().default(null),
  isAnonymous: z.boolean().nullable().default(null),
});

// Registration submission: event signup
export const RegistrationSubmissionSchema = z.object({
  type: z.literal("registration"),
  registrantName: z.string().nullable().default(null),
  registrantEmail: z.string().email().nullable().default(null),
  registrationData: z.string().nullable().default(null),
});

// Lead form submission: contact and interest
export const LeadFormSubmissionSchema = z.object({
  type: z.literal("lead-form"),
  leadName: z.string().nullable().default(null),
  leadEmail: z.string().email().nullable().default(null),
  leadPhone: z.string().nullable().default(null),
  message: z.string().nullable().default(null),
  source: z.string().nullable().default(null),
});

// Generic contact form submission
export const ContactFormSubmissionSchema = z.object({
  type: z.literal("contact-form"),
  senderName: z.string().nullable().default(null),
  senderEmail: z.string().email().nullable().default(null),
  subject: z.string().nullable().default(null),
  message: z.string().nullable().default(null),
});

// Discriminated union of all submission data types
export const SubmissionDataSchema = z.discriminatedUnion("type", [
  RsvpSubmissionSchema,
  GuestbookSubmissionSchema,
  DonationSubmissionSchema,
  RegistrationSubmissionSchema,
  LeadFormSubmissionSchema,
  ContactFormSubmissionSchema,
]);

// Full submission schema
export const SubmissionSchema = z.object({
  id: z.string(),
  siteId: z.string(),
  blockId: z.string().nullable().default(null),
  contactId: z.string().nullable().default(null),
  submissionType: z.enum([
    "rsvp",
    "guestbook",
    "donation",
    "registration",
    "lead-form",
    "contact-form",
  ]),
  data: SubmissionDataSchema,
  status: z
    .enum(["pending", "new", "read", "archived"])
    .default("pending"),
  amountCents: z.number().nullable().default(null),
  createdAt: z.number().nullable().default(null),
  updatedAt: z.number().nullable().default(null),
});

export type Submission = z.infer<typeof SubmissionSchema>;
export type RsvpSubmission = z.infer<typeof RsvpSubmissionSchema>;
export type GuestbookSubmission = z.infer<typeof GuestbookSubmissionSchema>;
export type DonationSubmission = z.infer<typeof DonationSubmissionSchema>;
export type RegistrationSubmission = z.infer<typeof RegistrationSubmissionSchema>;
export type LeadFormSubmission = z.infer<typeof LeadFormSubmissionSchema>;
export type ContactFormSubmission = z.infer<typeof ContactFormSubmissionSchema>;
export type SubmissionData = z.infer<typeof SubmissionDataSchema>;

/**
 * Parse and validate submission data from raw JSON.
 * Returns the validated data object or throws a ZodError.
 *
 * @param submissionType - The submission_type value from the database
 * @param json - The raw submission data JSON string or object
 * @returns Validated SubmissionData
 */
export function parseSubmissionData(
  submissionType: string,
  json: unknown,
): SubmissionData {
  const parsed: Record<string, unknown> = typeof json === "string" ? safeJsonParse<Record<string, unknown>>(json, {}) : (json as Record<string, unknown>);
  return SubmissionDataSchema.parse({
    type: submissionType,
    ...parsed,
  });
}

/**
 * Partial submission schema for PATCH-like updates.
 * Used for updating individual fields without requiring all fields.
 */
export const SubmissionPatchSchema = SubmissionSchema.partial();
export type SubmissionPatch = z.infer<typeof SubmissionPatchSchema>;
