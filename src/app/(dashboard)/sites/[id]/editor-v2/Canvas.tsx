"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Film, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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

const VIDEO_BLOCK_TYPES = new Set(["video", "media-video"]);

function VideoEditorBar({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
	const [barRect, setBarRect] = useState<{ top: number; left: number } | null>(null);
	const [blockId, setBlockId] = useState<string | null>(null);
	const setInspectorOpen = useEditorStore((s) => s.setInspectorOpen);
	const selectBlock = useEditorStore((s) => s.selectBlock);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handler = (e: MouseEvent) => {
			const blockRoot = (e.target as HTMLElement).closest<HTMLElement>("[data-block-id]");
			if (!blockRoot) return;
			const type = blockRoot.dataset.blockType ?? "";
			if (!VIDEO_BLOCK_TYPES.has(type)) return;

			e.preventDefault();
			e.stopPropagation();

			const cBox = container.getBoundingClientRect();
			const bBox = blockRoot.getBoundingClientRect();
			const top = bBox.top - cBox.top + container.scrollTop + bBox.height / 2 - 20;
			const left = bBox.left - cBox.left + bBox.width / 2;
			setBarRect({ top, left });
			setBlockId(blockRoot.dataset.blockId ?? null);
			selectBlock(blockRoot.dataset.blockId ?? null);
		};

		container.addEventListener("dblclick", handler);
		return () => container.removeEventListener("dblclick", handler);
	}, [containerRef, selectBlock]);

	// Dismiss on click outside
	useEffect(() => {
		if (!barRect) return;
		const handler = (e: MouseEvent) => {
			const bar = document.querySelector("[data-video-editor-bar]");
			if (bar && bar.contains(e.target as Node)) return;
			const blockRoot = blockId ? document.querySelector(`[data-block-id="${blockId}"]`) : null;
			if (blockRoot && blockRoot.contains(e.target as Node)) return;
			setBarRect(null);
		};
		document.addEventListener("mousedown", handler, true);
		return () => document.removeEventListener("mousedown", handler, true);
	}, [barRect, blockId]);

	return (
		<AnimatePresence>
			{barRect && (
				<motion.div
					data-video-editor-bar
					key="video-bar"
					initial={{ opacity: 0, y: 4 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 4 }}
					transition={{ duration: 0.15, ease: "easeOut" }}
					className="pointer-events-auto absolute z-30 flex items-center gap-0.5 rounded-lg px-1.5 py-1 bg-neutral-900/95 shadow-xl ring-1 ring-white/10 backdrop-blur-sm"
					style={{ top: barRect.top, left: barRect.left, transform: "translateX(-50%)" }}
				>
					<button
						type="button"
						className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium text-white hover:bg-white/10"
						onClick={() => {
							setInspectorOpen(true);
							setBarRect(null);
						}}
					>
						<Film className="h-3.5 w-3.5" />
						Change video
					</button>
					<div className="mx-0.5 h-4 w-px bg-white/20" />
					<button
						type="button"
						className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
						onClick={() => setBarRect(null)}
					>
						<X className="h-3 w-3" />
					</button>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

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

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				if (!cancelled) setBlocks(rawBlocks as any[]);
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
						{/* Editing overlays inside containerRef so absolute coords are correct */}
						<SectionToolbar containerRef={containerRef} />
						<DragHandles containerRef={containerRef} />
					</EditorOverlay>
				</BreakpointFrame>

				<TextEditor containerRef={containerRef} />
				<ImageEditor containerRef={containerRef} />
				<VideoEditorBar containerRef={containerRef} />
			</div>
		</ContextMenu>
	);
}
