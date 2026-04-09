import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.photos.$photoId";
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
