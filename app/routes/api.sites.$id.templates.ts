import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.templates";
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

interface PageRow {
  id: string;
  siteId: string;
  slug: string;
  label: string;
  isVisible: number;
  isLocked: number;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

interface BlockRow {
  id: string;
  siteId: string;
  pageId: string;
  type: string;
  config: string;
  sortOrder: number;
  isVisible: number;
  createdAt: number;
  updatedAt: number;
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const siteId = params.id;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  const result = await context.cloudflare.env.DB
    .prepare("SELECT * FROM site_template WHERE siteId = ? ORDER BY createdAt DESC")
    .bind(siteId)
    .all();

  return jsonResponse({ templates: result.results });
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const siteId = params.id;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  if (request.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, 400);
  }

  if (!body.name) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "name is required" } }, 400);
  }

  // Build snapshot: all pages with their blocks
  const pagesResult = await context.cloudflare.env.DB
    .prepare("SELECT * FROM page WHERE siteId = ? ORDER BY sortOrder ASC")
    .bind(siteId)
    .all<PageRow>();

  const pages = pagesResult.results;

  const pagesWithBlocks = await Promise.all(
    pages.map(async (page) => {
      const blocksResult = await context.cloudflare.env.DB
        .prepare("SELECT * FROM block WHERE pageId = ? ORDER BY sortOrder ASC")
        .bind(page.id)
        .all<BlockRow>();
      return {
        ...page,
        blocks: blocksResult.results.map((b) => ({
          ...b,
          config: (() => { try { return JSON.parse(b.config); } catch { return {}; } })(),
        })),
      };
    })
  );

  const snapshot = JSON.stringify({ pages: pagesWithBlocks });
  const id = crypto.randomUUID();
  const now = Date.now();

  await context.cloudflare.env.DB
    .prepare("INSERT INTO site_template (id, siteId, name, snapshot, isPublished, createdAt) VALUES (?, ?, ?, ?, 0, ?)")
    .bind(id, siteId, body.name, snapshot, now)
    .run();

  const template = await context.cloudflare.env.DB
    .prepare("SELECT * FROM site_template WHERE id = ?")
    .bind(id)
    .first();

  return jsonResponse({ template }, 201);
}
