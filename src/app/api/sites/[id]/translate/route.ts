import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";
import { isRateLimited } from "@/lib/rateLimit";

const MAX_CHUNK = 400;

function splitIntoChunks(text: string): string[] {
  if (text.length <= MAX_CHUNK) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > MAX_CHUNK) {
    let splitAt = -1;

    for (const sep of ["\n", ". ", "! ", "? ", ", "]) {
      const idx = remaining.lastIndexOf(sep, MAX_CHUNK);
      if (idx > 0) {
        splitAt = idx + sep.length;
        break;
      }
    }

    if (splitAt <= 0) {
      const spaceIdx = remaining.lastIndexOf(" ", MAX_CHUNK);
      splitAt = spaceIdx > 0 ? spaceIdx + 1 : MAX_CHUNK;
    }

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

type MyMemoryResponse = {
  responseData?: { translatedText?: string };
  responseStatus?: number;
};

async function translateText(
  text: string,
  langPair: string,
  email: string
): Promise<{ translated: string; rateLimited: boolean }> {
  const chunks = splitIntoChunks(text);

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const qs = new URLSearchParams({ q: chunk, langpair: langPair });
      if (email) qs.set("de", email);
      const res = await fetch(`https://api.mymemory.translated.net/get?${qs}`);
      const data = (await res.json()) as MyMemoryResponse;
      const translated = data.responseData?.translatedText ?? "";

      if (translated.startsWith("MYMEMORY WARNING") || data.responseStatus === 429) {
        return { translated: "", rateLimited: true };
      }
      return { translated, rateLimited: false };
    })
  );

  if (results.some((r) => r.rateLimited)) {
    return { translated: "", rateLimited: true };
  }

  return { translated: results.map((r) => r.translated).join(""), rateLimited: false };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const env = await getEnv();
  const { id: siteId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  if (await isRateLimited(env.KV, `translate:${siteId}`, 10, 60)) {
    return NextResponse.json({ error: "Too many translate requests — try again in a minute" }, { status: 429 });
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
      const result = await translateText(entry.text, langPair, email);
      if (result.rateLimited) {
        return NextResponse.json({ error: "Daily translation limit reached. Try again tomorrow, or add a MYMEMORY_EMAIL env variable for a higher quota." }, { status: 429 });
      }
      if (result.translated) {
        if (!translations[entry.blockId]) translations[entry.blockId] = {};
        translations[entry.blockId][entry.field] = result.translated;
      }
    } catch { /* skip individual field */ }
  }

  return NextResponse.json({ translations });
}
