import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/app/lib/auth.server";

// Public guest book endpoints — no auth required so site visitors can sign and read.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const result = await env.DB
    .prepare(
      "SELECT id, name, message, createdAt FROM guest_book_entry WHERE siteId = ? ORDER BY createdAt DESC LIMIT 100",
    )
    .bind(siteId)
    .all();

  return NextResponse.json({ entries: result.results });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  // Verify site exists
  const site = await env.DB
    .prepare("SELECT id FROM site WHERE id = ?")
    .bind(siteId)
    .first();
  if (!site) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Site not found" } },
      { status: 404 },
    );
  }

  let body: { name?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 },
    );
  }

  const { name, message } = body;
  if (!name?.trim()) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "name is required" } },
      { status: 400 },
    );
  }
  if (!message?.trim()) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "message is required" } },
      { status: 400 },
    );
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  await env.DB
    .prepare(
      "INSERT INTO guest_book_entry (id, siteId, name, message, createdAt) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(id, siteId, name.trim(), message.trim(), now)
    .run();

  return NextResponse.json(
    { entry: { id, name: name.trim(), message: message.trim(), createdAt: now } },
    { status: 201 },
  );
}
