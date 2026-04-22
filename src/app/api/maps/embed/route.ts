import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    return new Response("API key not configured", { status: 500 });
  }

  const placeId = req.nextUrl.searchParams.get("placeId");
  if (!placeId) {
    return new Response("Missing placeId", { status: 400 });
  }

  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${encodeURIComponent(placeId)}`;
  return Response.redirect(embedUrl, 302);
}
