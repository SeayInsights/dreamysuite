import type { Route } from "./+types/api.public.$siteSlug";
import "~/lib/context";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

interface SiteRow {
  id: string;
  userId: string;
  name: string;
  slug: string;
  customDomain: string | null;
  eventType: string | null;
  previewColor: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}

interface PageRow {
  id: string;
  siteId: string;
  slug: string;
  label: string;
  isVisible: number;
  isLocked: number;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

interface BlockRow {
  id: string;
  siteId: string;
  pageId: string;
  type: string;
  config: string;
  sortOrder: number;
  isVisible: number;
  createdAt: number;
  updatedAt: number;
}

interface ContentRow {
  id: string;
  siteId: string;
  pageSlug: string;
  lang: string;
  content: string;
  updatedAt: number;
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const { siteSlug } = params;
  const db = context.cloudflare.env.DB;

  // Find site by slug
  const site = await db
    .prepare("SELECT * FROM site WHERE slug = ? AND status = 'published'")
    .bind(siteSlug)
    .first<SiteRow>();

  if (!site) {
    return jsonResponse({ error: { code: "NOT_FOUND", message: "Site not found" } }, 404);
  }

  // Check if site is live
  const settings = await db
    .prepare("SELECT * FROM site_setting WHERE siteId = ?")
    .bind(site.id)
    .first();

  // Log the page view asynchronously (fire-and-forget)
  context.cloudflare.ctx.waitUntil(
    db
      .prepare("INSERT INTO page_view (siteId, pageSlug, viewedAt) VALUES (?, ?, ?)")
      .bind(site.id, "__home__", Date.now())
      .run()
      .catch(() => undefined)
  );

  // Fetch visible pages ordered by sortOrder
  const pagesResult = await db
    .prepare("SELECT * FROM page WHERE siteId = ? AND isVisible = 1 ORDER BY sortOrder ASC")
    .bind(site.id)
    .all<PageRow>();

  const pages = pagesResult.results;

  // Fetch all blocks for the site at once
  const blocksResult = await db
    .prepare("SELECT * FROM block WHERE siteId = ? AND isVisible = 1 ORDER BY sortOrder ASC")
    .bind(site.id)
    .all<BlockRow>();

  // Group blocks by pageId
  const blocksByPage = new Map<string, object[]>();
  for (const block of blocksResult.results) {
    if (!blocksByPage.has(block.pageId)) blocksByPage.set(block.pageId, []);
    let config: unknown = {};
    try { config = JSON.parse(block.config); } catch { /* keep empty */ }
    blocksByPage.get(block.pageId)!.push({ ...block, config });
  }

  const pagesWithBlocks = pages.map((page) => ({
    ...page,
    blocks: blocksByPage.get(page.id) ?? [],
  }));

  // Fetch all content rows for the site
  const contentResult = await db
    .prepare("SELECT * FROM site_content WHERE siteId = ?")
    .bind(site.id)
    .all<ContentRow>();

  const content = contentResult.results.map((row) => {
    let parsed: unknown = {};
    try { parsed = JSON.parse(row.content); } catch { /* keep empty */ }
    return { ...row, content: parsed };
  });

  // Strip sensitive info from settings
  const publicSettings = settings
    ? { ...settings, guestPassword: undefined }
    : null;

  // Build navConfig from flat setting columns + per-page entrance config
  const s = settings as Record<string, unknown> | null;
  let navItems: Array<{ key: string; entrance?: string }> = [];
  try {
    if (s?.navItemsConfig) navItems = JSON.parse(s.navItemsConfig as string);
  } catch { /* keep empty */ }

  const navConfig = {
    background:     (s?.navBg       as string | undefined) ?? "white",
    style:          (s?.navPosition as string | undefined) ?? "fixed",
    brandColor:     (s?.navBrandColor     as string | undefined) ?? "#1C1917",
    linkColor:      (s?.navLinkColor      as string | undefined) ?? "#6B6560",
    highlightColor: (s?.navHighlightColor as string | undefined) ?? "#0d9488",
    items: navItems,
  };

  return jsonResponse({
    site: {
      id: site.id,
      name: site.name,
      slug: site.slug,
      customDomain: site.customDomain,
      eventType: site.eventType,
      previewColor: site.previewColor,
      status: site.status,
    },
    pages: pagesWithBlocks,
    settings: publicSettings,
    content,
    navConfig,
  });
}
