import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";

// Helper to transform contact row to legacy guest format
function contactToGuest(contact: any) {
  let metadata: any = {};
  try {
    metadata = typeof contact.metadata === 'string' ? JSON.parse(contact.metadata) : (contact.metadata || {});
  } catch (error) {
    console.error('[GUEST] Failed to parse contact metadata:', error);
    metadata = {};
  }
  const [firstName, ...lastNameParts] = (contact.name || '').split(' ');

  return {
    id: contact.id,
    siteId: contact.site_id,
    firstName: firstName || '',
    lastName: lastNameParts.join(' ') || null,
    email: contact.email || null,
    phone: contact.phone || null,
    rsvpStatus: metadata.rsvpStatus || 'pending',
    party: metadata.party ?? null,
    notes: metadata.notes || null,
    address: metadata.address || null,
    invitedBy: metadata.invitedBy || null,
    category: metadata.category || null,
    invited: metadata.invited ?? 0,
    ceremonyOrReception: metadata.ceremonyOrReception || 'both',
    invitationType: metadata.invitationType || 'digital',
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> }
) {
  const env = await getEnv();
  const { id: siteId, guestId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const contact = await env.DB
    .prepare("SELECT * FROM contact WHERE id = ? AND site_id = ? AND contact_type = 'guest'")
    .bind(guestId, siteId)
    .first();

  if (!contact) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Guest not found" } }, { status: 404 });
  }

  await env.DB
    .prepare("DELETE FROM contact WHERE id = ?")
    .bind(guestId)
    .run();

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> }
) {
  const env = await getEnv();
  const { id: siteId, guestId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const contact = await env.DB
    .prepare("SELECT * FROM contact WHERE id = ? AND site_id = ? AND contact_type = 'guest'")
    .bind(guestId, siteId)
    .first<{ id: string; site_id: string; name: string; email: string | null; phone: string | null; metadata: string; created_at: number; updated_at: number }>();

  if (!contact) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Guest not found" } }, { status: 404 });
  }

  let body: {
    firstName?: string;
    lastName?: string;
    party?: number;
    rsvpStatus?: string;
    notes?: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    invitedBy?: string | null;
    category?: string | null;
    invited?: number;
    ceremonyOrReception?: string;
    invitationType?: string;
    tableNumber?: string | null;
    giftDescription?: string | null;
    thankYouSent?: number;
    customResponses?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, { status: 400 });
  }

  const VALID_STATUSES = ["pending", "yes", "no"];
  if (body.rsvpStatus !== undefined && !VALID_STATUSES.includes(body.rsvpStatus)) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "rsvpStatus must be pending, yes, or no" } }, { status: 400 });
  }
  if (body.ceremonyOrReception !== undefined && !["both", "ceremony", "reception"].includes(body.ceremonyOrReception)) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "ceremonyOrReception must be both, ceremony, or reception" } }, { status: 400 });
  }
  if (body.invitationType !== undefined && !["digital", "printed", "both"].includes(body.invitationType)) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "invitationType must be digital, printed, or both" } }, { status: 400 });
  }

  // Parse existing metadata
  let metadata: any = {};
  try {
    metadata = typeof contact.metadata === 'string' ? JSON.parse(contact.metadata) : (contact.metadata || {});
  } catch (error) {
    console.error('[GUEST] Failed to parse contact metadata:', error);
    metadata = {};
  }
  let nameUpdated = false;
  let newName = contact.name;

  // Update metadata fields
  if (body.firstName !== undefined || body.lastName !== undefined) {
    const [currentFirstName, ...currentLastNameParts] = contact.name.split(' ');
    const firstName = body.firstName ?? currentFirstName;
    const lastName = body.lastName !== undefined ? body.lastName : currentLastNameParts.join(' ');
    newName = `${firstName}${lastName ? ' ' + lastName : ''}`;
    nameUpdated = true;
  }

  if (body.party !== undefined) metadata.party = body.party;
  if (body.notes !== undefined) metadata.notes = body.notes;
  if (body.rsvpStatus !== undefined) {
    metadata.rsvpStatus = body.rsvpStatus;
    metadata.rsvpSubmittedAt = Date.now();
  }
  if (body.address !== undefined) metadata.address = body.address;
  if (body.invitedBy !== undefined) metadata.invitedBy = body.invitedBy;
  if (body.category !== undefined) metadata.category = body.category;
  if (body.invited !== undefined) metadata.invited = body.invited;
  if (body.ceremonyOrReception !== undefined) metadata.ceremonyOrReception = body.ceremonyOrReception;
  if (body.invitationType !== undefined) metadata.invitationType = body.invitationType;
  if (body.tableNumber !== undefined) metadata.tableNumber = body.tableNumber;
  if (body.giftDescription !== undefined) metadata.giftDescription = body.giftDescription;
  if (body.thankYouSent !== undefined) metadata.thankYouSent = body.thankYouSent;
  if (body.customResponses !== undefined) metadata.customResponses = body.customResponses;

  // Build update query
  const fields: string[] = [];
  const values: unknown[] = [];

  if (nameUpdated) {
    fields.push("name = ?");
    values.push(newName);
  }
  if (body.email !== undefined) {
    fields.push("email = ?");
    values.push(body.email);
  }
  if (body.phone !== undefined) {
    fields.push("phone = ?");
    values.push(body.phone);
  }

  fields.push("metadata = ?");
  values.push(JSON.stringify(metadata));
  fields.push("updated_at = ?");
  values.push(Date.now());
  values.push(guestId);

  await env.DB
    .prepare(`UPDATE contact SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await env.DB
    .prepare("SELECT * FROM contact WHERE id = ?")
    .bind(guestId)
    .first();

  const guest = contactToGuest(updated);
  return NextResponse.json({ guest });
}
