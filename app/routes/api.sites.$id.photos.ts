import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.photos";
import "~/lib/context";

async function requireSiteOwnership(
  request: Request,
  context: Route.LoaderArgs["context"],
  siteId: string
) {
  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return { error: { code: "UNAUTHORIZED", message: "Not authenticated" }, status: 401 as const };
  }
  const site = await context.cloudflare.env.DB
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string }>();
  if (!site) {
    return { error: { code: "FORBIDDEN", message: "Site not found or access denied" }, status: 403 as const };
  }
  return { userId: session.user.id };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const siteId = params.id;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  const result = await context.cloudflare.env.DB
    .prepare("SELECT * FROM photo WHERE siteId = ? ORDER BY sortOrder ASC, createdAt DESC")
    .bind(siteId)
    .all();

  return jsonResponse({ photos: result.results });
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const siteId = params.id;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  if (request.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "Multipart form data required" } }, 400);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "Failed to parse form data" } }, 400);
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "file field is required" } }, 400);
  }

  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "Unsupported file type" } }, 400);
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_SIZE) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "File exceeds 10 MB limit" } }, 400);
  }

  const id = crypto.randomUUID();
  const r2Key = `sites/${siteId}/${id}/${file.name}`;
  const now = Date.now();

  try {
    const arrayBuffer = await file.arrayBuffer();
    await context.cloudflare.env.R2.put(r2Key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });
  } catch (err) {
    console.error("[api.sites.$id.photos POST r2]", err instanceof Error ? err.message : String(err));
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message: "Failed to upload file" } }, 500);
  }

  const maxOrder = await context.cloudflare.env.DB
    .prepare("SELECT COALESCE(MAX(sortOrder), -1) as maxOrder FROM photo WHERE siteId = ?")
    .bind(siteId)
    .first<{ maxOrder: number }>();

  const sortOrder = (maxOrder?.maxOrder ?? -1) + 1;

  try {
    await context.cloudflare.env.DB
      .prepare(
        "INSERT INTO photo (id, siteId, r2Key, filename, mimeType, size, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(id, siteId, r2Key, file.name, file.type, file.size, sortOrder, now)
      .run();
  } catch (err) {
    // Best-effort cleanup of R2 object on DB failure
    await context.cloudflare.env.R2.delete(r2Key).catch(() => undefined);
    console.error("[api.sites.$id.photos POST db]", err instanceof Error ? err.message : String(err));
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message: "Failed to save photo record" } }, 500);
  }

  const photo = await context.cloudflare.env.DB
    .prepare("SELECT * FROM photo WHERE id = ?")
    .bind(id)
    .first();

  return jsonResponse({ photo }, 201);
}
