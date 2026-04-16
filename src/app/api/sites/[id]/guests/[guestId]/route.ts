import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth, type Env } from "@/app/lib/auth.server";

async function requireSiteOwnership(
  req: NextRequest,
  env: Env,
  siteId: string
) {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return { error: { code: "UNAUTHORIZED", message: "Not authenticated" }, status: 401 as const };
  }
  const _db = env.DB;
  const site = await _db
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string }>();
  if (site) return { userId: session.user.id };
  const invite = await _db
    .prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
    .bind(siteId, session.user.email.toLowerCase())
    .first<{ id: string }>();
  if (invite) return { userId: session.user.id };
  return { error: { code: "FORBIDDEN", message: "Site not found or access denied" }, status: 403 as const };
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId, guestId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return NextResponse.json(check, { status: check.status });

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
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId, guestId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return NextResponse.json(check, { status: check.status });

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
