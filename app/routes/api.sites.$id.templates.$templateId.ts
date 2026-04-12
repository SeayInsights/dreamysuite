import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/api.sites.$id.templates.$templateId";
import "~/lib/context";

async function requireSiteOwnership(
  request: Request,
  context: Route.ActionArgs["context"],
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

interface SnapshotBlock {
  id: string;
  siteId: string;
  pageId: string;
  type: string;
  config: unknown;
  sortOrder: number;
  isVisible: number;
  createdAt: number;
  updatedAt: number;
}

interface SnapshotPage {
  id: string;
  siteId: string;
  slug: string;
  label: string;
  isVisible: number;
  isLocked: number;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  blocks: SnapshotBlock[];
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const { id: siteId, templateId } = params;
  const check = await requireSiteOwnership(request, context, siteId);
  if ("error" in check) return jsonResponse(check, check.status);

  const template = await context.cloudflare.env.DB
    .prepare("SELECT * FROM site_template WHERE id = ? AND siteId = ?")
    .bind(templateId, siteId)
    .first<{ id: string; snapshot: string }>();

  if (!template) {
    return jsonResponse({ error: { code: "NOT_FOUND", message: "Template not found" } }, 404);
  }

  if (request.method === "DELETE") {
    await context.cloudflare.env.DB
      .prepare("DELETE FROM site_template WHERE id = ?")
      .bind(templateId)
      .run();
    return jsonResponse({ success: true });
  }

  if (request.method === "POST") {
    // Apply snapshot: restore pages and blocks
    let snapshot: { pages: SnapshotPage[] };
    try {
      snapshot = JSON.parse(template.snapshot);
    } catch {
      return jsonResponse({ error: { code: "INTERNAL_ERROR", message: "Snapshot is corrupted" } }, 500);
    }

    const now = Date.now();
    const db = context.cloudflare.env.DB;

    // Delete all existing pages (blocks cascade)
    await db.prepare("DELETE FROM page WHERE siteId = ?").bind(siteId).run();

    // Re-insert pages and blocks from snapshot
    for (const page of snapshot.pages ?? []) {
      const newPageId = crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO page (id, siteId, slug, label, isVisible, isLocked, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(newPageId, siteId, page.slug, page.label, page.isVisible, page.isLocked, page.sortOrder, now, now)
        .run();

      for (const block of page.blocks ?? []) {
        const newBlockId = crypto.randomUUID();
        await db
          .prepare(
            "INSERT INTO block (id, siteId, pageId, type, config, sortOrder, isVisible, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
          )
          .bind(
            newBlockId,
            siteId,
            newPageId,
            block.type,
            JSON.stringify(block.config ?? {}),
            block.sortOrder,
            block.isVisible,
            now,
            now
          )
          .run();
      }
    }

    return jsonResponse({ success: true, pagesRestored: snapshot.pages?.length ?? 0 });
  }

  return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } }, 405);
}
