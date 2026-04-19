import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { createAuth, type Env } from "@/app/lib/auth.server";

const DOMAIN_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

async function verifySiteOwnership(
  db: D1Database,
  siteId: string,
  userId: string
): Promise<boolean> {
  const row = await db
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, userId)
    .first<{ id: string }>();
  return row !== null;
}

async function registerDomainWithCloudflare(
  accountId: string,
  apiToken: string,
  domain: string
): Promise<{ success: boolean; error?: string }> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/registrar/domains`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: domain,
        privacy: false,
        auto_renew: true,
        years: 1,
      }),
    });
  } catch {
    return { success: false, error: "Failed to reach Cloudflare API." };
  }

  let payload: { success: boolean; errors?: Array<{ message: string }> };
  try {
    payload = await res.json();
  } catch {
    return { success: false, error: "Invalid response from Cloudflare API." };
  }

  if (!payload.success) {
    const cfMessage = payload.errors?.[0]?.message ?? "Registration failed.";
    return { success: false, error: cfMessage };
  }

  return { success: true };
}

async function saveDomainToSite(
  db: D1Database,
  siteId: string,
  domain: string
): Promise<void> {
  await db
    .prepare("UPDATE site SET customDomain = ? WHERE id = ?")
    .bind(domain, siteId)
    .run();
}

export async function POST(req: NextRequest) {
  const env = await getEnv();

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  // Parse body
  let body: { domain?: unknown; siteId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const { domain, siteId } = body;

  // Validate inputs
  if (typeof domain !== "string" || !domain.trim()) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "domain is required" } },
      { status: 400 }
    );
  }
  if (typeof siteId !== "string" || !siteId.trim()) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "siteId is required" } },
      { status: 400 }
    );
  }

  const normalizedDomain = domain.trim().toLowerCase();

  if (!DOMAIN_RE.test(normalizedDomain)) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid domain format" } },
      { status: 400 }
    );
  }

  // Authorization: verify site belongs to logged-in user
  const db = env.DB;
  const owned = await verifySiteOwnership(db, siteId.trim(), session.user.id);
  if (!owned) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Site not found or access denied" } },
      { status: 403 }
    );
  }

  // Call Cloudflare Registrar
  const cfResult = await registerDomainWithCloudflare(
    env.CF_ACCOUNT_ID,
    env.CF_API_TOKEN,
    normalizedDomain
  );

  if (!cfResult.success) {
    console.error("[domain.purchase] Cloudflare registration failed:", cfResult.error);
    return NextResponse.json(
      { error: { code: "REGISTRATION_FAILED", message: cfResult.error ?? "Domain registration failed" } },
      { status: 502 }
    );
  }

  // Persist to D1
  await saveDomainToSite(db, siteId.trim(), normalizedDomain);

  console.info("[domain.purchase] Domain registered and saved:", { domain: normalizedDomain, siteId });

  return NextResponse.json({ success: true, domain: normalizedDomain });
}
