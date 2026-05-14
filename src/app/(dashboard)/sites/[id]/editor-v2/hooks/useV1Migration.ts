"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";

type PageContent = Record<string, unknown>;

const MIGRATION_MAP: Record<
  string,
  {
    contentKey: string;
    configKey: string;
    transform?: (items: unknown[]) => unknown[];
  }
> = {
  faq: {
    contentKey: "questions",
    configKey: "items",
    // V1 uses {q, a}, V2 uses {question, answer}
    transform: (items) =>
      items.map((raw) => {
        const item = raw as Record<string, unknown>;
        return {
          id: crypto.randomUUID(),
          question: item.q ?? item.question ?? "",
          answer: item.a ?? item.answer ?? "",
        };
      }),
  },
  schedule: {
    contentKey: "events",
    configKey: "events",
    // V1 uses snake_case dress_code and maps_url; V2 uses camelCase dressCode
    transform: (items) =>
      items.map((raw) => {
        const item = raw as Record<string, unknown>;
        return {
          id: crypto.randomUUID(),
          name: item.name ?? "",
          date: item.date ?? "",
          time: item.time ?? "",
          location: item.location ?? "",
          description: item.description ?? "",
          dressCode: item.dressCode ?? item.dress_code ?? "",
          mapsUrl: item.maps_url ?? item.mapsUrl ?? "",
        };
      }),
  },
  "fun-facts": {
    contentKey: "tidbits",
    configKey: "items",
    // V1 tidbits are {title, body, icon} — title maps to question in v2
    transform: (items) =>
      items.map((raw) => ({
        id: crypto.randomUUID(),
        ...(raw as Record<string, unknown>),
      })),
  },
  travel: {
    contentKey: "travelItems",
    configKey: "items",
    // V1 travelItems already use camelCase linkLabel/linkUrl
    transform: (items) =>
      items.map((raw) => ({
        id: crypto.randomUUID(),
        ...(raw as Record<string, unknown>),
      })),
  },
};

const DEBUG_V1_MIGRATION = false;

export function useV1Migration(siteId: string) {
  const migratedPages = useRef<Set<string>>(new Set());
  const currentPageId = useEditorStore((s) => s.currentPageId);
  const blockCount = useEditorStore((s) => s.blocks.length);

  useEffect(() => {
    if (!currentPageId || blockCount === 0) return;
    if (migratedPages.current.has(currentPageId)) return;

    const state = useEditorStore.getState();
    const { blocks, pages, updateBlock } = state;

    const targets = blocks.filter((b) => {
      const mapping = MIGRATION_MAP[b.type];
      if (!mapping) return false;
      const cfg = parseCfg(b.config);
      // Only skip if the block already has content — the _v2migrated flag alone is not enough
      // because it may have been stamped on a run before content was available
      const existing = cfg[mapping.configKey];
      return !Array.isArray(existing) || existing.length === 0;
    });

    if (targets.length === 0) {
      migratedPages.current.add(currentPageId);
      return;
    }

    const page = pages.find((p) => p.id === currentPageId);
    if (!page) return;

    let cancelled = false;

    async function migrate() {
      try {
        const res = await fetch(`/api/sites/${siteId}/content`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          content: Array<{
            pageSlug: string;
            lang: string;
            content: PageContent;
          }>;
        };

        if (cancelled) return;

        const row = data.content.find((r) => r.pageSlug === page!.slug);
        if (!row?.content) {
          migratedPages.current.add(currentPageId!);
          return;
        }

        const pc = row.content;
        let migrated = 0;

        for (const block of targets) {
          const mapping = MIGRATION_MAP[block.type];
          if (!mapping) continue;

          const cfg = parseCfg(block.config);
          const legacy = pc[mapping.contentKey];
          if (!Array.isArray(legacy) || legacy.length === 0) {
            // No legacy data for this key — skip without stamping so we retry next session
            continue;
          }

          const items = mapping.transform
            ? mapping.transform(legacy)
            : legacy.map((raw) => ({
                id: crypto.randomUUID(),
                ...(raw as Record<string, unknown>),
              }));

          // _v2migrated persists to DB via normal block sync — prevents re-run on reload
          const newConfig = {
            ...cfg,
            [mapping.configKey]: items,
            _v2migrated: true,
          };
          updateBlock(block.id, { config: newConfig });
          migrated++;
          if (DEBUG_V1_MIGRATION) {
            console.log(
              `[V1 Migration] Copied ${legacy.length} ${mapping.contentKey} to ${block.type} block ${block.id}`,
            );
          }
        }

        if (DEBUG_V1_MIGRATION && migrated > 0) {
          console.log(
            `[V1 Migration] Migrated ${migrated} block(s) on page "${page!.slug}"`,
          );
        }
      } catch (err) {
        console.warn("[V1 Migration] Failed to fetch legacy content:", err);
      } finally {
        migratedPages.current.add(currentPageId!);
      }
    }

    migrate();
    return () => {
      cancelled = true;
    };
  }, [siteId, currentPageId, blockCount]);
}
