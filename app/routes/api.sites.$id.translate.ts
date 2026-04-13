import Anthropic from "@anthropic-ai/sdk";
import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.translate";
import "~/lib/context";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function action({ request, context, params }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return jsonResponse({ error: "Unauthorized" }, 401);

  const db = context.cloudflare.env.DB;
  const siteId = params.id;

  // Verify ownership or collaborator
  const site = await db.prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id).first<{ id: string }>();
  if (!site) {
    const invite = await db.prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
      .bind(siteId, session.user.email.toLowerCase()).first<{ id: string }>();
    if (!invite) return jsonResponse({ error: "Access denied" }, 403);
  }

  const apiKey = (context.cloudflare.env as Record<string, string>).ANTHROPIC_API_KEY;
  if (!apiKey) return jsonResponse({ error: "Translation not configured" }, 503);

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

  // Flatten all text fields across all blocks into one batch
  type FieldEntry = { blockId: string; field: string; text: string };
  const entries: FieldEntry[] = [];
  for (const [blockId, fields] of Object.entries(content)) {
    for (const [field, text] of Object.entries(fields)) {
      if (text && text.trim()) {
        entries.push({ blockId, field, text });
      }
    }
  }

  if (entries.length === 0) {
    return jsonResponse({ translations: {} });
  }

  const inputJson = JSON.stringify(entries.map((e, i) => ({ id: i, text: e.text })));

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    system: `You are a professional wedding website translator. Translate text from ${fromLang} to ${toLang}. Preserve formatting, names, and special characters. Return ONLY a JSON array matching the input structure, with each object having "id" and "translated" fields. No explanation, no markdown.`,
    messages: [{ role: "user", content: inputJson }],
  });

  const raw = message.content.find(b => b.type === "text")?.text ?? "[]";

  let parsed: Array<{ id: number; translated: string }>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return jsonResponse({ error: "Translation parsing failed", raw }, 500);
  }

  // Rebuild into block → field → translated map
  const translations: Record<string, Record<string, string>> = {};
  for (const result of parsed) {
    const entry = entries[result.id];
    if (!entry) continue;
    if (!translations[entry.blockId]) translations[entry.blockId] = {};
    translations[entry.blockId][entry.field] = result.translated;
  }

  return jsonResponse({ translations });
}
