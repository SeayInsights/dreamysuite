import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.blocks.$blockId";
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
  const { id: siteId, blockId } = params;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  const block = await context.cloudflare.env.DB
    .prepare("SELECT * FROM block WHERE id = ? AND siteId = ?")
    .bind(blockId, siteId)
    .first();

  if (!block) {
    return jsonResponse({ error: { code: "NOT_FOUND", message: "Block not found" } }, 404);
  }

  if (request.method === "DELETE") {
    await context.cloudflare.env.DB
      .prepare("DELETE FROM block WHERE id = ?")
      .bind(blockId)
      .run();
    return jsonResponse({ success: true });
  }

  if (request.method === "PUT") {
    let body: { config?: unknown; sortOrder?: number; isVisible?: boolean };
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, 400);
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (body.config !== undefined) { fields.push("config = ?"); values.push(JSON.stringify(body.config)); }
    if (body.sortOrder !== undefined) { fields.push("sortOrder = ?"); values.push(body.sortOrder); }
    if (body.isVisible !== undefined) { fields.push("isVisible = ?"); values.push(body.isVisible ? 1 : 0); }

    if (fields.length === 0) {
      return jsonResponse({ error: { code: "BAD_REQUEST", message: "No fields to update" } }, 400);
    }

    fields.push("updatedAt = ?");
    values.push(Date.now());
    values.push(blockId);

    await context.cloudflare.env.DB
      .prepare(`UPDATE block SET ${fields.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    const updated = await context.cloudflare.env.DB
      .prepare("SELECT * FROM block WHERE id = ?")
      .bind(blockId)
      .first();

    return jsonResponse({ block: updated });
  }

  return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
}
