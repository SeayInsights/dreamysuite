import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { requireSiteOwnership, apiOwnershipError } from "@/lib/api/site-auth";
import { parseBlockConfig, safeJsonParse } from "@/lib/validation";
import {
  SettingsSchema,
  upsertSiteSettings,
} from "@/lib/schemas/settings";

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const env = await getEnv();
  const { id: siteId, templateId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const template = await env.DB
    .prepare("SELECT * FROM site_template WHERE id = ? AND siteId = ?")
    .bind(templateId, siteId)
    .first<{ id: string; snapshot: string }>();

  if (!template) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Template not found" } }, { status: 404 });
  }

  await env.DB
    .prepare("DELETE FROM site_template WHERE id = ?")
    .bind(templateId)
    .run();

  return NextResponse.json({ success: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const env = await getEnv();
  const { id: siteId, templateId } = await params;

  const check = await requireSiteOwnership(req, env, siteId);
  if ("error" in check) return apiOwnershipError(check);

  const template = await env.DB
    .prepare("SELECT * FROM site_template WHERE id = ? AND siteId = ?")
    .bind(templateId, siteId)
    .first<{ id: string; snapshot: string }>();

  if (!template) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Template not found" } }, { status: 404 });
  }

  // Apply snapshot: restore pages, blocks, and settings
  const snapshot = safeJsonParse<{ pages: SnapshotPage[]; settings?: Record<string, unknown> | null } | null>(template.snapshot, null);
  if (!snapshot) {
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Snapshot is corrupted" } }, { status: 500 });
  }

  const now = Date.now();
  const db = env.DB;

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
      const configParse = parseBlockConfig(block.type, block.config);
      if (!configParse.ok) {
        console.warn(
          `[templates:restore blockId=${block.id} type=${block.type}] invalid config: ${configParse.error}`,
        );
      }
      const configStr = JSON.stringify(
        configParse.ok ? configParse.config : configParse.fallback,
      );
      await db
        .prepare(
          "INSERT INTO block (id, siteId, pageId, type, config, sortOrder, isVisible, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(
          newBlockId,
          siteId,
          newPageId,
          block.type,
          configStr,
          block.sortOrder,
          block.isVisible,
          now,
          now
        )
        .run();
    }
  }

  // Restore settings if present in snapshot. Running through SettingsSchema
  // fills in DEFAULTS for any field the snapshot was saved before (e.g. old
  // templates pre-dating bgImageLayer/bgImageOpacity/siteMaxWidth/showNavBrand),
  // so the full set of columns is always written.
  if (snapshot.settings) {
    const parsed = SettingsSchema.safeParse(snapshot.settings);
    if (!parsed.success) {
      console.warn(
        `[templates:restore siteId=${siteId}] settings parse failed: ${parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ")}`,
      );
    } else {
      await upsertSiteSettings(db, siteId, parsed.data, now);
    }
  }

  return NextResponse.json({ success: true, pagesRestored: snapshot.pages?.length ?? 0 });
}
