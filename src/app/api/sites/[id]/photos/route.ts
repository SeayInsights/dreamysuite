import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "@/app/lib/auth.server";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const result = await env.DB
    .prepare("SELECT * FROM photo WHERE siteId = ? ORDER BY sortOrder ASC, createdAt DESC")
    .bind(siteId)
    .all();

  return NextResponse.json({ photos: result.results });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Multipart form data required" } }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Failed to parse form data" } }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "file field is required" } }, { status: 400 });
  }

  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Unsupported file type" } }, { status: 400 });
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "File exceeds 10 MB limit" } }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const r2Key = `sites/${siteId}/${id}/${file.name}`;
  const now = Date.now();

  try {
    const arrayBuffer = await file.arrayBuffer();
    await env.R2.put(r2Key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });
  } catch (err) {
    console.error("[api/sites/[id]/photos POST r2]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to upload file" } }, { status: 500 });
  }

  const maxOrder = await env.DB
    .prepare("SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM photo WHERE siteId = ?")
    .bind(siteId)
    .first<{ maxOrder: number }>();

  const sortOrder = (maxOrder?.maxOrder ?? -1) + 1;

  try {
    await env.DB
      .prepare(
        "INSERT INTO photo (id, siteId, r2Key, filename, mimeType, size, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(id, siteId, r2Key, file.name, file.type, file.size, sortOrder, now)
      .run();
  } catch (err) {
    // Best-effort cleanup of R2 object on DB failure
    await env.R2.delete(r2Key).catch(() => undefined);
    console.error("[api/sites/[id]/photos POST db]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to save photo record" } }, { status: 500 });
  }

  const photo = await env.DB
    .prepare("SELECT * FROM photo WHERE id = ?")
    .bind(id)
    .first();

  return NextResponse.json({ photo }, { status: 201 });
}
