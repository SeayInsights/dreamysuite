import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.guests";
import "~/lib/context";

async function requireSiteOwnership(
  request: Request,
  context: Route.LoaderArgs["context"],
  siteId: string
) {
  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return { error: { code: "UNAUTHORIZED", message: "Not authenticated" }, status: 401 as const };
  }
  const site = await context.cloudflare.env.DB
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string }>();
  if (!site) {
    return { error: { code: "FORBIDDEN", message: "Site not found or access denied" }, status: 403 as const };
  }
  return { userId: session.user.id };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const siteId = params.id;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");

  const VALID_STATUSES = ["pending", "yes", "no"];
  if (statusFilter && !VALID_STATUSES.includes(statusFilter)) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "status must be pending, yes, or no" } }, 400);
  }

  let result;
  if (statusFilter) {
    result = await context.cloudflare.env.DB
      .prepare("SELECT * FROM guest WHERE siteId = ? AND rsvpStatus = ? ORDER BY sortOrder ASC, lastName ASC")
      .bind(siteId, statusFilter)
      .all();
  } else {
    result = await context.cloudflare.env.DB
      .prepare("SELECT * FROM guest WHERE siteId = ? ORDER BY sortOrder ASC, lastName ASC")
      .bind(siteId)
      .all();
  }

  return jsonResponse({ guests: result.results });
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const siteId = params.id;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  if (request.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
  }

  let body: { firstName?: string; lastName?: string; party?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, 400);
  }

  const { firstName, lastName, party, notes } = body;
  if (!firstName) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "firstName is required" } }, 400);
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  const maxOrder = await context.cloudflare.env.DB
    .prepare("SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM guest WHERE siteId = ?")
    .bind(siteId)
    .first<{ maxOrder: number }>();

  const sortOrder = (maxOrder?.maxOrder ?? -1) + 1;

  await context.cloudflare.env.DB
    .prepare(
      "INSERT INTO guest (id, siteId, firstName, lastName, party, rsvpStatus, notes, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)"
    )
    .bind(id, siteId, firstName, lastName ?? null, party ?? null, notes ?? null, sortOrder, now, now)
    .run();

  const guest = await context.cloudflare.env.DB
    .prepare("SELECT * FROM guest WHERE id = ?")
    .bind(id)
    .first();

  return jsonResponse({ guest }, 201);
}
