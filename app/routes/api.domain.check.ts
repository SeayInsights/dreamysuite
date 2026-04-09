import type { Route } from "./+types/api.domain.check";
import { createAuth } from "~/lib/auth.server";

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

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

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

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return jsonResponse({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const domain = url.searchParams.get("domain") ?? "";
  const parsed = parseDomain(domain);

  if (!parsed) {
    return jsonResponse({ error: "Invalid domain name" }, 400);
  }

  // DNS-over-HTTPS availability check: NXDOMAIN → likely available
  let available = false;
  try {
    const dohRes = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(parsed.name)}&type=SOA`,
      { headers: { accept: "application/dns-json" } }
    );
    if (dohRes.ok) {
      const data = await dohRes.json<{ Status: number }>();
      // Status 3 = NXDOMAIN (domain does not exist → likely available)
      available = data.Status === 3;
    }
  } catch {
    return jsonResponse({ error: "Availability check failed. Please try again." }, 502);
  }

  const price = TLD_PRICES[parsed.tld] ?? null;

  return jsonResponse({
    domain: parsed.name,
    tld: parsed.tld,
    available,
    price,
    supported: price !== null,
  });
}
