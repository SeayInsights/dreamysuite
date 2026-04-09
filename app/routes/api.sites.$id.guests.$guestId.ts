import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.guests.$guestId";
import "~/lib/context";

async function requireSiteOwnership(
  request: Request,
  context: Route.ActionArgs["context"],
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

export async function action({ request, context, params }: Route.ActionArgs) {
  const { id: siteId, guestId } = params;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  const guest = await context.cloudflare.env.DB
    .prepare("SELECT * FROM guest WHERE id = ? AND siteId = ?")
    .bind(guestId, siteId)
    .first();

  if (!guest) {
    return jsonResponse({ error: { code: "NOT_FOUND", message: "Guest not found" } }, 404);
  }

  if (request.method === "DELETE") {
    await context.cloudflare.env.DB
      .prepare("DELETE FROM guest WHERE id = ?")
      .bind(guestId)
      .run();
    return jsonResponse({ success: true });
  }

  if (request.method === "PUT") {
    let body: {
      firstName?: string;
      lastName?: string;
      party?: string;
      rsvpStatus?: string;
      notes?: string;
    };
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, 400);
    }

    const VALID_STATUSES = ["pending", "yes", "no"];
    if (body.rsvpStatus !== undefined && !VALID_STATUSES.includes(body.rsvpStatus)) {
      return jsonResponse({ error: { code: "BAD_REQUEST", message: "rsvpStatus must be pending, yes, or no" } }, 400);
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
      return jsonResponse({ error: { code: "BAD_REQUEST", message: "No fields to update" } }, 400);
    }

    fields.push("updatedAt = ?");
    values.push(Date.now());
    values.push(guestId);

    await context.cloudflare.env.DB
      .prepare(`UPDATE guest SET ${fields.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    const updated = await context.cloudflare.env.DB
      .prepare("SELECT * FROM guest WHERE id = ?")
      .bind(guestId)
      .first();

    return jsonResponse({ guest: updated });
  }

  return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
}
