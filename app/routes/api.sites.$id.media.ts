import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.media";
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
  const _db = context.cloudflare.env.DB;
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
  const mediaType = url.searchParams.get("type") ?? "video";

  const result = await context.cloudflare.env.DB
    .prepare("SELECT * FROM media_item WHERE siteId = ? AND mediaType = ? ORDER BY sortOrder ASC, createdAt DESC")
    .bind(siteId, mediaType)
    .all();

  return jsonResponse({ items: result.results });
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const siteId = params.id;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  if (request.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
  }

  const body = await request.json() as { url?: string; title?: string; mediaType?: string };

  if (!body.url || !body.url.trim()) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "url is required" } }, 400);
  }

  const mediaType = body.mediaType ?? "video";
  if (!["video", "music"].includes(mediaType)) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "mediaType must be video or music" } }, 400);
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  const maxOrder = await context.cloudflare.env.DB
    .prepare("SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM media_item WHERE siteId = ? AND mediaType = ?")
    .bind(siteId, mediaType)
    .first<{ maxOrder: number }>();

  const sortOrder = (maxOrder?.maxOrder ?? -1) + 1;

  await context.cloudflare.env.DB
    .prepare("INSERT INTO media_item (id, siteId, mediaType, url, title, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, siteId, mediaType, body.url.trim(), body.title?.trim() ?? null, sortOrder, now)
    .run();

  const item = await context.cloudflare.env.DB
    .prepare("SELECT * FROM media_item WHERE id = ?")
    .bind(id)
    .first();

  return jsonResponse({ item }, 201);
}
