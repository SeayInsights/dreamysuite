/**
 * /templates/[id]/preview — renders a starter template exactly as a published
 * site would look, using the real published-site renderer (buildHtml) with
 * in-memory data (no site is created). A fixed CTA bar links to the create flow.
 * Auth-gated: previews are a logged-in workspace feature.
 */
import { NextRequest } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { createAuth } from "@/app/lib/auth.server";
import { getStarter } from "@/lib/templates/starters";
import { buildHtml } from "@/app/[slug]/html-builder";
import { escHtml } from "@/app/[slug]/helpers";
import type {
  SiteRow,
  SiteSettingRow,
  PageWithBlocks,
  ContentMap,
  BlockTransMap,
} from "@/app/[slug]/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const env = await getEnv();

  try {
    const auth = createAuth(env);
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return new Response("Unauthorized", { status: 401 });
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const starter = getStarter(id);
  if (!starter) return new Response("Template not found", { status: 404 });

  const now = 1_700_000_000_000; // fixed so previews are deterministic/cacheable
  const s = starter.settings ?? {};

  const site: SiteRow = {
    id: "preview",
    userId: "preview",
    name: (s.eventName as string) ?? starter.name,
    slug: "preview",
    customDomain: null,
    eventType: starter.eventType,
    previewColor: starter.previewColor,
    status: "published",
    createdAt: now,
    updatedAt: now,
  };

  // buildHtml reads settings null-safely (settings?.x ?? default), so a partial
  // carrying just the template theme is sufficient.
  const settings = {
    siteId: "preview",
    isLive: 1,
    updatedAt: now,
    eventName: (s.eventName as string) ?? starter.name,
    greeting: (s.greeting as string) ?? null,
    eventDate: (s.eventDate as string) ?? null,
    eventLocation: (s.eventLocation as string) ?? null,
    mainLanguage: (s.mainLanguage as string) ?? "en",
    headingFont: (s.headingFont as string) ?? null,
    bodyFont: (s.bodyFont as string) ?? null,
    accentColor: (s.accentColor as string) ?? null,
    bgColor: (s.bgColor as string) ?? null,
    siteTextColor: (s.siteTextColor as string) ?? null,
    animation: (s.animation as string) ?? null,
    effectBg: (s.effectBg as string) ?? null,
    effectText: (s.effectText as string) ?? null,
    effectCard: (s.effectCard as string) ?? null,
  } as unknown as SiteSettingRow;

  const pages: PageWithBlocks[] = starter.pages.map((p, pi) => ({
    id: `preview-page-${pi}`,
    siteId: "preview",
    slug: p.slug,
    label: p.label,
    isVisible: 1,
    isLocked: 0,
    sortOrder: pi,
    createdAt: now,
    updatedAt: now,
    blocks: p.blocks.map((b, bi) => ({
      id: `preview-block-${pi}-${bi}`,
      siteId: "preview",
      pageId: `preview-page-${pi}`,
      type: b.type,
      config: b.config,
      sortOrder: bi,
      isVisible: 1,
      createdAt: now,
      updatedAt: now,
    })),
  }));

  const contentMap: ContentMap = new Map();
  const blockTransMap: BlockTransMap = {};

  try {
    const html = await buildHtml(
      site,
      settings,
      pages,
      contentMap,
      blockTransMap,
      "preview",
      null,
      new Set(),
    );

    const cta = `<div style="position:fixed;left:0;right:0;bottom:0;z-index:2147483647;display:flex;gap:14px;align-items:center;justify-content:center;padding:12px 16px;background:rgba(15,15,15,0.88);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font-family:system-ui,-apple-system,sans-serif;box-shadow:0 -4px 20px rgba(0,0,0,0.25)"><span style="color:#f5f5f4;font-size:0.85rem">Preview — <strong>${escHtml(starter.name)}</strong></span><a href="/sites/new?template=${escHtml(starter.id)}" style="background:#B8921A;color:#fff;padding:0.5rem 1.25rem;border-radius:8px;text-decoration:none;font-size:0.85rem;font-weight:600">Use this template</a><a href="/templates" style="color:#cfc9c2;text-decoration:none;font-size:0.85rem">Back to templates</a></div>`;
    const withCta = html.includes("</body>")
      ? html.replace("</body>", `${cta}</body>`)
      : html + cta;

    return new Response(withCta, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "private, max-age=60",
        "content-security-policy":
          "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://cloudflareinsights.com; frame-src https:",
      },
    });
  } catch (err) {
    console.error("[template preview] buildHtml failed", err);
    return new Response("Preview unavailable", { status: 500 });
  }
}
