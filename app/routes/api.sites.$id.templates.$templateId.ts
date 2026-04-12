import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.templates.$templateId";
import "~/lib/context";

async function requireSiteOwnership(
  request: Request,
  context: Route.ActionArgs["context"],
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

interface SnapshotBlock {
  id: string;
  siteId: string;
  pageId: string;
  type: string;
  config: unknown;
  sortOrder: number;
  isVisible: number;
  createdAt: number;
  updatedAt: number;
}

interface SnapshotPage {
  id: string;
  siteId: string;
  slug: string;
  label: string;
  isVisible: number;
  isLocked: number;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  blocks: SnapshotBlock[];
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const { id: siteId, templateId } = params;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  const template = await context.cloudflare.env.DB
    .prepare("SELECT * FROM site_template WHERE id = ? AND siteId = ?")
    .bind(templateId, siteId)
    .first<{ id: string; snapshot: string }>();

  if (!template) {
    return jsonResponse({ error: { code: "NOT_FOUND", message: "Template not found" } }, 404);
  }

  if (request.method === "DELETE") {
    await context.cloudflare.env.DB
      .prepare("DELETE FROM site_template WHERE id = ?")
      .bind(templateId)
      .run();
    return jsonResponse({ success: true });
  }

  if (request.method === "POST") {
    // Apply snapshot: restore pages, blocks, and settings
    let snapshot: { pages: SnapshotPage[]; settings?: Record<string, unknown> | null };
    try {
      snapshot = JSON.parse(template.snapshot);
    } catch {
      return jsonResponse({ error: { code: "INTERNAL_ERROR", message: "Snapshot is corrupted" } }, 500);
    }

    const now = Date.now();
    const db = context.cloudflare.env.DB;

    // Delete all existing pages (blocks cascade)
    await db.prepare("DELETE FROM page WHERE siteId = ?").bind(siteId).run();

    // Re-insert pages and blocks from snapshot
    for (const page of snapshot.pages ?? []) {
      const newPageId = crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO page (id, siteId, slug, label, isVisible, isLocked, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(newPageId, siteId, page.slug, page.label, page.isVisible, page.isLocked, page.sortOrder, now, now)
        .run();

      for (const block of page.blocks ?? []) {
        const newBlockId = crypto.randomUUID();
        await db
          .prepare(
            "INSERT INTO block (id, siteId, pageId, type, config, sortOrder, isVisible, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
          )
          .bind(
            newBlockId,
            siteId,
            newPageId,
            block.type,
            JSON.stringify(block.config ?? {}),
            block.sortOrder,
            block.isVisible,
            now,
            now
          )
          .run();
      }
    }

    // Restore settings if present in snapshot
    if (snapshot.settings) {
      const s = snapshot.settings;
      const existing = await db
        .prepare("SELECT siteId FROM site_setting WHERE siteId = ?")
        .bind(siteId)
        .first<{ siteId: string }>();

      if (existing) {
        await db.prepare(
          `UPDATE site_setting SET
            eventName=?, eventDate=?, eventLocation=?, greeting=?, musicUrl=?,
            mainLanguage=?, secondLanguage=?, guestPassword=?, isLive=?,
            headingFont=?, bodyFont=?, accentColor=?, bgColor=?,
            songPages=?, songResetPages=?,
            headingColor=?, bodyColor=?, siteTextColor=?, siteBorderColor=?,
            buttonStyle=?, buttonBorderWidth=?, headingFontVi=?, bodyFontVi=?,
            navBg=?, navPosition=?, navBrandColor=?, navLinkColor=?, navHighlightColor=?,
            navItemsConfig=?, animation=?, bgImage=?, envelopeColor=?, sealInitials=?,
            cardColor=?, cardImage=?, navShape=?, navLinkPadding=?, navUnderline=?,
            popupEnabled=?, popupTitle=?, popupTicker=?, popupAfterAnimation=?, popupBundle=?,
            musicBtnBg=?, musicBtnColor=?,
            marginTop=?, marginRight=?, marginBottom=?, marginLeft=?,
            updatedAt=?
          WHERE siteId=?`
        ).bind(
          s.eventName ?? null, s.eventDate ?? null, s.eventLocation ?? null, s.greeting ?? null, s.musicUrl ?? null,
          s.mainLanguage ?? null, s.secondLanguage ?? null, s.guestPassword ?? null, s.isLive ?? 0,
          s.headingFont ?? null, s.bodyFont ?? null, s.accentColor ?? null, s.bgColor ?? null,
          s.songPages ?? null, s.songResetPages ?? null,
          s.headingColor ?? null, s.bodyColor ?? null, s.siteTextColor ?? null, s.siteBorderColor ?? null,
          s.buttonStyle ?? null, s.buttonBorderWidth ?? null, s.headingFontVi ?? null, s.bodyFontVi ?? null,
          s.navBg ?? null, s.navPosition ?? null, s.navBrandColor ?? null, s.navLinkColor ?? null, s.navHighlightColor ?? null,
          s.navItemsConfig ?? null, s.animation ?? null, s.bgImage ?? null, s.envelopeColor ?? null, s.sealInitials ?? null,
          s.cardColor ?? null, s.cardImage ?? null, s.navShape ?? null, s.navLinkPadding ?? null, s.navUnderline ?? null,
          s.popupEnabled ?? 0, s.popupTitle ?? null, s.popupTicker ?? 0, s.popupAfterAnimation ?? 0, s.popupBundle ?? 0,
          s.musicBtnBg ?? null, s.musicBtnColor ?? null,
          s.marginTop ?? null, s.marginRight ?? null, s.marginBottom ?? null, s.marginLeft ?? null,
          now,
          siteId
        ).run();
      } else {
        await db.prepare(
          `INSERT INTO site_setting (siteId, eventName, eventDate, eventLocation, greeting, musicUrl, mainLanguage, secondLanguage, guestPassword, isLive, headingFont, bodyFont, accentColor, bgColor, songPages, songResetPages, headingColor, bodyColor, siteTextColor, siteBorderColor, buttonStyle, buttonBorderWidth, headingFontVi, bodyFontVi, navBg, navPosition, navBrandColor, navLinkColor, navHighlightColor, navItemsConfig, animation, bgImage, envelopeColor, sealInitials, cardColor, cardImage, navShape, navLinkPadding, navUnderline, popupEnabled, popupTitle, popupTicker, popupAfterAnimation, popupBundle, musicBtnBg, musicBtnColor, marginTop, marginRight, marginBottom, marginLeft, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          siteId,
          s.eventName ?? null, s.eventDate ?? null, s.eventLocation ?? null, s.greeting ?? null, s.musicUrl ?? null,
          s.mainLanguage ?? null, s.secondLanguage ?? null, s.guestPassword ?? null, s.isLive ?? 0,
          s.headingFont ?? null, s.bodyFont ?? null, s.accentColor ?? null, s.bgColor ?? null,
          s.songPages ?? null, s.songResetPages ?? null,
          s.headingColor ?? null, s.bodyColor ?? null, s.siteTextColor ?? null, s.siteBorderColor ?? null,
          s.buttonStyle ?? null, s.buttonBorderWidth ?? null, s.headingFontVi ?? null, s.bodyFontVi ?? null,
          s.navBg ?? null, s.navPosition ?? null, s.navBrandColor ?? null, s.navLinkColor ?? null, s.navHighlightColor ?? null,
          s.navItemsConfig ?? null, s.animation ?? null, s.bgImage ?? null, s.envelopeColor ?? null, s.sealInitials ?? null,
          s.cardColor ?? null, s.cardImage ?? null, s.navShape ?? null, s.navLinkPadding ?? null, s.navUnderline ?? null,
          s.popupEnabled ?? 0, s.popupTitle ?? null, s.popupTicker ?? 0, s.popupAfterAnimation ?? 0, s.popupBundle ?? 0,
          s.musicBtnBg ?? null, s.musicBtnColor ?? null,
          s.marginTop ?? null, s.marginRight ?? null, s.marginBottom ?? null, s.marginLeft ?? null,
          now
        ).run();
      }
    }

    return jsonResponse({ success: true, pagesRestored: snapshot.pages?.length ?? 0 });
  }

  return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
}
