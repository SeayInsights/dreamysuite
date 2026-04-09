import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.pages";
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

  const result = await context.cloudflare.env.DB
    .prepare("SELECT * FROM page WHERE siteId = ? ORDER BY sortOrder ASC")
    .bind(siteId)
    .all();

  return jsonResponse({ pages: result.results });
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const siteId = params.id;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  if (request.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
  }

  let body: { slug?: string; label?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, 400);
  }

  const { slug, label } = body;
  if (!slug || !label) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "slug and label are required" } }, 400);
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  const maxOrder = await context.cloudflare.env.DB
    .prepare("SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM page WHERE siteId = ?")
    .bind(siteId)
    .first<{ maxOrder: number }>();

  const sortOrder = (maxOrder?.maxOrder ?? -1) + 1;

  try {
    await context.cloudflare.env.DB
      .prepare(
        "INSERT INTO page (id, siteId, slug, label, isVisible, isLocked, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, 0, ?, ?, ?)"
      )
      .bind(id, siteId, slug, label, sortOrder, now, now)
      .run();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) {
      return jsonResponse({ error: { code: "CONFLICT", message: "A page with that slug already exists" } }, 409);
    }
    console.error("[api.sites.$id.pages POST]", msg);
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message: "Failed to create page" } }, 500);
  }

  const page = await context.cloudflare.env.DB
    .prepare("SELECT * FROM page WHERE id = ?")
    .bind(id)
    .first();

  return jsonResponse({ page }, 201);
}
