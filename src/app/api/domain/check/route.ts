import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { createAuth, type Env } from "@/app/lib/auth.server";
import { requireSiteOwnership } from "@/lib/api/site-auth";

// Cloudflare at-cost registrar pricing (USD/yr) for common TLDs
const TLD_PRICES: Record<string, number> = {
  com: 9.15,
  net: 10.95,
  org: 9.93,
  io: 32.0,
  co: 25.0,
  me: 18.75,
  us: 8.47,
  info: 11.06,
  biz: 14.37,
};

// Basic domain validation
function parseDomain(input: string): { name: string; tld: string } | null {
  const clean = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const parts = clean.split(".");
  if (parts.length < 2) return null;
  const tld = parts[parts.length - 1];
  if (!/^[a-z]{2,}$/.test(tld)) return null;
  if (parts.some((p) => !/^[a-z0-9-]+$/.test(p) || p.startsWith("-") || p.endsWith("-"))) return null;
  return { name: clean, tld };
}

export async function GET(req: NextRequest) {
  const env = await getEnv();

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const domain = url.searchParams.get("domain") ?? "";
  const siteId = url.searchParams.get("siteId");

  if (siteId) {
    const ownership = await requireSiteOwnership(req, env, siteId);
    if ("error" in ownership) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status });
    }
  }

  const parsed = parseDomain(domain);

  if (!parsed) {
    return NextResponse.json({ error: "Invalid domain name" }, { status: 400 });
  }

  // DNS-over-HTTPS availability check: NXDOMAIN → likely available
  let available = false;
  try {
    const dohRes = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(parsed.name)}&type=SOA`,
      { headers: { accept: "application/dns-json" } }
    );
    if (dohRes.ok) {
      const data = await dohRes.json() as { Status: number };
      // Status 3 = NXDOMAIN (domain does not exist → likely available)
      available = data.Status === 3;
    }
  } catch {
    return NextResponse.json({ error: "Availability check failed. Please try again." }, { status: 502 });
  }

  const price = TLD_PRICES[parsed.tld] ?? null;

  return NextResponse.json({
    domain: parsed.name,
    tld: parsed.tld,
    available,
    price,
    supported: price !== null,
  });
}
