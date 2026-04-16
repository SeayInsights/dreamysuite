import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  const { env } = await getCloudflareContext({ async: true });
  const e = env as Record<string, unknown>;

  return NextResponse.json({
    // Don't leak actual values — just check presence and type
    AUTH_SECRET: e.AUTH_SECRET ? `set (${typeof e.AUTH_SECRET}, ${String(e.AUTH_SECRET).length} chars)` : "MISSING",
    APP_URL: e.APP_URL ?? "MISSING",
    DB: e.DB ? "bound" : "MISSING",
    KV: e.KV ? "bound" : "MISSING",
    R2: e.R2 ? "bound" : "MISSING",
    CF_ACCOUNT_ID: e.CF_ACCOUNT_ID ? "set" : "MISSING",
    RESEND_API_KEY: e.RESEND_API_KEY ? "set" : "MISSING",
    envKeys: Object.keys(e).sort(),
  });
}
