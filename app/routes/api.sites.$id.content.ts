import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.content";
import "~/lib/context";

async function requireSiteOwnership(
  request: Request,
  context: Route.LoaderArgs["context"],
  siteId: string
) {
  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return { error: { code: "UNAUTHORIZED", message: "Not authenticated" }, status: 401 as const };
  }
  const _db = context.cloudflare.env.DB;
  const site = await _db
    .prepare("SELECT id FROM site WHERE id = ? AND userId = ?")
    .bind(siteId, session.user.id)
    .first<{ id: string }>();
  if (site) return { userId: session.user.id };
  const invite = await _db
    .prepare("SELECT id FROM site_invite WHERE siteId = ? AND email = ?")
    .bind(siteId, session.user.email.toLowerCase())
    .first<{ id: string }>();
  if (invite) return { userId: session.user.id };
  return { error: { code: "FORBIDDEN", message: "Site not found or access denied" }, status: 403 as const };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const siteId = params.id;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  const result = await context.cloudflare.env.DB
    .prepare("SELECT pageSlug, lang, content FROM site_content WHERE siteId = ? ORDER BY pageSlug ASC, lang ASC")
    .bind(siteId)
    .all<{ pageSlug: string; lang: string; content: string }>();

  const rows = result.results.map((row) => {
    let parsed: unknown = {};
    try { parsed = JSON.parse(row.content); } catch { /* keep empty */ }
    return { pageSlug: row.pageSlug, lang: row.lang, content: parsed };
  });

  return jsonResponse({ content: rows });
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const siteId = params.id;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  if (request.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
  }

  let body: { pageSlug?: string; lang?: string; content?: unknown };
  try {
    body = await request.json() as { pageSlug?: string; lang?: string; content?: unknown };
  } catch {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "Invalid JSON" } }, 400);
  }

  const { pageSlug, lang, content } = body;
  if (!pageSlug || !lang) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "pageSlug and lang are required" } }, 400);
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  const contentStr = JSON.stringify(content ?? {});

  await context.cloudflare.env.DB
    .prepare(`
      INSERT INTO site_content (id, siteId, pageSlug, lang, content, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (siteId, pageSlug, lang) DO UPDATE SET
        content = excluded.content,
        updatedAt = excluded.updatedAt
    `)
    .bind(id, siteId, pageSlug, lang, contentStr, now)
    .run();

  return jsonResponse({ ok: true });
}
