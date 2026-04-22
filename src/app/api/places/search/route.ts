import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("[PlacesSearch] Route hit");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  console.log("[PlacesSearch] GOOGLE_API_KEY defined:", !!apiKey);
  if (!apiKey) {
    return Response.json({ error: "Google API key not configured" }, { status: 500 });
  }

  const q = req.nextUrl.searchParams.get("q");
  console.log("[PlacesSearch] Query param q:", q);
  if (!q) {
    return Response.json({ error: "Missing query parameter: q" }, { status: 400 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${apiKey}`;
    console.log("[PlacesSearch] Google API URL:", url.replace(apiKey, "REDACTED"));
    const upstream = await fetch(url);
    console.log("[PlacesSearch] Google response status:", upstream.status);
    const rawText = await upstream.text();
    console.log("[PlacesSearch] Google raw response body:", rawText);
    if (!upstream.ok) {
      return Response.json({ error: "Upstream Places API error" }, { status: 502 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = JSON.parse(rawText);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (raw.results ?? []).slice(0, 5).map((r: any) => ({
      place_id: r.place_id,
      name: r.name,
      formatted_address: r.formatted_address,
      geometry: r.geometry ? { location: r.geometry.location } : undefined,
    }));

    const response = Response.json({ results });
    console.log("[PlacesSearch] Response CORS headers:", Object.fromEntries(response.headers.entries()));
    return response;
  } catch (err) {
    console.error("[PlacesSearch] Caught error:", err);
    return Response.json({ error: "Places search failed" }, { status: 500 });
  }
}
