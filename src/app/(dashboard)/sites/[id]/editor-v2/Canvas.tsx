"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg } from "@/lib/editableField";
import type { Block } from "@/app/stores/slices/document";
import { consolidateBlocks } from "@/lib/migrations/blockConsolidation";
import { migrateOutOfBoundsElements } from "@/lib/migrations/migrateOutOfBoundsElements";
import { trackEditorError, trackBoundsMigration } from "@/lib/telemetry/editor";
import { getEffectiveConfig, getEffectiveOrder } from "./lib/cascadeConfig";
import { SiteRenderer } from "@/app/components/SiteRenderer";
import { BreakpointFrame } from "./BreakpointFrame";
import { EditorOverlay } from "./EditorOverlay";
import { GridOverlay } from "./GridOverlay";
import { NavPreview } from "./NavPreview";
import { TextEditor } from "./editing/TextEditor";
import { ImageEditor } from "./editing/ImageEditor";
import { VideoInlineEditor } from "./editing/VideoInlineEditor";
import { BlockEditPanel } from "./editing/BlockEditPanel";
import { DragHandles } from "./editing/DragHandles";
import { ContextMenu } from "./editing/ContextMenu";

interface Props {
	siteId: string;
}

export function Canvas({ siteId }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [loading, setLoading] = useState(true);
	const [blocksLoading, setBlocksLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const rawBlocks = useEditorStore((s) => s.blocks);
	const setBlocks = useEditorStore((s) => s.setBlocks);
	const breakpoint = useEditorStore((s) => s.breakpoint);
	const currentPageId = useEditorStore((s) => s.currentPageId);
	const setPages = useEditorStore((s) => s.setPages);
	const setCurrentPageId = useEditorStore((s) => s.setCurrentPageId);
	const loadTranslations = useEditorStore((s) => s.loadTranslations);
	const settingsLoaded = useEditorStore((s) => s.settingsLoaded);

	const blocks = useMemo(() => {
		// Apply effective config to each block
		const withEffectiveConfig = rawBlocks.map((b) => ({
			...b,
			config: getEffectiveConfig(b, breakpoint),
		}));

		// Sort blocks by effective order for the current breakpoint
		return [...withEffectiveConfig].sort((a, b) => {
			const indexA = rawBlocks.indexOf(
				rawBlocks.find((rb) => rb.id === a.id)!,
			);
			const indexB = rawBlocks.indexOf(
				rawBlocks.find((rb) => rb.id === b.id)!,
			);
			const orderA = getEffectiveOrder(a, breakpoint, indexA);
			const orderB = getEffectiveOrder(b, breakpoint, indexB);
			return orderA - orderB;
		});
	}, [rawBlocks, breakpoint]);

	useEffect(() => {
		let cancelled = false;
		setCurrentPageId(null);

		async function loadPages() {
			try {
				setLoading(true);
				setBlocksLoading(true);
				setError(null);

				const pagesRes = await fetch(`/api/sites/${siteId}/pages`);
				if (!pagesRes.ok) throw new Error("Failed to load pages");
				const { pages } = (await pagesRes.json()) as { pages: import("@/app/stores/slices/editorShell").EditorPage[] };

				if (!cancelled) {
					setPages(pages);
					if (pages.length) {
						setCurrentPageId(pages[0].id);
					}
					loadTranslations(siteId);
				}

				if (!pages.length) {
					if (!cancelled) {
						setBlocks([]);
						setBlocksLoading(false);
					}
				}
			} catch (err) {
				if (!cancelled) {
					const msg = err instanceof Error ? err.message : "Failed to load canvas";
					setError(msg);
					trackEditorError(siteId, msg, "canvas");
					setBlocksLoading(false);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		loadPages();
		return () => {
			cancelled = true;
		};
	}, [siteId, setBlocks, setPages, setCurrentPageId]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!currentPageId) return;
		let cancelled = false;
		setBlocksLoading(true);

		async function loadBlocks() {
			try {
				const blocksRes = await fetch(
					`/api/sites/${siteId}/pages/${currentPageId}`,
				);
				if (!blocksRes.ok) throw new Error("Failed to load blocks");
				const { blocks: rawBlocks } = (await blocksRes.json()) as {
					blocks: unknown[];
				};

				if (!cancelled) {
					const parsed = (rawBlocks as Block[]).map((b) => ({
						...b,
						config: parseCfg(b.config),
						overrides: typeof b.overrides === "string" ? JSON.parse(b.overrides) : b.overrides,
					}));
					const { blocks: consolidated } = consolidateBlocks(parsed);

					// Run bounds migration to fix out-of-bounds elements
					const { blocks: migrated, fixed, unchanged } = migrateOutOfBoundsElements(consolidated as Block[]);
					if (fixed > 0) {
						trackBoundsMigration(siteId, fixed, unchanged);
					}

					const updateBlock = useEditorStore.getState().updateBlock;
					setBlocks(migrated as Block[]);

					// Mark type-changed blocks dirty so the new type persists to DB.
					for (let i = 0; i < parsed.length; i++) {
						if (parsed[i].type !== (consolidated[i] as Block).type) {
							updateBlock((consolidated[i] as Block).id, {
								type: (consolidated[i] as Block).type,
								config: parseCfg((consolidated[i] as Block).config),
							});
						}
					}

					// Mark bounds-fixed blocks dirty so the new position persists to DB.
					for (let i = 0; i < consolidated.length; i++) {
						const before = consolidated[i] as Block;
						const after = migrated[i] as Block;
						if (before.config.top !== after.config.top ||
						    before.config.left !== after.config.left ||
						    before.config.width !== after.config.width ||
						    before.config.height !== after.config.height) {
							updateBlock(after.id, {
								config: after.config,
							});
						}
					}
				}
			} catch (err) {
				if (!cancelled) {
					const msg = err instanceof Error ? err.message : "Failed to load blocks";
					setError(msg);
					trackEditorError(siteId, msg, "canvas");
				}
			} finally {
				if (!cancelled) setBlocksLoading(false);
			}
		}

		loadBlocks();
		return () => {
			cancelled = true;
		};
	}, [siteId, currentPageId, setBlocks]);

	if (loading || blocksLoading || !settingsLoaded) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-full w-full items-center justify-center text-sm text-destructive">
				{error}
			</div>
		);
	}

	return (
		<ContextMenu>
			<div className="relative h-full w-full">
				<BreakpointFrame nav={<NavPreview />}>
					<EditorOverlay containerRef={containerRef}>
						<SiteRenderer blocks={blocks} ordered />
						<GridOverlay />
						{/* SectionToolbar removed (E019) — controls moved to inspector Design/Advanced tabs */}
					</EditorOverlay>
				</BreakpointFrame>

				<DragHandles containerRef={containerRef} />
				<TextEditor containerRef={containerRef} />
				<ImageEditor containerRef={containerRef} />
				<VideoInlineEditor containerRef={containerRef} />

				{/* BlockEditPanel portals to document.body — lives here for
				    containerRef access but renders outside the scroll container */}
				<BlockEditPanel containerRef={containerRef} />
			</div>
		</ContextMenu>
	);
}
