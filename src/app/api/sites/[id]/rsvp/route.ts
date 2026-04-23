import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  // Verify site exists (prevents submissions to phantom IDs)
  const site = await env.DB
    .prepare("SELECT id FROM site WHERE id = ? AND status = 'published'")
    .bind(siteId)
    .first();
  if (!site) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Site not found" } },
      { status: 404 },
    );
  }

  let body: { firstName?: string; lastName?: string; email?: string; rsvpStatus?: string; notes?: string; customResponses?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 },
    );
  }

  const { firstName, lastName, email, rsvpStatus, notes, customResponses } = body;
  if (!firstName?.trim()) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "firstName is required" } },
      { status: 400 },
    );
  }
  if (firstName.trim().length > 100) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "firstName must be 100 characters or less" } }, { status: 400 });
  }
  if (lastName && lastName.trim().length > 100) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "lastName must be 100 characters or less" } }, { status: 400 });
  }
  if (email && email.trim().length > 254) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "email must be 254 characters or less" } }, { status: 400 });
  }

  const VALID_STATUSES = ["pending", "yes", "no"];
  const status = VALID_STATUSES.includes(rsvpStatus ?? "") ? rsvpStatus! : "pending";

  const firstNameClean = firstName.trim();
  const lastNameClean = lastName?.trim() ?? "";
  const emailClean = email?.trim() || null;
  const notesClean = notes?.trim() || null;
  const now = Date.now();

  // Upsert contact: match by email first (if provided), fallback to name
  let contactId: string;
  let existingContact: { id: string } | null = null;

  if (emailClean) {
    existingContact = await env.DB
      .prepare("SELECT id FROM contact WHERE site_id = ? AND email = ?")
      .bind(siteId, emailClean)
      .first<{ id: string }>();
  }

  if (!existingContact) {
    existingContact = await env.DB
      .prepare("SELECT id FROM contact WHERE site_id = ? AND LOWER(name) = LOWER(?)")
      .bind(siteId, `${firstNameClean} ${lastNameClean}`)
      .first<{ id: string }>();
  }

  if (existingContact) {
    // Update existing contact
    contactId = existingContact.id;
    await env.DB
      .prepare(
        "UPDATE contact SET name = ?, email = ?, metadata = ?, updated_at = ? WHERE id = ?"
      )
      .bind(
        `${firstNameClean} ${lastNameClean}`,
        emailClean,
        JSON.stringify({
          rsvpStatus: status === "yes" ? "attending" : status === "no" ? "not-attending" : "pending",
          customResponses: customResponses ?? {},
          notes: notesClean
        }),
        now,
        contactId
      )
      .run();
  } else {
    // Create new contact
    contactId = crypto.randomUUID();
    await env.DB
      .prepare(
        "INSERT INTO contact (id, site_id, name, email, contact_type, metadata, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        contactId,
        siteId,
        `${firstNameClean} ${lastNameClean}`,
        emailClean,
        'guest',
        JSON.stringify({
          rsvpStatus: status === "yes" ? "attending" : status === "no" ? "not-attending" : "pending",
          customResponses: customResponses ?? {},
          notes: notesClean
        }),
        'active',
        now,
        now
      )
      .run();
  }

  // Create submission record
  const submissionId = crypto.randomUUID();
  await env.DB
    .prepare(
      "INSERT INTO submission (id, site_id, contact_id, submission_type, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      submissionId,
      siteId,
      contactId,
      'rsvp',
      JSON.stringify({
        attending: status === "yes",
        firstName: firstNameClean,
        lastName: lastNameClean,
        notes: notesClean,
        customResponses: customResponses ?? {}
      }),
      now,
      now
    )
    .run();

  return NextResponse.json({ success: true }, { status: 201 });
}
