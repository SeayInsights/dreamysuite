import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import {
  requireSiteOwnership,
  apiOwnershipError,
  apiError,
  parseJsonBody,
} from "@/lib/api/site-auth";
import {
  DEFAULTS,
  SettingsPatchSchema,
  upsertSiteSettings,
} from "@/lib/schemas/settings";
import {
  getSiteTypeSettings,
  upsertSiteTypeSettings,
} from "@/lib/schemas/site-type-settings";
import { hashGuestPassword } from "@/lib/crypto/guestPassword";

// Wedding-specific fields that should be stored in site_type_settings
const WEDDING_FIELDS = [
  "eventName",
  "eventDate",
  "eventLocation",
  "greeting",
  "musicUrl",
  "songPages",
  "songResetPages",
  "sealInitials",
  "cardColor",
  "cardImage",
  "envelopeColor",
] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const env = await getEnv();
    const { id: siteId } = await params;

    const check = await requireSiteOwnership(req, env, siteId);
    if ("error" in check) return apiOwnershipError(check);

    // Get universal settings from site_setting table
    const universalRow = await env.DB
      .prepare("SELECT * FROM site_setting WHERE siteId = ?")
      .bind(siteId)
      .first();

    const universalSettings = universalRow
      ? (universalRow as Record<string, unknown>)
      : { siteId, ...DEFAULTS };

    // Get type-specific settings from site_type_settings table
    const typeSettings = await getSiteTypeSettings(env.DB, siteId);

    // Merge type-specific settings into universal settings
    const mergedSettings = typeSettings
      ? { ...universalSettings, ...typeSettings.settings }
      : universalSettings;

    // Remove sensitive fields
    const { guestPassword: _, ...safeSettings } = mergedSettings as Record<string, unknown> & { guestPassword?: unknown };

    return NextResponse.json({ settings: safeSettings });
  } catch (e) {
    console.error("[settings GET] error:", e instanceof Error ? e.stack ?? e.message : String(e));
    return apiError("DB_ERROR", "An internal error occurred. Please try again.", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const env = await getEnv();
    const { id: siteId } = await params;

    const check = await requireSiteOwnership(req, env, siteId);
    if ("error" in check) return apiOwnershipError(check);

    const parsed = await parseJsonBody<unknown>(req);
    if ("error" in parsed) return parsed.error;

    // Get site_type to determine how to split the payload
    const site = await env.DB
      .prepare("SELECT site_type FROM site WHERE id = ?")
      .bind(siteId)
      .first<{ site_type: string }>();

    if (!site) {
      return apiError("NOT_FOUND", "Site not found", 404);
    }

    const siteType = site.site_type || "wedding"; // Default to wedding for existing sites

    // Split the body into universal and type-specific fields
    const body = parsed.body as Record<string, unknown>;
    const universalUpdates: Record<string, unknown> = {};
    const typeSpecificUpdates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (WEDDING_FIELDS.includes(key as typeof WEDDING_FIELDS[number])) {
        typeSpecificUpdates[key] = value;
      } else {
        universalUpdates[key] = value;
      }
    }

    // Validate universal settings
    const validated = SettingsPatchSchema.safeParse(universalUpdates);
    if (!validated.success) {
      return apiError(
        "VALIDATION_ERROR",
        validated.error.issues[0]?.message ?? "Invalid settings payload",
        400,
      );
    }

    const now = Date.now();

    // Hash guest password if present
    if (validated.data.guestPassword) {
      validated.data.guestPassword = await hashGuestPassword(validated.data.guestPassword);
    }

    // Update universal settings
    if (Object.keys(validated.data).length > 0) {
      await upsertSiteSettings(env.DB, siteId, validated.data, now);
    }

    // Update type-specific settings
    if (Object.keys(typeSpecificUpdates).length > 0) {
      await upsertSiteTypeSettings(env.DB, siteId, siteType, typeSpecificUpdates, now);
    }

    // Update site status if isLive changed
    if ("isLive" in validated.data) {
      const newStatus = validated.data.isLive ? "published" : "draft";
      await env.DB
        .prepare("UPDATE site SET status = ?, updatedAt = ? WHERE id = ?")
        .bind(newStatus, now, siteId)
        .run();
    }

    // Return merged settings
    const updatedUniversal = await env.DB
      .prepare("SELECT * FROM site_setting WHERE siteId = ?")
      .bind(siteId)
      .first();

    const updatedTypeSettings = await getSiteTypeSettings(env.DB, siteId);

    const mergedSettings = updatedTypeSettings
      ? { ...(updatedUniversal as Record<string, unknown>), ...updatedTypeSettings.settings }
      : (updatedUniversal as Record<string, unknown>);

    const { guestPassword: _, ...safeUpdated } = mergedSettings as Record<string, unknown> & { guestPassword?: unknown };
    return NextResponse.json({ settings: safeUpdated });
  } catch (e) {
    console.error("[settings PUT] error:", e instanceof Error ? e.stack ?? e.message : String(e));
    return apiError("DB_ERROR", "An internal error occurred. Please try again.", 500);
  }
}
