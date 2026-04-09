import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.blocks";
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
  const siteId = params.id;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  if (request.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
  }

  let body: { pageId?: string; type?: string; config?: unknown; sortOrder?: number };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, 400);
  }

  const { pageId, type, config, sortOrder } = body;
  if (!pageId || !type) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "pageId and type are required" } }, 400);
  }

  // Verify the page belongs to this site
  const page = await context.cloudflare.env.DB
    .prepare("SELECT id FROM page WHERE id = ? AND siteId = ?")
    .bind(pageId, siteId)
    .first<{ id: string }>();

  if (!page) {
    return jsonResponse({ error: { code: "NOT_FOUND", message: "Page not found in this site" } }, 404);
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  const configStr = config !== undefined ? JSON.stringify(config) : "{}";

  let resolvedOrder = sortOrder;
  if (resolvedOrder === undefined) {
    const maxOrder = await context.cloudflare.env.DB
      .prepare("SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM block WHERE pageId = ?")
      .bind(pageId)
      .first<{ maxOrder: number }>();
    resolvedOrder = (maxOrder?.maxOrder ?? -1) + 1;
  }

  await context.cloudflare.env.DB
    .prepare(
      "INSERT INTO block (id, siteId, pageId, type, config, sortOrder, isVisible, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)"
    )
    .bind(id, siteId, pageId, type, configStr, resolvedOrder, now, now)
    .run();

  const block = await context.cloudflare.env.DB
    .prepare("SELECT * FROM block WHERE id = ?")
    .bind(id)
    .first();

  return jsonResponse({ block }, 201);
}
