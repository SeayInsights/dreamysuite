import { createAuth } from "~/lib/auth.server";
import "~/lib/context";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function action({ request, context, params }: { request: Request; context: any; params: Record<string, string> }) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return jsonResponse({ error: "Unauthorized" }, 401);

  const db = context.cloudflare.env.DB;
  const siteId = params.id;

  const site = await db.prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id).first<{ id: string }>();
  if (!site) {
    const invite = await db.prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
      .bind(siteId, session.user.email.toLowerCase()).first<{ id: string }>();
    if (!invite) return jsonResponse({ error: "Access denied" }, 403);
  }

  let body: { fromLang: string; toLang: string; content: Record<string, Record<string, string>> };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const { fromLang, toLang, content } = body;
  if (!fromLang || !toLang || !content) {
    return jsonResponse({ error: "Missing fromLang, toLang, or content" }, 400);
  }

  type FieldEntry = { blockId: string; field: string; text: string };
  const entries: FieldEntry[] = [];
  for (const [blockId, fields] of Object.entries(content)) {
    for (const [field, text] of Object.entries(fields)) {
      if (text && text.trim()) entries.push({ blockId, field, text });
    }
  }

  if (entries.length === 0) return jsonResponse({ translations: {} });

  const langPair = `${fromLang}|${toLang}`;
  const translations: Record<string, Record<string, string>> = {};

  for (const entry of entries) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(entry.text)}&langpair=${encodeURIComponent(langPair)}`;
      const res = await fetch(url);
      const data = await res.json() as { responseData?: { translatedText?: string } };
      const translated = data.responseData?.translatedText;
      if (translated) {
        if (!translations[entry.blockId]) translations[entry.blockId] = {};
        translations[entry.blockId][entry.field] = translated;
      }
    } catch { /* skip */ }
  }

  return jsonResponse({ translations });
}
