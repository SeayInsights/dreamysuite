import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { getSession } from "@/lib/api/get-session";
import { isRateLimited } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    return new Response("API key not configured", { status: 500 });
  }

  const env = await getEnv();

  const session = await getSession(req.headers, env);
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  if (await isRateLimited(env.KV, `maps:${session.user.id}`, 30, 60)) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429 },
    );
  }

  const placeId = req.nextUrl.searchParams.get("placeId");
  if (!placeId) {
    return new Response("Missing placeId", { status: 400 });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(placeId)) {
    return new Response("Invalid placeId format", { status: 400 });
  }

  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${encodeURIComponent(placeId)}`;
  return Response.redirect(embedUrl, 302);
}
