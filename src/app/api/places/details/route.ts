import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    return Response.json({ error: "Google API key not configured" }, { status: 500 });
  }

  const placeId = req.nextUrl.searchParams.get("placeId");
  if (!placeId) {
    return Response.json({ error: "Missing query parameter: placeId" }, { status: 400 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,geometry,photos,rating&key=${apiKey}`;
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return Response.json({ error: "Upstream Places API error" }, { status: 502 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await upstream.json();
    const r = raw.result;
    if (!r) {
      return Response.json({ error: "No result from Places API" }, { status: 404 });
    }

    return Response.json({
      result: {
        name: r.name,
        rating: r.rating,
        geometry: r.geometry ? { location: r.geometry.location } : undefined,
        photo: r.photos?.[0]?.photo_reference,
      },
    });
  } catch {
    return Response.json({ error: "Places details failed" }, { status: 500 });
  }
}
