import { NextRequest } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { isRateLimited } from "@/lib/rateLimit";
import { safeJsonParse } from "@/lib/validation";
import { GoogleTextSearchResponse } from "@/lib/schemas/places";

export async function GET(req: NextRequest) {
  const env = await getEnv();
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  if (await isRateLimited(env.KV, `places-search:${ip}`, 30, 60)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Google API key not configured" },
      { status: 500 },
    );
  }

  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return Response.json(
      { error: "Missing query parameter: q" },
      { status: 400 },
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${apiKey}`;
    const upstream = await fetch(url);
    const rawText = await upstream.text();
    if (!upstream.ok) {
      return Response.json(
        { error: "Upstream Places API error" },
        { status: 502 },
      );
    }

    const parsed = GoogleTextSearchResponse.safeParse(
      safeJsonParse<unknown>(rawText, {}),
    );
    const rawResults = parsed.success ? parsed.data.results : [];
    const results = rawResults.slice(0, 5).map((r) => ({
      place_id: r.place_id,
      name: r.name,
      formatted_address: r.formatted_address,
      geometry: r.geometry?.location
        ? { location: r.geometry.location }
        : undefined,
    }));

    return Response.json({ results });
  } catch (err) {
    console.error("[PlacesSearch] Caught error:", err);
    return Response.json({ error: "Places search failed" }, { status: 500 });
  }
}
