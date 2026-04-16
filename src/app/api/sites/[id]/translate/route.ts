import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth, type Env } from "@/app/lib/auth.server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env: rawEnv } = await getCloudflareContext({ async: true });
  const env = rawEnv as unknown as Env;
  const { id: siteId } = await params;

  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = env.DB;

  const site = await db.prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id).first() as { id: string } | null;
  if (!site) {
    const invite = await db.prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
      .bind(siteId, session.user.email.toLowerCase()).first() as { id: string } | null;
    if (!invite) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  let body: { fromLang: string; toLang: string; content: Record<string, Record<string, string>> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { fromLang, toLang, content } = body;
  if (!fromLang || !toLang || !content) {
    return NextResponse.json({ error: "Missing fromLang, toLang, or content" }, { status: 400 });
  }

  type FieldEntry = { blockId: string; field: string; text: string };
  const entries: FieldEntry[] = [];
  for (const [blockId, fields] of Object.entries(content)) {
    for (const [field, text] of Object.entries(fields)) {
      if (text && text.trim()) entries.push({ blockId, field, text });
    }
  }

  if (entries.length === 0) return NextResponse.json({ translations: {} });

  const langPair = `${fromLang}|${toLang}`;
  const translations: Record<string, Record<string, string>> = {};

  const email = (env as unknown as Record<string, string>).MYMEMORY_EMAIL ?? "";

  for (const entry of entries) {
    try {
      const qs = new URLSearchParams({ q: entry.text, langpair: langPair });
      if (email) qs.set("de", email);
      const res = await fetch(`https://api.mymemory.translated.net/get?${qs}`);
      const data = await res.json() as { responseData?: { translatedText?: string }; responseStatus?: number };
      const translated = data.responseData?.translatedText ?? "";
      // MyMemory returns its rate-limit warning as the translated text
      if (translated.startsWith("MYMEMORY WARNING") || data.responseStatus === 429) {
        return NextResponse.json({ error: "Daily translation limit reached. Try again tomorrow, or add a MYMEMORY_EMAIL env variable for a higher quota." }, { status: 429 });
      }
      if (translated) {
        if (!translations[entry.blockId]) translations[entry.blockId] = {};
        translations[entry.blockId][entry.field] = translated;
      }
    } catch { /* skip individual field */ }
  }

  return NextResponse.json({ translations });
}
