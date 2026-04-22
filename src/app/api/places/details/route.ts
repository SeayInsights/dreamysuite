import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Google API key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("placeId");
  if (!placeId) {
    return NextResponse.json({ error: "Missing query parameter: placeId" }, { status: 400 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,geometry,photos,rating");
  url.searchParams.set("key", apiKey);

  const upstream = await fetch(url.toString());
  if (!upstream.ok) {
    return NextResponse.json({ error: "Upstream Places API error" }, { status: 502 });
  }

  const data = await upstream.json();
  return NextResponse.json(data);
}
