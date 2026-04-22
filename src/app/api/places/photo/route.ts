import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    return new Response("API key not configured", { status: 500 });
  }

  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) {
    return new Response("Missing photo_reference", { status: 400 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${encodeURIComponent(ref)}&key=${apiKey}`;
    const upstream = await fetch(url, { redirect: "follow" });
    if (!upstream.ok) {
      return new Response("Photo fetch failed", { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Photo proxy error", { status: 500 });
  }
}
