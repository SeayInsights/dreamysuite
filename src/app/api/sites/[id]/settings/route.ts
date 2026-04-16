import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/app/lib/auth.server";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";

const DEFAULTS = {
  eventName: null,
  eventDate: null,
  eventLocation: null,
  greeting: null,
  musicUrl: null,
  mainLanguage: "en",
  secondLanguage: null,
  guestPassword: null,
  isLive: 0,
  headingFont: "Georgia",
  bodyFont: "Inter",
  accentColor: "#B8921A",
  bgColor: "#ffffff",
  songPages: null,
  songResetPages: null,
  headingColor: null,
  bodyColor: null,
  siteTextColor: null,
  siteBorderColor: null,
  buttonStyle: "filled",
  buttonBorderWidth: "1.5px",
  headingFontVi: null,
  bodyFontVi: null,
  navBg: "white",
  showNavBrand: 1,
  navPosition: "fixed",
  navBrandColor: "#1C1917",
  navLinkColor: "#6B6560",
  navHighlightColor: "#B8921A",
  navItemsConfig: null,
  animation: null,
  bgImage: null,
  envelopeColor: null,
  sealInitials: null,
  cardColor: null,
  cardImage: null,
  navShape: null,
  navLinkPadding: null,
  navUnderline: "on",
  popupEnabled: 1,
  popupTitle: null,
  popupTicker: 0,
  popupAfterAnimation: 0,
  popupBundle: 0,
  musicBtnBg: null,
  musicBtnColor: null,
  marginTop: null,
  marginRight: null,
  marginBottom: null,
  marginLeft: null,
  bgImageLayer: "behind",
  bgImageOpacity: 1.0,
  siteMaxWidth: null,
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const row = await env.DB
    .prepare("SELECT * FROM site_setting WHERE siteId = ?")
    .bind(siteId)
    .first();

  if (!row) {
    return NextResponse.json({ settings: { siteId, ...DEFAULTS } });
  }

  return NextResponse.json({ settings: row });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, { status: 400 });
  }

  const now = Date.now();

  const ALLOWED_FIELDS = [
    "eventName", "eventDate", "eventLocation", "greeting", "musicUrl",
    "mainLanguage", "secondLanguage", "guestPassword", "isLive",
    "headingFont", "bodyFont", "accentColor", "bgColor",
    "songPages", "songResetPages",
    "headingColor", "bodyColor", "siteTextColor", "siteBorderColor",
    "buttonStyle", "buttonBorderWidth", "headingFontVi", "bodyFontVi",
    "navBg", "showNavBrand", "navPosition", "navBrandColor", "navLinkColor", "navHighlightColor",
    "navItemsConfig",
    "animation", "bgImage", "envelopeColor", "sealInitials", "cardColor", "cardImage", "navShape",
    "navLinkPadding", "navUnderline",
    "popupEnabled", "popupTitle", "popupTicker", "popupAfterAnimation", "popupBundle",
    "musicBtnBg", "musicBtnColor",
    "marginTop", "marginRight", "marginBottom", "marginLeft",
    "bgImageLayer", "bgImageOpacity", "siteMaxWidth",
  ];

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      fields.push(`"${field}" = ?`);
      const val = body[field];
      // Coerce isLive to integer
      values.push((field === "isLive" || field === "showNavBrand") ? (val ? 1 : 0) : val);
    }
  }

  const existing = await env.DB
    .prepare("SELECT siteId FROM site_setting WHERE siteId = ?")
    .bind(siteId)
    .first<{ siteId: string }>();

  if (!existing) {
    // INSERT with defaults merged with provided body
    const merged = { ...DEFAULTS, ...Object.fromEntries(ALLOWED_FIELDS.filter(f => f in body).map(f => [f, f === "isLive" ? (body[f] ? 1 : 0) : body[f]])) };
    await env.DB
      .prepare(
        `INSERT INTO site_setting (siteId, eventName, eventDate, eventLocation, greeting, musicUrl, mainLanguage, secondLanguage, guestPassword, isLive, headingFont, bodyFont, accentColor, bgColor, songPages, songResetPages, headingColor, bodyColor, siteTextColor, siteBorderColor, buttonStyle, buttonBorderWidth, headingFontVi, bodyFontVi, navBg, showNavBrand, navPosition, navBrandColor, navLinkColor, navHighlightColor, navItemsConfig, animation, bgImage, envelopeColor, sealInitials, cardColor, cardImage, navShape, navLinkPadding, navUnderline, popupEnabled, popupTitle, popupTicker, popupAfterAnimation, popupBundle, musicBtnBg, musicBtnColor, marginTop, marginRight, marginBottom, marginLeft, bgImageLayer, bgImageOpacity, siteMaxWidth, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        siteId,
        merged.eventName,
        merged.eventDate,
        merged.eventLocation,
        merged.greeting,
        merged.musicUrl,
        merged.mainLanguage,
        merged.secondLanguage,
        merged.guestPassword,
        merged.isLive,
        merged.headingFont,
        merged.bodyFont,
        merged.accentColor,
        merged.bgColor,
        merged.songPages,
        merged.songResetPages,
        merged.headingColor,
        merged.bodyColor,
        merged.siteTextColor,
        merged.siteBorderColor,
        merged.buttonStyle,
        merged.buttonBorderWidth,
        merged.headingFontVi,
        merged.bodyFontVi,
        merged.navBg,
        merged.showNavBrand ?? 1,
        merged.navPosition,
        merged.navBrandColor,
        merged.navLinkColor,
        merged.navHighlightColor,
        merged.navItemsConfig,
        merged.animation ?? null,
        merged.bgImage ?? null,
        merged.envelopeColor ?? null,
        merged.sealInitials ?? null,
        merged.cardColor ?? null,
        merged.cardImage ?? null,
        merged.navShape ?? null,
        merged.navLinkPadding ?? null,
        merged.navUnderline ?? "on",
        merged.popupEnabled ?? 1,
        merged.popupTitle ?? null,
        merged.popupTicker ?? 0,
        merged.popupAfterAnimation ?? 0,
        merged.popupBundle ?? 0,
        merged.musicBtnBg ?? null,
        merged.musicBtnColor ?? null,
        merged.marginTop ?? null,
        merged.marginRight ?? null,
        merged.marginBottom ?? null,
        merged.marginLeft ?? null,
        merged.bgImageLayer ?? "behind",
        merged.bgImageOpacity ?? 1.0,
        merged.siteMaxWidth ?? null,
        now
      )
      .run();
  } else if (fields.length > 0) {
    fields.push("updatedAt = ?");
    values.push(now);
    values.push(siteId);

    await env.DB
      .prepare(`UPDATE site_setting SET ${fields.join(", ")} WHERE siteId = ?`)
      .bind(...values)
      .run();
  }

  // Sync site.status when isLive changes
  if ("isLive" in body) {
    const newStatus = body.isLive ? "published" : "draft";
    await env.DB
      .prepare("UPDATE site SET status = ?, updatedAt = ? WHERE id = ?")
      .bind(newStatus, now, siteId)
      .run();
  }

  const updated = await env.DB
    .prepare("SELECT * FROM site_setting WHERE siteId = ?")
    .bind(siteId)
    .first();

  return NextResponse.json({ settings: updated });
}
