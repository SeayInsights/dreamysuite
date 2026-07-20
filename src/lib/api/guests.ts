import { safeJsonParse } from "@/lib/validation";

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

export function contactToGuest(contact: ContactRow) {
  const metadata: Record<string, unknown> =
    typeof contact.metadata === "string"
      ? safeJsonParse(contact.metadata, {})
      : (contact.metadata as Record<string, unknown>) || {};
  const [firstName, ...lastNameParts] = (contact.name || "").split(" ");

  return {
    id: contact.id,
    siteId: contact.site_id,
    firstName: firstName || "",
    lastName: lastNameParts.join(" ") || null,
    email: contact.email || null,
    phone: contact.phone || null,
    rsvpStatus: metadata.rsvpStatus || "pending",
    party: metadata.party ?? null,
    notes: metadata.notes || null,
    address: metadata.address || null,
    invitedBy: metadata.invitedBy || null,
    category: metadata.category || null,
    invited: metadata.invited ?? 0,
    ceremonyOrReception: metadata.ceremonyOrReception || "both",
    invitationType: metadata.invitationType || "digital",
    tableNumber: metadata.tableNumber || null,
    giftDescription: metadata.giftDescription || null,
    thankYouSent: metadata.thankYouSent ?? 0,
    customResponses: metadata.customResponses || null,
    sortOrder: metadata.sortOrder ?? 0,
    rsvpSubmittedAt: metadata.rsvpSubmittedAt || null,
    createdAt: contact.created_at,
    updatedAt: contact.updated_at,
  };
}
