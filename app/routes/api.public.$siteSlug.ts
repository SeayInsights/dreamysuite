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

function jsonResponseNoCache(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
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
  });
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

export async function action({ request, context, params }: Route.ActionArgs) {
  const { siteSlug } = params;
  const db = context.cloudflare.env.DB;

  if (request.method !== "POST") {
    return jsonResponseNoCache(
      { ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } },
      405
    );
  }

  // Parse form or JSON body
  let firstName: string | undefined;
  let lastName: string | undefined;
  let attending: string | undefined;
  let notes: string | undefined;
  let guestEmail: string | undefined;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    let body: Record<string, string>;
    try {
      body = await request.json() as Record<string, string>;
    } catch {
      return jsonResponseNoCache(
        { ok: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
        400
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
      formData = await request.formData();
    } catch {
      return jsonResponseNoCache(
        { ok: false, error: { code: "BAD_REQUEST", message: "Could not parse form data" } },
        400
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
    return jsonResponseNoCache(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "First name is required" } },
      400
    );
  }
  if (!lastName || !lastName.trim()) {
    return jsonResponseNoCache(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Last name is required" } },
      400
    );
  }
  if (attending !== "yes" && attending !== "no") {
    return jsonResponseNoCache(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Attending must be yes or no" } },
      400
    );
  }

  const firstNameClean = firstName.trim();
  const lastNameClean = lastName.trim();

  // Look up the site
  const site = await db
    .prepare("SELECT id FROM site WHERE slug = ? AND status = 'published'")
    .bind(siteSlug)
    .first<{ id: string }>();

  if (!site) {
    return jsonResponseNoCache(
      { ok: false, error: { code: "NOT_FOUND", message: "Site not found" } },
      404
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
    return jsonResponseNoCache(
      { ok: false, error: { code: "NOT_FOUND", message: "We couldn't find your name on the list" } },
      404
    );
  }

  if (guest.rsvpStatus !== "pending") {
    return jsonResponseNoCache(
      { ok: false, error: { code: "ALREADY_SUBMITTED", message: "You've already submitted your RSVP" } },
      409
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
  const resendKey = (context.cloudflare.env as unknown as Record<string, string>).RESEND_API_KEY;
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

      context.cloudflare.ctx.waitUntil((async () => {
        // Owner notification
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: emailHeaders,
          body: JSON.stringify({
            from: "DreamySuite <notifications@dreamysuite.com>",
            to: [ownerInfo.ownerEmail],
            subject: `New RSVP: ${guestName} ${attendingLabel}`,
            html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:2rem;color:#292524"><h2 style="font-weight:normal;margin:0 0 1rem">${eventLabel}</h2><p><strong>${guestName}</strong> has responded and <strong>${attendingLabel}</strong>.</p>${notes ? `<p style="color:#78716c"><em>Notes: ${notes}</em></p>` : ""}<hr style="border:none;border-top:1px solid #e7e5e4;margin:1.5rem 0"><p style="color:#a8a29e;font-size:0.8rem">Sent via DreamySuite</p></div>`,
          }),
        }).catch(() => undefined);

        // Guest confirmation if email provided
        if (guestEmail) {
          const confirmMsg = attending === "yes"
            ? `We're so happy you'll be joining us for <strong>${eventLabel}</strong>!`
            : `Thank you for letting us know. We're sorry you won't be able to make it to <strong>${eventLabel}</strong>.`;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: emailHeaders,
            body: JSON.stringify({
              from: "DreamySuite <notifications@dreamysuite.com>",
              to: [guestEmail],
              subject: attending === "yes" ? `See you there! — ${eventLabel}` : `RSVP confirmed — ${eventLabel}`,
              html: `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:2rem;color:#292524"><h2 style="font-weight:normal;margin:0 0 1rem">${eventLabel}</h2><p>Hi ${firstNameClean},</p><p>${confirmMsg}</p><hr style="border:none;border-top:1px solid #e7e5e4;margin:1.5rem 0"><p style="color:#a8a29e;font-size:0.8rem">Sent via DreamySuite</p></div>`,
            }),
          }).catch(() => undefined);
        }
      })());
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

  return jsonResponseNoCache({ ok: true, message }, 200);
}
