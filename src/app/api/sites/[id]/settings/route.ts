import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/app/lib/auth.server";
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
import { hashGuestPassword } from "@/lib/crypto/guestPassword";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env: rawEnv } = await getCloudflareContext({ async: true });
    const env = rawEnv as unknown as Env;
    const { id: siteId } = await params;

    const check = await requireSiteOwnership(req, env, siteId);
    if ("error" in check) return apiOwnershipError(check);

    const row = await env.DB
      .prepare("SELECT * FROM site_setting WHERE siteId = ?")
      .bind(siteId)
      .first();

    if (row) {
      const { guestPassword: _, ...safeSettings } = row as Record<string, unknown> & { guestPassword?: unknown };
      return NextResponse.json({ settings: safeSettings });
    }
    return NextResponse.json({ settings: { siteId, ...DEFAULTS } });
  } catch (e) {
    console.error("[settings GET] db error:", e instanceof Error ? e.message : String(e));
    return apiError("DB_ERROR", "An internal error occurred. Please try again.", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env: rawEnv } = await getCloudflareContext({ async: true });
    const env = rawEnv as unknown as Env;
    const { id: siteId } = await params;

    const check = await requireSiteOwnership(req, env, siteId);
    if ("error" in check) return apiOwnershipError(check);

    const parsed = await parseJsonBody<unknown>(req);
    if ("error" in parsed) return parsed.error;

    const validated = SettingsPatchSchema.safeParse(parsed.body);
    if (!validated.success) {
      return apiError(
        "VALIDATION_ERROR",
        validated.error.issues[0]?.message ?? "Invalid settings payload",
        400,
      );
    }
    const body = validated.data;
    if (body.guestPassword) {
      body.guestPassword = await hashGuestPassword(body.guestPassword);
    }
    const now = Date.now();

    await upsertSiteSettings(env.DB, siteId, body, now);

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

    const { guestPassword: _, ...safeUpdated } = (updated ?? {}) as Record<string, unknown> & { guestPassword?: unknown };
    return NextResponse.json({ settings: safeUpdated });
  } catch (e) {
    console.error("[settings PUT] db error:", e instanceof Error ? e.message : String(e));
    return apiError("DB_ERROR", "An internal error occurred. Please try again.", 500);
  }
}
