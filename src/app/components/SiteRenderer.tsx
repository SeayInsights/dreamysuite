"use client";

import { memo, useMemo, useRef, useState, useLayoutEffect } from "react";
import { BLOCK_COMPONENTS } from "@/app/components/blocks";
import { useEditorStore } from "@/app/stores/editorStore";
import { TRANSLATABLE_FIELDS } from "@/lib/translations";
import { BlockTransitionWrapper } from "@/app/components/BlockTransitionWrapper";

export interface SiteBlock {
	id: string;
	type: string;
	config?: string | Record<string, unknown>;
	isVisible?: number;
	sortOrder?: number;
	[key: string]: unknown;
}

interface Props {
	blocks: SiteBlock[];
	/** When true, skip sortOrder sort — store order is authoritative (editor mode). */
	ordered?: boolean;
}

function useTranslatedBlocks(blocks: SiteBlock[]): SiteBlock[] {
	const displayLang = useEditorStore((s) => s.displayLang);
	const translations = useEditorStore((s) => s.translations);

	return useMemo(() => {
		if (!displayLang) return blocks;
		return blocks.map((block) => {
			const fields = TRANSLATABLE_FIELDS[block.type];
			if (!fields) return block;
			const langMap = translations[block.id]?.[displayLang];
			if (!langMap) return block;
			const cfg = (typeof block.config === "object" && block.config !== null ? block.config : {}) as Record<string, unknown>;
			let changed = false;
			const merged = { ...cfg };
			for (const f of fields) {
				const val = langMap[f.key];
				if (val) { merged[f.key] = val; changed = true; }
			}
			return changed ? { ...block, config: merged } : block;
		});
	}, [blocks, displayLang, translations]);
}

const MemoBlock = memo(function MemoBlock({
	block,
	anchorTop,
	isAnchored,
}: {
	block: SiteBlock;
	anchorTop: number | undefined;
	isAnchored: boolean;
}) {
	const Component = BLOCK_COMPONENTS[block.type];

	const wrapperStyle: React.CSSProperties | undefined = isAnchored
		? { position: "absolute", top: `${anchorTop ?? 0}px`, left: 0, width: "100%" }
		: undefined;

	if (!Component) {
		return (
			<div
				data-block-wrapper={block.id}
				data-block-id={block.id}
				data-block-type={block.type}
				data-block-label={block.type}
				style={wrapperStyle}
				className="flex h-12 items-center justify-center border border-dashed border-border text-xs text-muted-foreground"
			>
				Unknown block: {block.type}
			</div>
		);
	}

	return (
		<div data-block-wrapper={block.id} style={wrapperStyle}>
			<BlockTransitionWrapper>
				<Component block={block} />
			</BlockTransitionWrapper>
		</div>
	);
});

export function SiteRenderer({ blocks, ordered = false }: Props) {
	const sectionSpacing = useEditorStore((s) => s.settings.sectionSpacing);
	const gap = Number(sectionSpacing ?? 0) || 0;

	const visible = ordered
		? blocks.filter((b) => b.isVisible !== 0)
		: blocks.filter((b) => b.isVisible !== 0).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

	const translated = useTranslatedBlocks(visible);

	const containerRef = useRef<HTMLDivElement>(null);
	const translatedRef = useRef(translated);
	translatedRef.current = translated;

	const [anchors, setAnchors] = useState<Record<string, number> | null>(null);
	const [totalHeight, setTotalHeight] = useState(0);

	const blockIdKey = translated.map((b) => b.id).join(",");
	const breakpoint = useEditorStore((s) => s.breakpoint);

	// Reset anchors when block list or breakpoint changes
	useLayoutEffect(() => {
		setAnchors(null);
		setTotalHeight(0);
	}, [blockIdKey, breakpoint]);

	// Measure block positions from flex layout, then anchor them absolutely
	useLayoutEffect(() => {
		if (anchors !== null) return;
		const el = containerRef.current;
		if (!el) return;

		const currentBlocks = translatedRef.current;
		const measured: Record<string, number> = {};
		let maxBottom = 0;

		for (const block of currentBlocks) {
			const wrapper = el.querySelector<HTMLElement>(`[data-block-wrapper="${block.id}"]`);
			if (wrapper) {
				measured[block.id] = wrapper.offsetTop;
				maxBottom = Math.max(maxBottom, wrapper.offsetTop + wrapper.offsetHeight);
			}
		}

		if (Object.keys(measured).length > 0) {
			setAnchors(measured);
			setTotalHeight(maxBottom);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [anchors]);

	const isAnchored = anchors !== null;

	return (
		<div
			ref={containerRef}
			className="site-renderer relative"
			style={
				isAnchored
					? { position: "relative", minHeight: `${totalHeight}px` }
					: { display: "flex", flexDirection: "column", gap: gap > 0 ? `${gap}px` : undefined }
			}
		>
			{translated.map((block) => (
				<MemoBlock
					key={block.id}
					block={block}
					anchorTop={anchors?.[block.id]}
					isAnchored={isAnchored}
				/>
			))}
		</div>
	);
}
