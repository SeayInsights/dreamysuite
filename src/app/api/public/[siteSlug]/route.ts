import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { safeBlockConfig, safeJsonParse } from "@/lib/validation";
import { isRateLimited } from "@/lib/rateLimit";
import { getSiteTypeSettings } from "@/lib/schemas/site-type-settings";

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
  { params }: { params: Promise<{ siteSlug: string }> },
) {
  const env = await getEnv();
  const { siteSlug } = await params;
  const db = env.DB;

  // Find site by slug
  const site = await db
    .prepare(
      "SELECT id, name, slug, customDomain, eventType, previewColor, status FROM site WHERE slug = ? AND status = 'published'",
    )
    .bind(siteSlug)
    .first<
      Pick<
        SiteRow,
        | "id"
        | "name"
        | "slug"
        | "customDomain"
        | "eventType"
        | "previewColor"
        | "status"
      >
    >();

  if (!site) {
    return jsonResponse(
      { error: { code: "NOT_FOUND", message: "Site not found" } },
      404,
      false,
    );
  }

  // Fetch settings: merge universal settings with type-specific settings (guestPassword excluded — server-only field)
  const universalSettings = await db
    .prepare(
      "SELECT siteId, mainLanguage, navBg, navPosition, navBrandColor, navLinkColor, navHighlightColor, navItemsConfig, updatedAt FROM site_setting WHERE siteId = ?",
    )
    .bind(site.id)
    .first();

  const typeSettings = await getSiteTypeSettings(db, site.id);
  const settings =
    universalSettings && typeSettings
      ? { ...universalSettings, ...(typeSettings?.settings ?? {}) }
      : universalSettings;

  // Log the page view asynchronously (fire-and-forget) — Note: waitUntil not available in Next.js route handlers directly;
  // we use a non-blocking pattern here
  db.prepare(
    "INSERT INTO page_view (siteId, pageSlug, viewedAt) VALUES (?, ?, ?)",
  )
    .bind(site.id, "__home__", Date.now())
    .run()
    .catch((err) => console.error("[analytics] page_view insert failed:", err));

  // Fetch visible pages ordered by sortOrder
  const pagesResult = await db
    .prepare(
      "SELECT * FROM page WHERE siteId = ? AND isVisible = 1 ORDER BY sortOrder ASC",
    )
    .bind(site.id)
    .all<PageRow>();

  const pages = pagesResult.results;

  // Fetch all blocks for the site at once
  const blocksResult = await db
    .prepare(
      "SELECT * FROM block WHERE siteId = ? AND isVisible = 1 ORDER BY sortOrder ASC",
    )
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
    const parsed = safeJsonParse(row.content, {});
    return { ...row, content: parsed };
  });

  // guestPassword already excluded from SELECT above
  const publicSettings = settings ?? null;

  // Build navConfig from flat setting columns + per-page entrance config
  const s = settings as Record<string, unknown> | null;
  const navItems: Array<{ key: string; entrance?: string }> = s?.navItemsConfig
    ? safeJsonParse(s.navItemsConfig as string, [])
    : [];

  const navConfig = {
    background: (s?.navBg as string | undefined) ?? "white",
    style: (s?.navPosition as string | undefined) ?? "fixed",
    brandColor: (s?.navBrandColor as string | undefined) ?? "#1C1917",
    linkColor: (s?.navLinkColor as string | undefined) ?? "#6B6560",
    highlightColor: (s?.navHighlightColor as string | undefined) ?? "#B8921A",
    items: navItems,
  };

  return jsonResponse(
    {
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
    },
    200,
    true,
  );
}

// ── RSVP submission ───────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteSlug: string }> },
) {
  const env = await getEnv();

  // Rate limit: 5 requests per 600 s per IP on RSVP
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  if (await isRateLimited(env.KV, `rsvp:${ip}`, 5, 600)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { siteSlug } = await params;
  const db = env.DB;

  // Parse form or JSON body
  let firstName: string | undefined;
  let lastName: string | undefined;
  let attending: string | undefined;
  let notes: string | undefined;
  let guestEmail: string | undefined;
  let customResponses: Record<string, unknown> | undefined;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({
          ok: false,
          error: { code: "BAD_REQUEST", message: "Invalid JSON body" },
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
        },
      );
    }
    firstName = body.firstName as string | undefined;
    lastName = body.lastName as string | undefined;
    attending = body.attending as string | undefined;
    notes = body.notes as string | undefined;
    guestEmail = (body.email as string) || undefined;
    customResponses = body.customResponses as
      | Record<string, unknown>
      | undefined;
  } else {
    // application/x-www-form-urlencoded or multipart/form-data
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return new Response(
        JSON.stringify({
          ok: false,
          error: { code: "BAD_REQUEST", message: "Could not parse form data" },
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
        },
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
      JSON.stringify({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "First name is required" },
      }),
      {
        status: 400,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      },
    );
  }
  if (!lastName || !lastName.trim()) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Last name is required" },
      }),
      {
        status: 400,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      },
    );
  }
  if (attending !== "yes" && attending !== "no") {
    return new Response(
      JSON.stringify({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Attending must be yes or no",
        },
      }),
      {
        status: 400,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      },
    );
  }

  if (firstName.trim().length > 100)
    return new Response(
      JSON.stringify({
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "firstName must be 100 characters or less",
        },
      }),
      {
        status: 400,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      },
    );
  if ((lastName?.trim()?.length ?? 0) > 100)
    return new Response(
      JSON.stringify({
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "lastName must be 100 characters or less",
        },
      }),
      {
        status: 400,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      },
    );
  if ((notes?.trim()?.length ?? 0) > 2000)
    return new Response(
      JSON.stringify({
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "notes must be 2000 characters or less",
        },
      }),
      {
        status: 400,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      },
    );

  const firstNameClean = firstName.trim();
  const lastNameClean = lastName.trim();
  const emailClean = guestEmail?.trim() || null;
  const notesClean = notes?.trim() || null;

  // Look up the site
  const site = await db
    .prepare("SELECT id FROM site WHERE slug = ? AND status = 'published'")
    .bind(siteSlug)
    .first<{ id: string }>();

  if (!site) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: { code: "NOT_FOUND", message: "Site not found" },
      }),
      {
        status: 404,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      },
    );
  }

  // Upsert contact: match by email first (if provided), fallback to name
  const now = Date.now();
  let contactId: string;
  let existingContact: { id: string } | null = null;

  if (emailClean) {
    existingContact = await db
      .prepare("SELECT id FROM contact WHERE site_id = ? AND email = ?")
      .bind(site.id, emailClean)
      .first<{ id: string }>();
  }

  if (!existingContact) {
    existingContact = await db
      .prepare(
        "SELECT id FROM contact WHERE site_id = ? AND LOWER(name) = LOWER(?)",
      )
      .bind(site.id, `${firstNameClean} ${lastNameClean}`)
      .first<{ id: string }>();
  }

  if (existingContact) {
    // Update existing contact
    contactId = existingContact.id;
    await db
      .prepare(
        "UPDATE contact SET name = ?, email = ?, metadata = ?, updated_at = ? WHERE id = ?",
      )
      .bind(
        `${firstNameClean} ${lastNameClean}`,
        emailClean,
        JSON.stringify({
          rsvpStatus: attending === "yes" ? "attending" : "not-attending",
          customResponses: customResponses ?? {},
          notes: notesClean,
        }),
        now,
        contactId,
      )
      .run();
  } else {
    // Create new contact
    contactId = crypto.randomUUID();
    await db
      .prepare(
        "INSERT INTO contact (id, site_id, name, email, contact_type, metadata, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        contactId,
        site.id,
        `${firstNameClean} ${lastNameClean}`,
        emailClean,
        "guest",
        JSON.stringify({
          rsvpStatus: attending === "yes" ? "attending" : "not-attending",
          customResponses: customResponses ?? {},
          notes: notesClean,
        }),
        "active",
        now,
        now,
      )
      .run();
  }

  // Create submission record
  const submissionId = crypto.randomUUID();
  await db
    .prepare(
      "INSERT INTO submission (id, site_id, contact_id, submission_type, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      submissionId,
      site.id,
      contactId,
      "rsvp",
      JSON.stringify({
        attending: attending === "yes",
        firstName: firstNameClean,
        lastName: lastNameClean,
        notes: notesClean,
        customResponses: customResponses ?? {},
      }),
      now,
      now,
    )
    .run();

  // Send email notifications via Resend (fire and forget)
  const resendKey = (env as unknown as Record<string, string>).RESEND_API_KEY;
  if (resendKey) {
    const ownerInfo = await db
      .prepare(
        `SELECT u.email AS ownerEmail, s.name AS siteName
         FROM site s
         JOIN user u ON u.id = s.userId
         WHERE s.slug = ?`,
      )
      .bind(siteSlug)
      .first<{ ownerEmail: string; siteName: string }>();

    if (ownerInfo) {
      // eventName moved from site_setting to site_type_settings in migration 0040.
      const ownerTypeSettings = await getSiteTypeSettings(db, site.id);
      const eventName =
        (
          ownerTypeSettings?.settings as
            | { eventName?: string | null }
            | undefined
        )?.eventName ?? null;
      const eventLabel = eventName || ownerInfo.siteName;
      const guestName = `${firstNameClean} ${lastNameClean}`;
      const attendingLabel =
        attending === "yes" ? "will attend" : "cannot attend";
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
          const confirmMsg =
            attending === "yes"
              ? `We're so happy you'll be joining us for <strong>${escEmail(eventLabel)}</strong>!`
              : `Thank you for letting us know. We're sorry you won't be able to make it to <strong>${escEmail(eventLabel)}</strong>.`;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: emailHeaders,
            body: JSON.stringify({
              from: "DreamySuite <notifications@dreamysuite.com>",
              to: [guestEmail],
              subject:
                attending === "yes"
                  ? `See you there! — ${eventLabel}`
                  : `RSVP confirmed — ${eventLabel}`,
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

  return new Response(JSON.stringify({ ok: true, message }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}
