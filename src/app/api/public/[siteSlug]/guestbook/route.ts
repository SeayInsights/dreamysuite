import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { isRateLimited } from "@/lib/rateLimit";
import { safeJsonParse } from "@/lib/validation";

// Public guest book endpoints — no auth required so site visitors can sign and read.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteSlug: string }> },
) {
  const env = await getEnv();
  const { siteSlug } = await params;

  // Look up the site by slug
  const site = await env.DB
    .prepare("SELECT id FROM site WHERE slug = ? AND status = 'published'")
    .bind(siteSlug)
    .first<{ id: string }>();

  if (!site) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Site not found" } },
      { status: 404 }
    );
  }

  try {
    const result = await env.DB
      .prepare(
        "SELECT id, data, created_at FROM submission WHERE site_id = ? AND submission_type = 'guestbook' AND status = 'approved' ORDER BY created_at DESC LIMIT 100",
      )
      .bind(site.id)
      .all<{ id: string; data: string; created_at: number }>();

    // Transform submissions to extract name/message from data JSON
    const entries = result.results.map((row) => {
      const data = safeJsonParse<{ name: string; message: string }>(row.data, { name: "", message: "" });
      return {
        id: row.id,
        name: data.name,
        message: data.message,
        createdAt: row.created_at,
      };
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("[GUESTBOOK] Database error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to load entries" } },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteSlug: string }> },
) {
  const env = await getEnv();

  // Rate limit: 5 requests per 600 s per IP on guestbook
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  if (await isRateLimited(env.KV, `guestbook:${ip}`, 5, 600)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { siteSlug } = await params;

  // Look up the site by slug
  const site = await env.DB
    .prepare("SELECT id FROM site WHERE slug = ? AND status = 'published'")
    .bind(siteSlug)
    .first<{ id: string }>();

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
  if (name.trim().length > 100) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "name must be 100 characters or less" } }, { status: 400 });
  if (message.trim().length > 2000) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "message must be 2000 characters or less" } }, { status: 400 });

  const id = crypto.randomUUID();
  const now = Date.now();

  try {
    await env.DB
      .prepare(
        "INSERT INTO submission (id, site_id, contact_id, submission_type, data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        id,
        site.id,
        null, // contact_id is null for anonymous guest book entries
        'guestbook',
        JSON.stringify({ name: name.trim(), message: message.trim() }),
        'approved',
        now,
        now
      )
      .run();

    return NextResponse.json(
      { entry: { id, name: name.trim(), message: message.trim(), createdAt: now } },
      { status: 201 },
    );
  } catch (error) {
    console.error("[GUESTBOOK] Database error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to save entry" } },
      { status: 500 }
    );
  }
}
