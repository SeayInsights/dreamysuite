import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.domain.purchase";
import "~/lib/context";

// ── Helpers ───────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const DOMAIN_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

// ── Service ───────────────────────────────────────────────────────────────────

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

// ── Route handler ─────────────────────────────────────────────────────────────

export async function action({ request, context }: Route.ActionArgs) {
  // Auth check
  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return jsonResponse(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      401
    );
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } },
      405
    );
  }

  // Parse body
  let body: { domain?: unknown; siteId?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
      400
    );
  }

  const { domain, siteId } = body;

  // Validate inputs
  if (typeof domain !== "string" || !domain.trim()) {
    return jsonResponse(
      { error: { code: "BAD_REQUEST", message: "domain is required" } },
      400
    );
  }
  if (typeof siteId !== "string" || !siteId.trim()) {
    return jsonResponse(
      { error: { code: "BAD_REQUEST", message: "siteId is required" } },
      400
    );
  }

  const normalizedDomain = domain.trim().toLowerCase();

  if (!DOMAIN_RE.test(normalizedDomain)) {
    return jsonResponse(
      { error: { code: "BAD_REQUEST", message: "Invalid domain format" } },
      400
    );
  }

  // Authorization: verify site belongs to logged-in user
  const db = context.cloudflare.env.DB;
  const owned = await verifySiteOwnership(db, siteId.trim(), session.user.id);
  if (!owned) {
    return jsonResponse(
      { error: { code: "FORBIDDEN", message: "Site not found or access denied" } },
      403
    );
  }

  // Call Cloudflare Registrar
  const { CF_ACCOUNT_ID, CF_API_TOKEN } = context.cloudflare.env;
  const cfResult = await registerDomainWithCloudflare(
    CF_ACCOUNT_ID,
    CF_API_TOKEN,
    normalizedDomain
  );

  if (!cfResult.success) {
    console.error("[domain.purchase] Cloudflare registration failed:", cfResult.error);
    return jsonResponse(
      { error: { code: "REGISTRATION_FAILED", message: cfResult.error ?? "Domain registration failed" } },
      502
    );
  }

  // Persist to D1
  await saveDomainToSite(db, siteId.trim(), normalizedDomain);

  console.info("[domain.purchase] Domain registered and saved:", { domain: normalizedDomain, siteId });

  return jsonResponse({ success: true, domain: normalizedDomain });
}
