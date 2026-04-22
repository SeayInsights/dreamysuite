import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> }
) {
  const env = await getEnv();
  const { id: siteId, guestId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const guest = await env.DB
    .prepare("SELECT * FROM guest WHERE id = ? AND siteId = ?")
    .bind(guestId, siteId)
    .first();

  if (!guest) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Guest not found" } }, { status: 404 });
  }

  await env.DB
    .prepare("DELETE FROM guest WHERE id = ?")
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

  const guest = await env.DB
    .prepare("SELECT * FROM guest WHERE id = ? AND siteId = ?")
    .bind(guestId, siteId)
    .first();

  if (!guest) {
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

  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.firstName !== undefined) { fields.push("firstName = ?"); values.push(body.firstName); }
  if (body.lastName !== undefined) { fields.push("lastName = ?"); values.push(body.lastName); }
  if (body.party !== undefined) { fields.push("party = ?"); values.push(body.party); }
  if (body.notes !== undefined) { fields.push("notes = ?"); values.push(body.notes); }
  if (body.rsvpStatus !== undefined) {
    fields.push("rsvpStatus = ?");
    values.push(body.rsvpStatus);
    fields.push("rsvpSubmittedAt = ?");
    values.push(Date.now());
  }
  if (body.address !== undefined) { fields.push("address = ?"); values.push(body.address); }
  if (body.phone !== undefined) { fields.push("phone = ?"); values.push(body.phone); }
  if (body.email !== undefined) { fields.push("email = ?"); values.push(body.email); }
  if (body.invitedBy !== undefined) { fields.push("invitedBy = ?"); values.push(body.invitedBy); }
  if (body.category !== undefined) { fields.push("category = ?"); values.push(body.category); }
  if (body.invited !== undefined) { fields.push("invited = ?"); values.push(body.invited); }
  if (body.ceremonyOrReception !== undefined) { fields.push("ceremonyOrReception = ?"); values.push(body.ceremonyOrReception); }
  if (body.invitationType !== undefined) { fields.push("invitationType = ?"); values.push(body.invitationType); }
  if (body.tableNumber !== undefined) { fields.push("tableNumber = ?"); values.push(body.tableNumber); }
  if (body.giftDescription !== undefined) { fields.push("giftDescription = ?"); values.push(body.giftDescription); }
  if (body.thankYouSent !== undefined) { fields.push("thankYouSent = ?"); values.push(body.thankYouSent); }
  if (body.customResponses !== undefined) { fields.push("customResponses = ?"); values.push(body.customResponses); }

  if (fields.length === 0) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "No fields to update" } }, { status: 400 });
  }

  fields.push("updatedAt = ?");
  values.push(Date.now());
  values.push(guestId);

  await env.DB
    .prepare(`UPDATE guest SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await env.DB
    .prepare("SELECT * FROM guest WHERE id = ?")
    .bind(guestId)
    .first();

  return NextResponse.json({ guest: updated });
}
