/**
 * [slug]/route.ts — Public wedding/event site renderer
 *
 * Maps /:slug → renders the published site as a standalone HTML document.
 * Returns raw HTML — does not use React rendering.
 */
import { NextRequest } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { rewritePhotoUrlsToPublic } from "@/lib/publicImages";
import { isAnonymous, edgeCacheMatch, edgeCachePut } from "./edge-cache";
import { createAuth } from "@/app/lib/auth.server";
import { safeBlockConfig } from "@/lib/validation";
import { getEffectById } from "@/lib/effects/registry";
import { verifyGuestPassword } from "@/lib/crypto/guestPassword";
import { getSiteTypeSettings } from "@/lib/schemas/site-type-settings";
import {
  guestCookieMatches,
  guestPwCookieName,
  guestUnlockToken,
} from "@/lib/api/guest-gate";

import {
  type SiteRow,
  type SiteSettingRow,
  type PageRow,
  type BlockRow,
  type ParsedBlock,
  type PageWithBlocks,
  type ContentMap,
} from "./types";
import { escHtml } from "./helpers";
import { buildHtml } from "./html-builder";
import { comingSoonHtml, notFoundHtml } from "./pages";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const routeParams = await params;
  let slug = routeParams.slug;
  const env = await getEnv();
  const db = env.DB;

  // A connected custom domain was rewritten to /__host__ by middleware — resolve
  // it to the owning site's slug, then fall through to the normal render path.
  if (slug === "__host__") {
    const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
    const match = await db
      .prepare("SELECT slug FROM site WHERE customDomain = ?")
      .bind(host)
      .first<{ slug: string }>();
    if (!match) {
      return new Response(notFoundHtml(), {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    slug = match.slug;
  }

  // Fast path: anonymous visitors are served straight from the edge cache.
  // Only live, published, non-gated public renders are ever stored (see the
  // edgeCachePut below), and owners/invited/logged-in viewers always carry a
  // session cookie — so isAnonymous() keeps them out of this path and they get
  // a fresh, correct render. Fails open: a miss or any error just renders.
  if (isAnonymous(req)) {
    const cached = await edgeCacheMatch(req);
    if (cached) return cached;
  }

  let viewerUserId: string | null = null;
  let viewerEmail: string | null = null;
  try {
    const auth = createAuth(env);
    const session = await auth.api.getSession({ headers: req.headers });
    viewerUserId = session?.user?.id ?? null;
    viewerEmail = session?.user?.email ?? null;
  } catch {
    /* Unauthenticated visitor */
  }

  let site: SiteRow | null = null;
  let isOwner = false;

  if (viewerUserId) {
    site = await db
      .prepare("SELECT id, name, slug FROM site WHERE slug = ? AND userId = ?")
      .bind(slug, viewerUserId)
      .first<SiteRow>();
    if (site) isOwner = true;
  }
  if (!site && viewerEmail) {
    const invited = await db
      .prepare(
        "SELECT s.id, s.name, s.slug FROM site s JOIN site_invite i ON i.siteId = s.id WHERE s.slug = ? AND i.email = ?",
      )
      .bind(slug, viewerEmail.toLowerCase())
      .first<SiteRow>();
    if (invited) {
      site = invited;
      isOwner = true;
    }
  }
  if (!site) {
    site = await db
      .prepare(
        "SELECT id, name, slug FROM site WHERE slug = ? AND status = 'published'",
      )
      .bind(slug)
      .first<SiteRow>();
  }
  if (!site) {
    return new Response(notFoundHtml(), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // Fetch settings: merge universal settings with type-specific settings
  const universalSettings = await db
    .prepare("SELECT * FROM site_setting WHERE siteId = ?")
    .bind(site.id)
    .first<SiteSettingRow>();
  const typeSettings = await getSiteTypeSettings(db, site.id);
  const settings =
    universalSettings && typeSettings
      ? { ...universalSettings, ...typeSettings.settings }
      : universalSettings;

  if (settings) {
    const effectKeys = [
      "effectBg",
      "effectText",
      "effectCard",
      "effectTransition",
      "effectCursor",
      "effectDecoration",
      "effectNavStyle",
    ] as const;
    for (const key of effectKeys) {
      const id = settings[key];
      if (!id) continue;
      const entry = getEffectById(id);
      if (!entry || entry.disabled)
        (settings as unknown as Record<string, unknown>)[key] = null;
    }
  }

  if (!isOwner && !settings?.isLive) {
    return new Response(comingSoonHtml(site.name), {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  let passwordPages: string[] = [];
  if (settings?.passwordPages) {
    try {
      passwordPages = JSON.parse(settings.passwordPages);
    } catch {
      /* ignore */
    }
  }
  const hasPerPagePassword = passwordPages.length > 0;

  let pwUnlocked = false;
  if (!isOwner && settings?.guestPassword) {
    const pw = req.cookies.get(guestPwCookieName(slug))?.value ?? null;
    if (guestCookieMatches(pw, settings.guestPassword)) {
      pwUnlocked = true;
    } else if (!hasPerPagePassword) {
      const accent = settings.accentColor ?? "#B8921A";
      const siteName = settings.eventName ?? site.name;
      const gateHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${escHtml(siteName)}</title><style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;background:#faf8f5;color:#292524;display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:1.5rem}.gate-wrap{text-align:center;max-width:360px;width:100%}h1{font-size:1.75rem;font-weight:normal;margin-bottom:.5rem}p{color:#78716c;margin-bottom:1.75rem;font-size:.9375rem}.gate-form{display:flex;flex-direction:column;gap:.875rem}.gate-input{width:100%;border:1px solid #e7e5e4;border-radius:6px;padding:.625rem .875rem;font-family:inherit;font-size:1rem;color:#292524;outline:none;transition:border-color .15s}.gate-input:focus{border-color:${escHtml(accent)}}.gate-btn{padding:.75rem 2rem;border:none;border-radius:6px;background:${escHtml(accent)};color:#fff;font-family:inherit;font-size:.9375rem;cursor:pointer;transition:opacity .15s}.gate-btn:hover{opacity:.88}</style></head><body><div class="gate-wrap"><h1>${escHtml(siteName)}</h1><p>This site is password protected. Please enter the password to continue.</p><form class="gate-form" method="post"><input class="gate-input" type="password" name="pw" placeholder="Enter password" aria-label="Site password" required/><button class="gate-btn" type="submit">Enter</button></form></div></body></html>`;
      return new Response(gateHtml, {
        status: 401,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  }
  const lockedPageIds = new Set(
    !isOwner && hasPerPagePassword && !pwUnlocked ? passwordPages : [],
  );

  const pagesResult = await db
    .prepare(
      "SELECT id, slug, isVisible, label FROM page WHERE siteId = ? AND isVisible = 1 ORDER BY sortOrder ASC",
    )
    .bind(site.id)
    .all<PageRow>();
  const blocksResult = await db
    .prepare(
      "SELECT id, pageId, siteId, type, config FROM block WHERE siteId = ? AND isVisible = 1 ORDER BY sortOrder ASC",
    )
    .bind(site.id)
    .all<BlockRow>();

  const blocksByPage = new Map<string, ParsedBlock[]>();
  for (const block of blocksResult.results) {
    if (!blocksByPage.has(block.pageId)) blocksByPage.set(block.pageId, []);
    const config = safeBlockConfig(block);
    blocksByPage.get(block.pageId)!.push({ ...block, config });
  }

  const pages: PageWithBlocks[] = pagesResult.results.map((page: PageRow) => ({
    ...page,
    blocks: blocksByPage.get(page.id) ?? [],
  }));

  const contentResult = await db
    .prepare(
      "SELECT pageSlug, lang, content FROM site_content WHERE siteId = ?",
    )
    .bind(site.id)
    .all<{ pageSlug: string; lang: string; content: string }>();
  const contentMap: ContentMap = new Map();
  for (const row of contentResult.results) {
    if (!contentMap.has(row.pageSlug)) contentMap.set(row.pageSlug, new Map());
    try {
      contentMap
        .get(row.pageSlug)!
        .set(row.lang, JSON.parse(row.content) as Record<string, unknown>);
    } catch {
      /* skip */
    }
  }

  // Block-level translations from the dedicated table
  const btResult = await db
    .prepare(
      "SELECT blockId, lang, field, value FROM block_translation WHERE siteId = ?",
    )
    .bind(site.id)
    .all<{ blockId: string; lang: string; field: string; value: string }>();
  const blockTransMap: Record<
    string,
    Record<string, Record<string, string>>
  > = {};
  for (const r of btResult.results) {
    if (!blockTransMap[r.blockId]) blockTransMap[r.blockId] = {};
    if (!blockTransMap[r.blockId][r.lang])
      blockTransMap[r.blockId][r.lang] = {};
    blockTransMap[r.blockId][r.lang][r.field] = r.value;
  }

  const activeLang = new URL(req.url).searchParams.get("_lang") ?? null;
  const html = await buildHtml(
    site,
    settings ?? null,
    pages,
    contentMap,
    blockTransMap,
    site.slug,
    activeLang,
    lockedPageIds,
  );
  // Published pages are viewed by the public, but the owner photo route
  // (/api/sites/[id]/photos/[photoId]) requires auth — so rewrite those URLs to
  // the public, WebP-optimized image route so guest browsers can load images.
  const publicHtml = rewritePhotoUrlsToPublic(html);
  const res = new Response(publicHtml, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
      // Effect runtimes + gsap are self-hosted under /effects/vendor, so script
      // origins are limited to 'self' (+ Cloudflare web-analytics). No esm.sh /
      // cdnjs runtime dependency.
      "content-security-policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://cloudflareinsights.com; frame-src https:",
    },
  });

  // Store only live, public, non-gated renders (max-age=60 caps staleness so a
  // publish/edit reflects within ~a minute without a cross-colo purge, which
  // would need a Cloudflare zone-scoped API token). isAnonymous already implies
  // a non-owner viewer; the gate checks keep password-protected content out.
  if (
    isAnonymous(req) &&
    settings?.isLive &&
    !settings?.guestPassword &&
    !hasPerPagePassword
  ) {
    await edgeCachePut(req, res);
  }
  return res;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const routeParams = await params;
  let slug = routeParams.slug;
  const env = await getEnv();
  const db = env.DB;

  if (slug === "__host__") {
    const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];
    const match = await db
      .prepare("SELECT slug FROM site WHERE customDomain = ?")
      .bind(host)
      .first<{ slug: string }>();
    if (!match) {
      return new Response(notFoundHtml(), {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    slug = match.slug;
  }

  const site = await db
    .prepare("SELECT id FROM site WHERE slug = ? AND status = 'published'")
    .bind(slug)
    .first<SiteRow>();
  if (!site) {
    return new Response(notFoundHtml(), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const settings = await db
    .prepare("SELECT guestPassword FROM site_setting WHERE siteId = ?")
    .bind(site.id)
    .first<{ guestPassword: string | null }>();
  const formData = await req.formData();
  const pw = formData.get("pw") as string | null;

  const redirectUrl = new URL(`/${slug}`, req.url);
  if (
    pw &&
    settings?.guestPassword &&
    (await verifyGuestPassword(pw, settings.guestPassword))
  ) {
    const token = guestUnlockToken(settings.guestPassword);
    return new Response(null, {
      status: 303,
      headers: {
        Location: redirectUrl.toString(),
        "Set-Cookie": `${guestPwCookieName(slug)}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
      },
    });
  }

  return Response.redirect(redirectUrl, 303);
}

// Resource route — no component export. React Router v7 sends the loader's
// Response directly as the HTTP response without component rendering or
// turbo-stream serialization. Adding a component export would cause RR to
// attempt hydration serialization of the raw Response, throwing an error.
