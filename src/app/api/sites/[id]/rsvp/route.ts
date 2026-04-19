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

  let body: { firstName?: string; lastName?: string; email?: string; rsvpStatus?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 },
    );
  }

  const { firstName, lastName, email, rsvpStatus } = body;
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

  const id = crypto.randomUUID();
  const now = Date.now();

  const maxOrder = await env.DB
    .prepare("SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM guest WHERE siteId = ?")
    .bind(siteId)
    .first<{ maxOrder: number }>();

  const sortOrder = (maxOrder?.maxOrder ?? -1) + 1;

  await env.DB
    .prepare(
      "INSERT INTO guest (id, siteId, firstName, lastName, email, rsvpStatus, rsvpSubmittedAt, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id, siteId,
      firstName.trim(),
      lastName?.trim() ?? null,
      email?.trim() ?? null,
      status,
      now, sortOrder, now, now,
    )
    .run();

  return NextResponse.json({ success: true }, { status: 201 });
}
