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

  const existing = await env.DB.prepare("SELECT firstName, lastName FROM guest WHERE siteId = ?").bind(siteId).all<{ firstName: string; lastName: string | null }>();
  const seen = new Set(existing.results.map(g => `${g.firstName.toLowerCase()}|${(g.lastName ?? "").toLowerCase()}`));

  const maxRow = await env.DB.prepare("SELECT COALESCE(MAX(sortOrder), -1) as m FROM guest WHERE siteId = ?").bind(siteId).first<{ m: number }>();
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
    const key = `${fn.toLowerCase()}|${(ln ?? "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    toInsert.push({ ...f, _id: crypto.randomUUID(), _ln: ln, _fn: fn, _order: nextOrder++ });
  }

  if (toInsert.length > 0) {
    const g = (f: Row, k: string) => (f[k] as unknown) ?? null;
    const stmts = toInsert.map(f =>
      env.DB.prepare(
        "INSERT INTO guest (id,siteId,firstName,lastName,party,rsvpStatus,notes,address,phone,email,invitedBy,category,invited,ceremonyOrReception,invitationType,tableNumber,giftDescription,thankYouSent,sortOrder,createdAt,updatedAt) VALUES (?,?,?,?,?,'pending',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
      ).bind(g(f,"_id"),siteId,g(f,"_fn"),g(f,"_ln"),null,g(f,"notes"),g(f,"address"),g(f,"phone"),g(f,"email"),g(f,"invitedBy"),g(f,"category"),g(f,"invited"),g(f,"ceremonyOrReception"),g(f,"invitationType"),g(f,"tableNumber"),g(f,"giftDescription"),g(f,"thankYouSent"),g(f,"_order"),now,now)
    );
    await env.DB.batch(stmts);
  }

  return NextResponse.json({ imported: toInsert.length, skipped: (rows as unknown[]).length - toInsert.length });
}
