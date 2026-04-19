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

export async function PUT(
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
    party?: string;
    rsvpStatus?: string;
    notes?: string;
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
