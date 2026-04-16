import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/app/lib/auth.server";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

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
