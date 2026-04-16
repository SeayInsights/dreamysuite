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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return NextResponse.json(check, { status: check.status });

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");

  const VALID_STATUSES = ["pending", "yes", "no"];
  if (statusFilter && !VALID_STATUSES.includes(statusFilter)) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "status must be pending, yes, or no" } }, { status: 400 });
  }

  let result;
  if (statusFilter) {
    result = await env.DB
      .prepare("SELECT * FROM guest WHERE siteId = ? AND rsvpStatus = ? ORDER BY sortOrder ASC, lastName ASC")
      .bind(siteId, statusFilter)
      .all();
  } else {
    result = await env.DB
      .prepare("SELECT * FROM guest WHERE siteId = ? ORDER BY sortOrder ASC, lastName ASC")
      .bind(siteId)
      .all();
  }

  return NextResponse.json({ guests: result.results });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return NextResponse.json(check, { status: check.status });

  let body: { firstName?: string; lastName?: string; party?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, { status: 400 });
  }

  const { firstName, lastName, party, notes } = body;
  if (!firstName) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "firstName is required" } }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  const maxOrder = await env.DB
    .prepare("SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM guest WHERE siteId = ?")
    .bind(siteId)
    .first<{ maxOrder: number }>();

  const sortOrder = (maxOrder?.maxOrder ?? -1) + 1;

  await env.DB
    .prepare(
      "INSERT INTO guest (id, siteId, firstName, lastName, party, rsvpStatus, notes, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)"
    )
    .bind(id, siteId, firstName, lastName ?? null, party ?? null, notes ?? null, sortOrder, now, now)
    .run();

  const guest = await env.DB
    .prepare("SELECT * FROM guest WHERE id = ?")
    .bind(id)
    .first();

  return NextResponse.json({ guest }, { status: 201 });
}
