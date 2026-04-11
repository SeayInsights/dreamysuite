import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.media.$mediaId";
import "~/lib/context";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const { id: siteId, mediaId } = params;

  if (request.method !== "DELETE") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
  }

  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, 401);
  }

  const site = await context.cloudflare.env.DB
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string }>();
  if (!site) {
    return jsonResponse({ error: { code: "FORBIDDEN", message: "Access denied" } }, 403);
  }

  await context.cloudflare.env.DB
    .prepare("DELETE FROM media_item WHERE id = ? AND siteId = ?")
    .bind(mediaId, siteId)
    .run();

  return jsonResponse({ ok: true });
}
