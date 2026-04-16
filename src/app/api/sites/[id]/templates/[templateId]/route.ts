import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/app/lib/auth.server";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";
import { parseBlockConfig } from "@/lib/schemas/blocks";

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId, templateId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const template = await env.DB
    .prepare("SELECT * FROM site_template WHERE id = ? AND siteId = ?")
    .bind(templateId, siteId)
    .first<{ id: string; snapshot: string }>();

  if (!template) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Template not found" } }, { status: 404 });
  }

  await env.DB
    .prepare("DELETE FROM site_template WHERE id = ?")
    .bind(templateId)
    .run();

  return NextResponse.json({ success: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId, templateId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const template = await env.DB
    .prepare("SELECT * FROM site_template WHERE id = ? AND siteId = ?")
    .bind(templateId, siteId)
    .first<{ id: string; snapshot: string }>();

  if (!template) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Template not found" } }, { status: 404 });
  }

  // Apply snapshot: restore pages, blocks, and settings
  let snapshot: { pages: SnapshotPage[]; settings?: Record<string, unknown> | null };
  try {
    snapshot = JSON.parse(template.snapshot);
  } catch {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Snapshot is corrupted" } }, { status: 500 });
  }

  const now = Date.now();
  const db = env.DB;

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
      const configParse = parseBlockConfig(block.type, block.config);
      if (!configParse.ok) {
        console.warn(
          `[templates:restore blockId=${block.id} type=${block.type}] invalid config: ${configParse.error}`,
        );
      }
      const configStr = JSON.stringify(
        configParse.ok ? configParse.config : configParse.fallback,
      );
      await db
        .prepare(
          "INSERT INTO block (id, siteId, pageId, type, config, sortOrder, isVisible, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(
          newBlockId,
          siteId,
          newPageId,
          block.type,
          configStr,
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

  return NextResponse.json({ success: true, pagesRestored: snapshot.pages?.length ?? 0 });
}
