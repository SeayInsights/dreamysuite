import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";
import { type CanvaConnection, refreshCanvaToken } from "@/lib/api/canva";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  let body: { designId?: string };
  try {
    body = await req.json() as { designId?: string };
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, { status: 400 });
  }

  const { designId } = body;
  if (!designId || !/^[A-Za-z0-9_-]{8,64}$/.test(designId)) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid design ID" } }, { status: 400 });
  }

  const conn = await env.DB
    .prepare("SELECT * FROM canva_connection WHERE userId = ?")
    .bind(check.userId)
    .first<CanvaConnection>();
  if (!conn) {
    return NextResponse.json({ error: { code: "NOT_CONNECTED", message: "Canva is not connected" } }, { status: 400 });
  }

  let accessToken = conn.accessToken;
  if (conn.expiresAt - Date.now() < 5 * 60 * 1000) {
    const lockKey = `canva_refresh_lock:${check.userId}`;
    const locked = await env.KV.get(lockKey);
    if (locked) {
      await new Promise<void>((r) => setTimeout(r, 500));
      const fresh = await env.DB
        .prepare("SELECT accessToken FROM canva_connection WHERE userId = ?")
        .bind(check.userId)
        .first<{ accessToken: string }>();
      if (fresh) accessToken = fresh.accessToken;
    } else {
      await env.KV.put(lockKey, "1", { expirationTtl: 30 });
      try {
        accessToken = await refreshCanvaToken(conn, env);
      } catch {
        await env.KV.delete(lockKey);
        return NextResponse.json({ error: { code: "TOKEN_ERROR", message: "Failed to refresh Canva token" } }, { status: 500 });
      }
      await env.KV.delete(lockKey);
    }
  }

  // Create export job
  const exportRes = await fetch("https://api.canva.com/rest/v1/exports", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      design_id: designId,
      format: { type: "jpg", quality: 90 },
    }),
  });

  if (!exportRes.ok) {
    console.error("[canva import] export create failed", await exportRes.text());
    return NextResponse.json({ error: { code: "EXPORT_FAILED", message: "Failed to start Canva export" } }, { status: 500 });
  }

  const exportData = await exportRes.json() as { job: { id: string; status: string } };
  const jobId = exportData.job.id;

  // Poll for completion (max 10s at 500ms intervals)
  let jobStatus = exportData.job.status;
  let exportUrls: string[] = [];
  let polls = 0;

  while (jobStatus === "in_progress" && polls < 20) {
    await new Promise<void>((r) => setTimeout(r, 500));
    const pollRes = await fetch(`https://api.canva.com/rest/v1/exports/${jobId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (pollRes.ok) {
      const pollData = await pollRes.json() as {
        job: { id: string; status: string; urls?: string[] };
      };
      jobStatus = pollData.job.status;
      if (pollData.job.urls) exportUrls = pollData.job.urls;
    }
    polls++;
  }

  if (jobStatus !== "success" || exportUrls.length === 0) {
    return NextResponse.json({ error: { code: "EXPORT_TIMEOUT", message: "Design export timed out or failed" } }, { status: 500 });
  }

  // Download exported image
  const imageRes = await fetch(exportUrls[0]);
  if (!imageRes.ok) {
    return NextResponse.json({ error: { code: "DOWNLOAD_FAILED", message: "Failed to download exported design" } }, { status: 500 });
  }
  const arrayBuffer = await imageRes.arrayBuffer();

  // Save to R2
  const photoId = crypto.randomUUID();
  const filename = `canva-${designId}.jpg`;
  const r2Key = `sites/${siteId}/${photoId}/${filename}`;
  const now = Date.now();

  await env.R2.put(r2Key, arrayBuffer, {
    httpMetadata: { contentType: "image/jpeg" },
  });

  const maxOrder = await env.DB
    .prepare("SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM photo WHERE siteId = ?")
    .bind(siteId)
    .first<{ maxOrder: number }>();
  const sortOrder = (maxOrder?.maxOrder ?? -1) + 1;

  await env.DB
    .prepare("INSERT INTO photo (id, siteId, r2Key, filename, mimeType, size, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(photoId, siteId, r2Key, filename, "image/jpeg", arrayBuffer.byteLength, sortOrder, now)
    .run();

  const photo = await env.DB
    .prepare("SELECT * FROM photo WHERE id = ?")
    .bind(photoId)
    .first();

  return NextResponse.json({ photo }, { status: 201 });
}
