import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { z } from "zod";
import { requireSiteOwnership, apiOwnershipError, parseJsonBody } from "@/lib/api/site-auth";
import { type ContactRow, contactToGuest } from "@/lib/api/guests";

const GuestSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  party: z.number().int().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  invitedBy: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  invited: z.number().int().min(0).max(1).optional(),
  ceremonyOrReception: z.enum(["both", "ceremony", "reception"]).optional(),
  invitationType: z.enum(["digital", "printed", "both"]).optional(),
  tableNumber: z.string().nullable().optional(),
  giftDescription: z.string().nullable().optional(),
  thankYouSent: z.number().int().min(0).max(1).optional(),
  customResponses: z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");

  const VALID_STATUSES = ["pending", "yes", "no"];
  if (statusFilter && !VALID_STATUSES.includes(statusFilter)) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "status must be pending, yes, or no" } }, { status: 400 });
  }

  let result;
  if (statusFilter) {
    result = await env.DB
      .prepare("SELECT * FROM contact WHERE site_id = ? AND contact_type = 'guest' AND json_extract(metadata, '$.rsvpStatus') = ? ORDER BY json_extract(metadata, '$.sortOrder') ASC, name ASC")
      .bind(siteId, statusFilter)
      .all();
  } else {
    result = await env.DB
      .prepare("SELECT * FROM contact WHERE site_id = ? AND contact_type = 'guest' ORDER BY json_extract(metadata, '$.sortOrder') ASC, name ASC")
      .bind(siteId)
      .all();
  }

  const guests = (result.results as unknown as ContactRow[]).map(contactToGuest);
  return NextResponse.json({ guests });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const parsed = await parseJsonBody<unknown>(req);
  if ("error" in parsed) return parsed.error;

  const result = GuestSchema.safeParse(parsed.body);
  if (!result.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: result.error.issues[0]?.message ?? "Invalid request body" } },
      { status: 400 },
    );
  }

  const { firstName, lastName, party, notes, address, phone, email, invitedBy, category, invited, ceremonyOrReception, invitationType, tableNumber, giftDescription, thankYouSent, customResponses } = result.data;

  const id = crypto.randomUUID();
  const now = Date.now();

  // Get max sortOrder from existing contacts
  const maxOrder = await env.DB
    .prepare("SELECT COALESCE(MAX(CAST(json_extract(metadata, '$.sortOrder') AS INTEGER)), -1) as maxOrder FROM contact WHERE site_id = ? AND contact_type = 'guest'")
    .bind(siteId)
    .first<{ maxOrder: number }>();

  const sortOrder = (maxOrder?.maxOrder ?? -1) + 1;

  // Build metadata JSON
  const metadata = JSON.stringify({
    rsvpStatus: 'pending',
    party: party ?? null,
    notes: notes ?? null,
    address: address ?? null,
    invitedBy: invitedBy ?? null,
    category: category ?? null,
    invited: invited ?? 0,
    ceremonyOrReception: ceremonyOrReception ?? 'both',
    invitationType: invitationType ?? 'digital',
    tableNumber: tableNumber ?? null,
    giftDescription: giftDescription ?? null,
    thankYouSent: thankYouSent ?? 0,
    customResponses: customResponses ?? null,
    sortOrder,
  });

  const name = `${firstName}${lastName ? ' ' + lastName : ''}`;

  const contact = await env.DB
    .prepare(
      "INSERT INTO contact (id, site_id, name, email, phone, contact_type, metadata, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'guest', ?, 'active', ?, ?) RETURNING *"
    )
    .bind(id, siteId, name, email ?? null, phone ?? null, metadata, now, now)
    .first();

  const guest = contactToGuest(contact as unknown as ContactRow);
  return NextResponse.json({ guest }, { status: 201 });
}
