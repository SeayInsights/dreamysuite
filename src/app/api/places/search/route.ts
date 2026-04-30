import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    return Response.json({ error: "Google API key not configured" }, { status: 500 });
  }

  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return Response.json({ error: "Missing query parameter: q" }, { status: 400 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${apiKey}`;
    const upstream = await fetch(url);
    const rawText = await upstream.text();
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

    return Response.json({ results });
  } catch (err) {
    console.error("[PlacesSearch] Caught error:", err);
    return Response.json({ error: "Places search failed" }, { status: 500 });
  }
}
