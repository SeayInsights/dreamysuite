import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/app/lib/auth.server";
import { safeBlockConfig } from "@/lib/schemas/blocks";

function escEmail(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function jsonResponse(data: unknown, status = 200, cache = false) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": cache
        ? "public, max-age=60, stale-while-revalidate=300"
        : "no-store",
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteSlug: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { siteSlug } = await params;
  const db = env.DB;

  // Find site by slug
  const site = await db
    .prepare("SELECT * FROM site WHERE slug = ? AND status = 'published'")
    .bind(siteSlug)
    .first<SiteRow>();

  if (!site) {
    return jsonResponse({ error: { code: "NOT_FOUND", message: "Site not found" } }, 404, false);
  }

  // Fetch settings
  const settings = await db
    .prepare("SELECT * FROM site_setting WHERE siteId = ?")
    .bind(site.id)
    .first();

  // Log the page view asynchronously (fire-and-forget) — Note: waitUntil not available in Next.js route handlers directly;
  // we use a non-blocking pattern here
  db
    .prepare("INSERT INTO page_view (siteId, pageSlug, viewedAt) VALUES (?, ?, ?)")
    .bind(site.id, "__home__", Date.now())
    .run()
    .catch(() => undefined);

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
    const config = safeBlockConfig(block);
    blocksByPage.get(block.pageId)!.push({ ...block, config });
  }

  const pagesWithBlocks = pages.map((page: PageRow) => ({
    ...page,
    blocks: blocksByPage.get(page.id) ?? [],
  }));

  // Fetch all content rows for the site
  const contentResult = await db
    .prepare("SELECT * FROM site_content WHERE siteId = ?")
    .bind(site.id)
    .all<ContentRow>();

  const content = contentResult.results.map((row: ContentRow) => {
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
    highlightColor: (s?.navHighlightColor as string | undefined) ?? "#B8921A",
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
  }, 200, true);
}

// ── RSVP submission ───────────────────────────────────────────────────────────

interface GuestRow {
  id: string;
  siteId: string;
  firstName: string;
  lastName: string | null;
  party: string | null;
  rsvpStatus: "pending" | "yes" | "no";
  notes: string | null;
  rsvpSubmittedAt: number | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteSlug: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { siteSlug } = await params;
  const db = env.DB;

  // Parse form or JSON body
  let firstName: string | undefined;
  let lastName: string | undefined;
  let attending: string | undefined;
  let notes: string | undefined;
  let guestEmail: string | undefined;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    let body: Record<string, string>;
    try {
      body = await req.json() as Record<string, string>;
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }),
        { status: 400, headers: { "content-type": "application/json", "cache-control": "no-store" } }
      );
    }
    firstName = body.firstName;
    lastName = body.lastName;
    attending = body.attending;
    notes = body.notes;
    guestEmail = body.email || undefined;
  } else {
    // application/x-www-form-urlencoded or multipart/form-data
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: { code: "BAD_REQUEST", message: "Could not parse form data" } }),
        { status: 400, headers: { "content-type": "application/json", "cache-control": "no-store" } }
      );
    }
    firstName = formData.get("firstName")?.toString();
    lastName = formData.get("lastName")?.toString();
    attending = formData.get("attending")?.toString();
    notes = formData.get("notes")?.toString();
    guestEmail = formData.get("email")?.toString() || undefined;
  }

  // Validate required fields
  if (!firstName || !firstName.trim()) {
    return new Response(
      JSON.stringify({ ok: false, error: { code: "VALIDATION_ERROR", message: "First name is required" } }),
      { status: 400, headers: { "content-type": "application/json", "cache-control": "no-store" } }
    );
  }
  if (!lastName || !lastName.trim()) {
    return new Response(
      JSON.stringify({ ok: false, error: { code: "VALIDATION_ERROR", message: "Last name is required" } }),
      { status: 400, headers: { "content-type": "application/json", "cache-control": "no-store" } }
    );
  }
  if (attending !== "yes" && attending !== "no") {
    return new Response(
      JSON.stringify({ ok: false, error: { code: "VALIDATION_ERROR", message: "Attending must be yes or no" } }),
      { status: 400, headers: { "content-type": "application/json", "cache-control": "no-store" } }
    );
  }

  if (firstName.trim().length > 100) return new Response(JSON.stringify({ ok: false, error: { code: "BAD_REQUEST", message: "firstName must be 100 characters or less" } }), { status: 400, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  if ((lastName?.trim()?.length ?? 0) > 100) return new Response(JSON.stringify({ ok: false, error: { code: "BAD_REQUEST", message: "lastName must be 100 characters or less" } }), { status: 400, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  if ((notes?.trim()?.length ?? 0) > 2000) return new Response(JSON.stringify({ ok: false, error: { code: "BAD_REQUEST", message: "notes must be 2000 characters or less" } }), { status: 400, headers: { "content-type": "application/json", "cache-control": "no-store" } });

  const firstNameClean = firstName.trim();
  const lastNameClean = lastName.trim();

  // Look up the site
  const site = await db
    .prepare("SELECT id FROM site WHERE slug = ? AND status = 'published'")
    .bind(siteSlug)
    .first<{ id: string }>();

  if (!site) {
    return new Response(
      JSON.stringify({ ok: false, error: { code: "NOT_FOUND", message: "Site not found" } }),
      { status: 404, headers: { "content-type": "application/json", "cache-control": "no-store" } }
    );
  }

  // Find guest by name (case-insensitive match on firstName + lastName)
  const guest = await db
    .prepare(
      "SELECT * FROM guest WHERE siteId = ? AND LOWER(firstName) = LOWER(?) AND LOWER(COALESCE(lastName,'')) = LOWER(?)"
    )
    .bind(site.id, firstNameClean, lastNameClean)
    .first<GuestRow>();

  if (!guest) {
    return new Response(
      JSON.stringify({ ok: false, error: { code: "NOT_FOUND", message: "We couldn't find your name on the list" } }),
      { status: 404, headers: { "content-type": "application/json", "cache-control": "no-store" } }
    );
  }

  if (guest.rsvpStatus !== "pending") {
    return new Response(
      JSON.stringify({ ok: false, error: { code: "ALREADY_SUBMITTED", message: "You've already submitted your RSVP" } }),
      { status: 409, headers: { "content-type": "application/json", "cache-control": "no-store" } }
    );
  }

  // Update the guest record
  const now = Date.now();
  await db
    .prepare(
      "UPDATE guest SET rsvpStatus = ?, notes = ?, rsvpSubmittedAt = ?, updatedAt = ? WHERE id = ?"
    )
    .bind(attending, notes ?? null, now, now, guest.id)
    .run();

  // Send email notifications via Resend (fire and forget)
  const resendKey = (env as unknown as Record<string, string>).RESEND_API_KEY;
  if (resendKey) {
    const ownerInfo = await db
      .prepare(
        `SELECT u.email AS ownerEmail, s.name AS siteName, ss.eventName, ss.eventDate
         FROM site s
         JOIN user u ON u.id = s.userId
         LEFT JOIN site_setting ss ON ss.siteId = s.id
         WHERE s.slug = ?`
      )
      .bind(siteSlug)
      .first<{ ownerEmail: string; siteName: string; eventName: string | null; eventDate: string | null }>();

    if (ownerInfo) {
      const eventLabel = ownerInfo.eventName || ownerInfo.siteName;
      const guestName = `${firstNameClean} ${lastNameClean}`;
      const attendingLabel = attending === "yes" ? "will attend" : "cannot attend";
      const emailHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      };

      // Fire-and-forget email notifications
      (async () => {
        // Owner notification
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: emailHeaders,
          body: JSON.stringify({
            from: "DreamySuite <notifications@dreamysuite.com>",
            to: [ownerInfo.ownerEmail],
            subject: `New RSVP: ${guestName} ${attendingLabel}`,
            html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:2rem;color:#292524"><h2 style="font-weight:normal;margin:0 0 1rem">${escEmail(eventLabel)}</h2><p><strong>${escEmail(guestName)}</strong> has responded and <strong>${escEmail(attendingLabel)}</strong>.</p>${notes ? `<p style="color:#78716c"><em>Notes: ${escEmail(notes)}</em></p>` : ""}<hr style="border:none;border-top:1px solid #e7e5e4;margin:1.5rem 0"><p style="color:#a8a29e;font-size:0.8rem">Sent via DreamySuite</p></div>`,
          }),
        }).catch(() => undefined);

        // Guest confirmation if email provided
        if (guestEmail) {
          const confirmMsg = attending === "yes"
            ? `We're so happy you'll be joining us for <strong>${escEmail(eventLabel)}</strong>!`
            : `Thank you for letting us know. We're sorry you won't be able to make it to <strong>${escEmail(eventLabel)}</strong>.`;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: emailHeaders,
            body: JSON.stringify({
              from: "DreamySuite <notifications@dreamysuite.com>",
              to: [guestEmail],
              subject: attending === "yes" ? `See you there! — ${eventLabel}` : `RSVP confirmed — ${eventLabel}`,
              html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:2rem;color:#292524"><h2 style="font-weight:normal;margin:0 0 1rem">${escEmail(eventLabel)}</h2><p>Hi ${escEmail(firstNameClean)},</p><p>${confirmMsg}</p><hr style="border:none;border-top:1px solid #e7e5e4;margin:1.5rem 0"><p style="color:#a8a29e;font-size:0.8rem">Sent via DreamySuite</p></div>`,
            }),
          }).catch(() => undefined);
        }
      })();
    }
  }

  // Look up settings for a language-appropriate response message
  const settings = await db
    .prepare("SELECT mainLanguage FROM site_setting WHERE siteId = ?")
    .bind(site.id)
    .first<{ mainLanguage: string | null }>();

  const lang = settings?.mainLanguage ?? "en";
  const message =
    attending === "yes"
      ? lang === "es"
        ? "Gracias por confirmar tu asistencia. Te esperamos."
        : "Thank you! We're so happy you'll be joining us."
      : lang === "es"
      ? "Gracias por hacernos saber. Lamentamos que no puedas asistir."
      : "Thank you for letting us know. We're sorry you won't be able to make it.";

  return new Response(
    JSON.stringify({ ok: true, message }),
    { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } }
  );
}
