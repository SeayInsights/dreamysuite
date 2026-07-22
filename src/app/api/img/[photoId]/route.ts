import { NextRequest } from "next/server";
import { getEnv } from "@/lib/cloudflare";

/**
 * Public, optimized image delivery for published sites.
 *
 * The owner route (/api/sites/[id]/photos/[photoId]) requires site ownership, so
 * published-site images 401 for real guests. This route serves a photo by its
 * (unguessable) id with NO auth — images on an event site are meant to be seen —
 * and transcodes raster photos to WebP via the Images binding to cut payload.
 * Output is immutable + long-cached, so the transform runs once then serves from
 * the edge cache.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> },
) {
  const env = await getEnv();
  const { photoId } = await params;

  const photo = await env.DB.prepare(
    "SELECT r2Key, mimeType FROM photo WHERE id = ?",
  )
    .bind(photoId)
    .first<{ r2Key: string; mimeType: string }>();
  if (!photo) return new Response("Not found", { status: 404 });

  const object = await env.R2.get(photo.r2Key);
  if (!object) return new Response("Not found", { status: 404 });

  const CACHE = "public, max-age=31536000, immutable";
  const mime = photo.mimeType || "image/jpeg";
  const transcodable = mime === "image/jpeg" || mime === "image/png";

  // Transcode photographic formats to WebP; leave webp/gif/svg untouched.
  if (transcodable) {
    try {
      const result = await env.IMAGES.input(object.body).output({
        format: "image/webp",
      });
      const res = result.response();
      const headers = new Headers();
      headers.set("content-type", "image/webp");
      headers.set("cache-control", CACHE);
      return new Response(res.body, { status: 200, headers });
    } catch (err) {
      console.error("[img] webp transcode failed; serving original", err);
      // The stream may be consumed — re-fetch for the raw fallback.
      const fresh = await env.R2.get(photo.r2Key);
      if (!fresh) return new Response("Not found", { status: 404 });
      const headers = new Headers();
      headers.set("content-type", mime);
      headers.set("cache-control", CACHE);
      return new Response(fresh.body, { headers });
    }
  }

  const headers = new Headers();
  headers.set("content-type", mime);
  headers.set("cache-control", CACHE);
  return new Response(object.body, { headers });
}
