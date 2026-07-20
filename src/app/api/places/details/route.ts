import { NextRequest } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { isRateLimited } from "@/lib/rateLimit";
import { safeJsonParse } from "@/lib/validation";
import { GoogleDetailsResponse } from "@/lib/schemas/places";

export async function GET(req: NextRequest) {
  const env = await getEnv();
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  if (await isRateLimited(env.KV, `places-details:${ip}`, 30, 60)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Google API key not configured" },
      { status: 500 },
    );
  }

  const placeId = req.nextUrl.searchParams.get("placeId");
  if (!placeId) {
    return Response.json(
      { error: "Missing query parameter: placeId" },
      { status: 400 },
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,geometry,photos,rating&key=${apiKey}`;
    const upstream = await fetch(url);
    const rawText = await upstream.text();
    if (!upstream.ok) {
      return Response.json(
        { error: "Upstream Places API error" },
        { status: 502 },
      );
    }

    const parsed = GoogleDetailsResponse.safeParse(
      safeJsonParse<unknown>(rawText, {}),
    );
    const r = parsed.success ? parsed.data.result : undefined;
    if (!r) {
      return Response.json(
        { error: "No result from Places API" },
        { status: 404 },
      );
    }

    return Response.json({
      result: {
        name: r.name,
        rating: r.rating,
        geometry: r.geometry?.location
          ? { location: r.geometry.location }
          : undefined,
        photo: r.photos?.[0]?.photo_reference,
        photoRefs: (r.photos ?? []).slice(0, 5).map((p) => p.photo_reference),
      },
    });
  } catch (err) {
    console.error("[PlacesDetails] Caught error:", err);
    return Response.json({ error: "Places details failed" }, { status: 500 });
  }
}
