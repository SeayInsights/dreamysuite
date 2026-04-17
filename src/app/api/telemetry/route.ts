import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/app/lib/auth.server";

interface TelemetryEvent {
  name: string;
  ts: number;
  siteId?: string;
  props?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;

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
  const stmt = db.prepare(
    `INSERT INTO editor_event (name, siteId, props, clientTs, serverTs)
     VALUES (?, ?, ?, ?, ?)`,
  );

  const now = Date.now();
  const batch = events.map((e) =>
    stmt.bind(
      String(e.name).slice(0, 64),
      e.siteId ?? null,
      e.props ? JSON.stringify(e.props) : null,
      e.ts ?? now,
      now,
    ),
  );

  try {
    await db.batch(batch);
  } catch {
    return NextResponse.json({ error: "db write failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
