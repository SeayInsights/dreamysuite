import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireSiteOwnership, apiOwnershipError, parseJsonBody } from "@/lib/api/site-auth";

type Row = Record<string, unknown>;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const env = await getEnv();
  const { id: siteId } = await params;
  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const parsed = await parseJsonBody<{ rows: unknown; mapping: unknown }>(req);
  if ("error" in parsed) return parsed.error;

  const { rows, mapping } = parsed.body;
  if (!Array.isArray(rows) || typeof mapping !== "object" || mapping === null) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "rows must be an array and mapping must be an object" } }, { status: 400 });
  }

  // Get existing contacts to avoid duplicates
  const existing = await env.DB.prepare("SELECT name FROM contact WHERE site_id = ? AND contact_type = 'guest'").bind(siteId).all<{ name: string }>();
  const seen = new Set(existing.results.map(c => c.name.toLowerCase()));

  // Get max sortOrder
  const maxRow = await env.DB.prepare("SELECT COALESCE(MAX(CAST(json_extract(metadata, '$.sortOrder') AS INTEGER)), -1) as m FROM contact WHERE site_id = ? AND contact_type = 'guest'").bind(siteId).first<{ m: number }>();
  let nextOrder = (maxRow?.m ?? -1) + 1;
  const now = Date.now();
  const map = mapping as Record<string, string>;

  const toInsert: Row[] = [];
  for (const raw of rows as Row[]) {
    const f: Row = {};
    for (const [col, field] of Object.entries(map)) {
      const val = raw[col];
      if (val == null) continue;
      if (field === "firstName" && typeof val === "string" && val.includes(" ")) {
        const sp = val.indexOf(" ");
        f.firstName = val.slice(0, sp);
        f.lastName = val.slice(sp + 1);
      } else {
        f[field] = val;
      }
    }
    const fn = f.firstName as string | undefined;
    if (!fn) continue;
    const ln = (f.lastName as string | undefined) ?? null;
    const name = `${fn}${ln ? ' ' + ln : ''}`;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    toInsert.push({ ...f, _id: crypto.randomUUID(), _name: name, _order: nextOrder++ });
  }

  if (toInsert.length > 0) {
    const g = (f: Row, k: string) => (f[k] as unknown) ?? null;
    const stmts = toInsert.map(f => {
      const metadata = JSON.stringify({
        rsvpStatus: 'pending',
        party: null,
        notes: g(f, "notes"),
        address: g(f, "address"),
        invitedBy: g(f, "invitedBy"),
        category: g(f, "category"),
        invited: g(f, "invited") ?? 0,
        ceremonyOrReception: g(f, "ceremonyOrReception") ?? 'both',
        invitationType: g(f, "invitationType") ?? 'digital',
        tableNumber: g(f, "tableNumber"),
        giftDescription: g(f, "giftDescription"),
        thankYouSent: g(f, "thankYouSent") ?? 0,
        sortOrder: g(f, "_order"),
      });

      return env.DB.prepare(
        "INSERT INTO contact (id, site_id, name, email, phone, contact_type, metadata, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'guest', ?, 'active', ?, ?)"
      ).bind(g(f, "_id"), siteId, g(f, "_name"), g(f, "email"), g(f, "phone"), metadata, now, now);
    });
    await env.DB.batch(stmts);
  }

  return NextResponse.json({ imported: toInsert.length, skipped: (rows as unknown[]).length - toInsert.length });
}
