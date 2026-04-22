import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("[PlacesDetails] Route hit");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  console.log("[PlacesDetails] GOOGLE_API_KEY defined:", !!apiKey);
  if (!apiKey) {
    return Response.json({ error: "Google API key not configured" }, { status: 500 });
  }

  const placeId = req.nextUrl.searchParams.get("placeId");
  console.log("[PlacesDetails] Query param placeId:", placeId);
  if (!placeId) {
    return Response.json({ error: "Missing query parameter: placeId" }, { status: 400 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,geometry,photos,rating&key=${apiKey}`;
    console.log("[PlacesDetails] Google API URL:", url.replace(apiKey, "REDACTED"));
    const upstream = await fetch(url);
    console.log("[PlacesDetails] Google response status:", upstream.status);
    const rawText = await upstream.text();
    console.log("[PlacesDetails] Google raw response body:", rawText);
    if (!upstream.ok) {
      return Response.json({ error: "Upstream Places API error" }, { status: 502 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = JSON.parse(rawText);
    const r = raw.result;
    if (!r) {
      return Response.json({ error: "No result from Places API" }, { status: 404 });
    }

    const response = Response.json({
      result: {
        name: r.name,
        rating: r.rating,
        geometry: r.geometry ? { location: r.geometry.location } : undefined,
        photo: r.photos?.[0]?.photo_reference,
      },
    });
    console.log("[PlacesDetails] Response CORS headers:", Object.fromEntries(response.headers.entries()));
    return response;
  } catch (err) {
    console.error("[PlacesDetails] Caught error:", err);
    return Response.json({ error: "Places details failed" }, { status: 500 });
  }
}
