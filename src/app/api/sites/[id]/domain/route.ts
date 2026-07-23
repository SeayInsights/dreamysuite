import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import {
  requireSiteOwnership,
  apiOwnershipError,
  apiError,
  parseJsonBody,
} from "@/lib/api/site-auth";
import {
  createCustomHostname,
  findCustomHostname,
  deleteCustomHostname,
} from "@/lib/cloudflare/customHostnames";

/** Customers point their domain here (the Cloudflare-for-SaaS fallback origin). */
const CNAME_TARGET = "fallback.dreamysuite.com";

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

async function getSiteDomain(
  env: Awaited<ReturnType<typeof getEnv>>,
  siteId: string,
) {
  return env.DB.prepare("SELECT customDomain FROM site WHERE id = ?")
    .bind(siteId)
    .first<{ customDomain: string | null }>();
}

// GET — current custom-domain connection + live status.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const env = await getEnv();
  const { id: siteId } = await params;
  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const row = await getSiteDomain(env, siteId);
  const domain = row?.customDomain ?? null;
  if (!domain) return NextResponse.json({ domain: null });

  const found = await findCustomHostname(env, domain);
  if (!found.ok) {
    return NextResponse.json({ domain, status: "unknown", error: found.error });
  }
  return NextResponse.json({
    domain,
    cnameTarget: CNAME_TARGET,
    status: found.data?.status ?? "pending",
    sslStatus: found.data?.sslStatus ?? "pending_validation",
    verificationErrors: found.data?.verificationErrors ?? [],
  });
}

// POST { domain } — connect a custom domain.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const env = await getEnv();
  const { id: siteId } = await params;
  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const parsed = await parseJsonBody<{ domain?: string }>(req);
  if ("error" in parsed) return parsed.error;
  const domain = normalizeDomain(parsed.body.domain ?? "");
  if (!DOMAIN_RE.test(domain)) {
    return apiError(
      "INVALID_DOMAIN",
      "Enter a valid domain, e.g. yourname.com.",
    );
  }
  if (domain.endsWith(".dreamysuite.com")) {
    return apiError(
      "RESERVED_DOMAIN",
      "That's a DreamySuite subdomain — every site already has one automatically.",
    );
  }

  // Don't let two sites claim the same domain.
  const taken = await env.DB.prepare(
    "SELECT id FROM site WHERE customDomain = ? AND id != ?",
  )
    .bind(domain, siteId)
    .first<{ id: string }>();
  if (taken) {
    return apiError(
      "DOMAIN_TAKEN",
      "That domain is already connected to another site.",
      409,
    );
  }

  const created = await createCustomHostname(env, domain);
  if (!created.ok) {
    return apiError("CLOUDFLARE_ERROR", created.error, 502);
  }

  await env.DB.prepare(
    "UPDATE site SET customDomain = ?, updatedAt = ? WHERE id = ?",
  )
    .bind(domain, Date.now(), siteId)
    .run();

  return NextResponse.json({
    domain,
    cnameTarget: CNAME_TARGET,
    status: created.data.status,
    sslStatus: created.data.sslStatus,
  });
}

// DELETE — disconnect the custom domain.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const env = await getEnv();
  const { id: siteId } = await params;
  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const row = await getSiteDomain(env, siteId);
  const domain = row?.customDomain ?? null;
  if (domain) {
    const found = await findCustomHostname(env, domain);
    if (found.ok && found.data) {
      await deleteCustomHostname(env, found.data.id); // best-effort
    }
    await env.DB.prepare(
      "UPDATE site SET customDomain = NULL, updatedAt = ? WHERE id = ?",
    )
      .bind(Date.now(), siteId)
      .run();
  }
  return NextResponse.json({ domain: null });
}
