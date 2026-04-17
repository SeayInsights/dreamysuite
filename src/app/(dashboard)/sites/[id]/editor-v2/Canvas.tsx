"use client";

import { useEffect, useState } from "react";

import { useEditorStore } from "@/app/stores/editorStore";
import { SiteRenderer } from "@/app/components/SiteRenderer";
import { BreakpointFrame } from "./BreakpointFrame";
import { EditorOverlay } from "./EditorOverlay";

interface Page {
	id: string;
	slug: string;
	label: string;
	sortOrder: number;
}

interface Props {
	siteId: string;
}

export function Canvas({ siteId }: Props) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const blocks = useEditorStore((s) => s.blocks);
	const setBlocks = useEditorStore((s) => s.setBlocks);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			try {
				setLoading(true);
				setError(null);

				const pagesRes = await fetch(`/api/sites/${siteId}/pages`);
				if (!pagesRes.ok) throw new Error("Failed to load pages");
				const { pages } = (await pagesRes.json()) as { pages: Page[] };

				if (!pages.length) {
					if (!cancelled) setBlocks([]);
					return;
				}

				const firstPage = pages[0];
				const blocksRes = await fetch(
					`/api/sites/${siteId}/pages/${firstPage.id}`,
				);
				if (!blocksRes.ok) throw new Error("Failed to load blocks");
				const { blocks: rawBlocks } = (await blocksRes.json()) as {
					blocks: unknown[];
				};

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				if (!cancelled) setBlocks(rawBlocks as any[]);
			} catch (err) {
				if (!cancelled)
					setError(err instanceof Error ? err.message : "Failed to load canvas");
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, [siteId, setBlocks]);

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
		<div className="relative h-full w-full">
			<BreakpointFrame>
				<EditorOverlay>
					<SiteRenderer blocks={blocks} />
				</EditorOverlay>
			</BreakpointFrame>
		</div>
	);
}
