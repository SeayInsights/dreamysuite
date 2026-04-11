import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.canva.import";
import "~/lib/context";

interface CanvaConnection {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function refreshToken(
  conn: CanvaConnection,
  env: Route.ActionArgs["context"]["cloudflare"]["env"]
): Promise<string> {
  const res = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: conn.refreshToken,
      client_id: env.CANVA_CLIENT_ID,
      client_secret: env.CANVA_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error("Token refresh failed");
  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  const now = Date.now();
  await env.DB
    .prepare("UPDATE canva_connection SET accessToken = ?, refreshToken = ?, expiresAt = ?, updatedAt = ? WHERE userId = ?")
    .bind(data.access_token, data.refresh_token, now + data.expires_in * 1000, now, conn.userId)
    .run();
  return data.access_token;
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const env = context.cloudflare.env;
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return jsonResponse({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, 401);

  if (request.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
  }

  const siteId = params.id;
  const site = await env.DB
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string }>();
  if (!site) return jsonResponse({ error: { code: "FORBIDDEN", message: "Site not found" } }, 403);

  let body: { designId?: string };
  try {
    body = await request.json() as { designId?: string };
  } catch {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, 400);
  }

  const { designId } = body;
  if (!designId) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "designId is required" } }, 400);
  }

  const conn = await env.DB
    .prepare("SELECT * FROM canva_connection WHERE userId = ?")
    .bind(session.user.id)
    .first<CanvaConnection>();
  if (!conn) {
    return jsonResponse({ error: { code: "NOT_CONNECTED", message: "Canva is not connected" } }, 400);
  }

  let accessToken = conn.accessToken;
  if (conn.expiresAt - Date.now() < 5 * 60 * 1000) {
    try {
      accessToken = await refreshToken(conn, env);
    } catch {
      return jsonResponse({ error: { code: "TOKEN_ERROR", message: "Failed to refresh Canva token" } }, 500);
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
    return jsonResponse({ error: { code: "EXPORT_FAILED", message: "Failed to start Canva export" } }, 500);
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
    return jsonResponse({ error: { code: "EXPORT_TIMEOUT", message: "Design export timed out or failed" } }, 500);
  }

  // Download exported image
  const imageRes = await fetch(exportUrls[0]);
  if (!imageRes.ok) {
    return jsonResponse({ error: { code: "DOWNLOAD_FAILED", message: "Failed to download exported design" } }, 500);
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

  return jsonResponse({ photo }, 201);
}
