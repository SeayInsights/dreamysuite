import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { createAuth, type Env } from "@/app/lib/auth.server";

// Client must supply siteId per event so the server can verify ownership.
// The server ignores any other siteId and re-derives it via an ownership check
// (SELECT against session.user.id) before inserting — clients cannot forge it.
interface TelemetryEvent {
  name: string;
  ts: number;
  // siteId is still accepted from the client so the batch can span one site,
  // but we ALWAYS verify it server-side before use.
  siteId?: string;
  props?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const env = await getEnv();

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { events?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return NextResponse.json({ error: "no events" }, { status: 400 });
  }

  const events = body.events as TelemetryEvent[];
  if (events.length > 50) {
    return NextResponse.json({ error: "batch too large" }, { status: 400 });
  }

  const db = env.DB;
  const now = Date.now();

  // Collect the distinct siteIds referenced in this batch and verify ownership
  // for each one server-side. Events whose siteId fails ownership are dropped.
  const clientSiteIds = [...new Set(events.map((e) => e.siteId).filter(Boolean))] as string[];

  const verifiedSiteIds = new Set<string>();
  for (const sid of clientSiteIds) {
    const owned = await db
      .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
      .bind(sid, session.user.id)
      .first<{ id: string }>();
    if (owned) verifiedSiteIds.add(sid);
  }

  // Build the batch, substituting only server-verified siteIds
  const stmt = db.prepare(
    `INSERT INTO editor_event (name, siteId, props, clientTs, serverTs)
     VALUES (?, ?, ?, ?, ?)`,
  );

  const batch = events
    .filter((e) => e.siteId === undefined || verifiedSiteIds.has(e.siteId))
    .map((e) => {
      // Use the verified siteId (or null for events with no siteId)
      const resolvedSiteId = e.siteId !== undefined && verifiedSiteIds.has(e.siteId)
        ? e.siteId
        : null;
      return stmt.bind(
        String(e.name).slice(0, 64),
        resolvedSiteId,
        e.props ? JSON.stringify(e.props) : null,
        e.ts ?? now,
        now,
      );
    });

  if (batch.length === 0) {
    return NextResponse.json({ error: "no authorized events" }, { status: 403 });
  }

  try {
    await db.batch(batch);
  } catch (err) {
    console.error("[telemetry] db.batch failed:", err);
    return NextResponse.json({ error: "db write failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
