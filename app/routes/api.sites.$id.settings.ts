import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.settings";
import "~/lib/context";

async function requireSiteOwnership(
  request: Request,
  context: Route.LoaderArgs["context"],
  siteId: string
) {
  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return { error: { code: "UNAUTHORIZED", message: "Not authenticated" }, status: 401 as const };
  }
  const site = await context.cloudflare.env.DB
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string }>();
  if (!site) {
    return { error: { code: "FORBIDDEN", message: "Site not found or access denied" }, status: 403 as const };
  }
  return { userId: session.user.id };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

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
  accentColor: "#0d9488",
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
  navPosition: "fixed",
  navBrandColor: "#1C1917",
  navLinkColor: "#6B6560",
  navHighlightColor: "#0d9488",
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
};

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const siteId = params.id;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  const row = await context.cloudflare.env.DB
    .prepare("SELECT * FROM site_setting WHERE siteId = ?")
    .bind(siteId)
    .first();

  if (!row) {
    return jsonResponse({ settings: { siteId, ...DEFAULTS } });
  }

  return jsonResponse({ settings: row });
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const siteId = params.id;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  if (request.method !== "PUT") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, 400);
  }

  const now = Date.now();

  const ALLOWED_FIELDS = [
    "eventName", "eventDate", "eventLocation", "greeting", "musicUrl",
    "mainLanguage", "secondLanguage", "guestPassword", "isLive",
    "headingFont", "bodyFont", "accentColor", "bgColor",
    "songPages", "songResetPages",
    "headingColor", "bodyColor", "siteTextColor", "siteBorderColor",
    "buttonStyle", "buttonBorderWidth", "headingFontVi", "bodyFontVi",
    "navBg", "navPosition", "navBrandColor", "navLinkColor", "navHighlightColor",
    "navItemsConfig",
    "animation", "bgImage", "envelopeColor", "sealInitials", "cardColor", "cardImage", "navShape",
    "navLinkPadding", "navUnderline",
    "popupEnabled", "popupTitle", "popupTicker", "popupAfterAnimation",
  ];

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      fields.push(`"${field}" = ?`);
      const val = body[field];
      // Coerce isLive to integer
      values.push(field === "isLive" ? (val ? 1 : 0) : val);
    }
  }

  const existing = await context.cloudflare.env.DB
    .prepare("SELECT siteId FROM site_setting WHERE siteId = ?")
    .bind(siteId)
    .first<{ siteId: string }>();

  if (!existing) {
    // INSERT with defaults merged with provided body
    const merged = { ...DEFAULTS, ...Object.fromEntries(ALLOWED_FIELDS.filter(f => f in body).map(f => [f, f === "isLive" ? (body[f] ? 1 : 0) : body[f]])) };
    await context.cloudflare.env.DB
      .prepare(
        `INSERT INTO site_setting (siteId, eventName, eventDate, eventLocation, greeting, musicUrl, mainLanguage, secondLanguage, guestPassword, isLive, headingFont, bodyFont, accentColor, bgColor, songPages, songResetPages, headingColor, bodyColor, siteTextColor, siteBorderColor, buttonStyle, buttonBorderWidth, headingFontVi, bodyFontVi, navBg, navPosition, navBrandColor, navLinkColor, navHighlightColor, navItemsConfig, animation, bgImage, envelopeColor, sealInitials, cardColor, cardImage, navShape, navLinkPadding, navUnderline, popupEnabled, popupTitle, popupTicker, popupAfterAnimation, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        now
      )
      .run();
  } else if (fields.length > 0) {
    fields.push("updatedAt = ?");
    values.push(now);
    values.push(siteId);

    await context.cloudflare.env.DB
      .prepare(`UPDATE site_setting SET ${fields.join(", ")} WHERE siteId = ?`)
      .bind(...values)
      .run();
  }

  const updated = await context.cloudflare.env.DB
    .prepare("SELECT * FROM site_setting WHERE siteId = ?")
    .bind(siteId)
    .first();

  return jsonResponse({ settings: updated });
}
