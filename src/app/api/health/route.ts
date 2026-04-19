export const runtime = "edge";

export function GET() {
  return Response.json({ ok: true, timestamp: new Date().toISOString() });
}
