"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useEditorStore } from "@/app/stores/editorStore";
import { parseCfg, resolveBreakpointConfig } from "@/lib/editableField";
import { trackEditorError } from "@/lib/telemetry/editor";
import { SiteRenderer } from "@/app/components/SiteRenderer";
import { BreakpointFrame } from "./BreakpointFrame";
import { EditorOverlay } from "./EditorOverlay";
import { GridOverlay } from "./GridOverlay";
import { NavPreview } from "./NavPreview";
import { TextEditor } from "./editing/TextEditor";
import { ImageEditor } from "./editing/ImageEditor";
import { SectionToolbar } from "./editing/SectionToolbar";
import { DragHandles } from "./editing/DragHandles";
import { ContextMenu } from "./editing/ContextMenu";

interface Props {
	siteId: string;
}

export function Canvas({ siteId }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const rawBlocks = useEditorStore((s) => s.blocks);
	const setBlocks = useEditorStore((s) => s.setBlocks);
	const breakpoint = useEditorStore((s) => s.breakpoint);
	const currentPageId = useEditorStore((s) => s.currentPageId);
	const setPages = useEditorStore((s) => s.setPages);
	const setCurrentPageId = useEditorStore((s) => s.setCurrentPageId);
	const loadTranslations = useEditorStore((s) => s.loadTranslations);

	const blocks = useMemo(
		() =>
			rawBlocks.map((b) => ({
				...b,
				config: resolveBreakpointConfig(parseCfg(b.config), breakpoint),
			})),
		[rawBlocks, breakpoint],
	);

	useEffect(() => {
		let cancelled = false;

		async function loadPages() {
			try {
				setLoading(true);
				setError(null);

				const pagesRes = await fetch(`/api/sites/${siteId}/pages`);
				if (!pagesRes.ok) throw new Error("Failed to load pages");
				const { pages } = (await pagesRes.json()) as { pages: import("@/app/stores/slices/editorShell").EditorPage[] };

				if (!cancelled) {
					setPages(pages);
					if (pages.length && !currentPageId) {
						setCurrentPageId(pages[0].id);
					}
					loadTranslations(siteId);
				}

				if (!pages.length) {
					if (!cancelled) setBlocks([]);
					return;
				}
			} catch (err) {
				if (!cancelled) {
					const msg = err instanceof Error ? err.message : "Failed to load canvas";
					setError(msg);
					trackEditorError(siteId, msg, "canvas");
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

		async function loadBlocks() {
			try {
				const blocksRes = await fetch(
					`/api/sites/${siteId}/pages/${currentPageId}`,
				);
				if (!blocksRes.ok) throw new Error("Failed to load blocks");
				const { blocks: rawBlocks } = (await blocksRes.json()) as {
					blocks: unknown[];
				};

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				if (!cancelled) setBlocks(rawBlocks as any[]);
			} catch (err) {
				if (!cancelled) {
					const msg = err instanceof Error ? err.message : "Failed to load blocks";
					setError(msg);
					trackEditorError(siteId, msg, "canvas");
				}
			}
		}

		loadBlocks();
		return () => {
			cancelled = true;
		};
	}, [siteId, currentPageId, setBlocks]);

	if (loading) {
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
				<BreakpointFrame>
					<NavPreview />
					<EditorOverlay containerRef={containerRef}>
						<SiteRenderer blocks={blocks} ordered />
						<GridOverlay />
						{/* Editing overlays inside containerRef so absolute coords are correct */}
						<SectionToolbar containerRef={containerRef} />
						<DragHandles containerRef={containerRef} />
					</EditorOverlay>
				</BreakpointFrame>

				<TextEditor containerRef={containerRef} />
				<ImageEditor containerRef={containerRef} />
			</div>
		</ContextMenu>
	);
}
