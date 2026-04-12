import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.photos.$photoId";
import "~/lib/context";

async function requireSiteOwnership(
  request: Request,
  context: Route.ActionArgs["context"] | Route.LoaderArgs["context"],
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
  const { id: siteId, photoId } = params;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) {
    return new Response(JSON.stringify(check), { status: check.status, headers: { "content-type": "application/json" } });
  }

  const photo = await context.cloudflare.env.DB
    .prepare("SELECT r2Key, mimeType FROM photo WHERE id = ? AND siteId = ?")
    .bind(photoId, siteId)
    .first<{ r2Key: string; mimeType: string }>();

  if (!photo) {
    return new Response("Not found", { status: 404 });
  }

  const object = await context.cloudflare.env.R2.get(photo.r2Key);
  if (!object) {
    return new Response("Not found in storage", { status: 404 });
  }

  const headers = new Headers();
  headers.set("content-type", photo.mimeType || "image/jpeg");
  headers.set("cache-control", "private, max-age=3600");
  return new Response(object.body, { headers });
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const { id: siteId, photoId } = params;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  if (request.method !== "DELETE") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
  }

  const photo = await context.cloudflare.env.DB
    .prepare("SELECT * FROM photo WHERE id = ? AND siteId = ?")
    .bind(photoId, siteId)
    .first<{ id: string; r2Key: string }>();

  if (!photo) {
    return jsonResponse({ error: { code: "NOT_FOUND", message: "Photo not found" } }, 404);
  }

  // Delete from R2 first, then DB
  try {
    await context.cloudflare.env.R2.delete(photo.r2Key);
  } catch (err) {
    console.error("[api.sites.$id.photos.$photoId DELETE r2]", err instanceof Error ? err.message : String(err));
    // Continue to delete the DB record even if R2 delete fails
  }

  await context.cloudflare.env.DB
    .prepare("DELETE FROM photo WHERE id = ?")
    .bind(photoId)
    .run();

  return jsonResponse({ success: true });
}
