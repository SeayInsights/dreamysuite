import { NextRequest } from "next/server";

export const runtime = "edge";

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
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&key=${apiKey}`;
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return Response.json({ error: "Upstream Places API error" }, { status: 502 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await upstream.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const predictions = (raw.predictions ?? []).slice(0, 5).map((p: any) => ({
      place_id: p.place_id,
      description: p.description,
      structured_formatting: p.structured_formatting,
    }));

    return Response.json({ predictions });
  } catch {
    return Response.json({ error: "Places search failed" }, { status: 500 });
  }
}
