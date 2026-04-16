import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth, type Env } from "@/app/lib/auth.server";

async function requireSiteOwnership(
  req: NextRequest,
  env: Env,
  siteId: string
) {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return { error: { code: "UNAUTHORIZED", message: "Not authenticated" }, status: 401 as const };
  }
  const _db = env.DB;
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return NextResponse.json(check, { status: check.status });

  const db = env.DB;

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

  return NextResponse.json({
    rsvp: {
      total: rsvpStats?.total ?? 0,
      accepted: rsvpStats?.accepted ?? 0,
      declined: rsvpStats?.declined ?? 0,
      pending: rsvpStats?.pending ?? 0,
    },
    pageViews: pageViews.results,
  });
}
