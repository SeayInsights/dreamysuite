import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.analytics";
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

  const db = context.cloudflare.env.DB;

  // RSVP stats
  const rsvpStats = await db
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN rsvpStatus = 'yes' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN rsvpStatus = 'no' THEN 1 ELSE 0 END) as declined,
        SUM(CASE WHEN rsvpStatus = 'pending' THEN 1 ELSE 0 END) as pending
       FROM guest WHERE siteId = ?`
    )
    .bind(siteId)
    .first<{ total: number; accepted: number; declined: number; pending: number }>();

  // Page view counts grouped by pageSlug
  const pageViews = await db
    .prepare(
      `SELECT pageSlug, COUNT(*) as views FROM page_view WHERE siteId = ? GROUP BY pageSlug ORDER BY views DESC`
    )
    .bind(siteId)
    .all<{ pageSlug: string; views: number }>();

  return jsonResponse({
    rsvp: {
      total: rsvpStats?.total ?? 0,
      accepted: rsvpStats?.accepted ?? 0,
      declined: rsvpStats?.declined ?? 0,
      pending: rsvpStats?.pending ?? 0,
    },
    pageViews: pageViews.results,
  });
}
