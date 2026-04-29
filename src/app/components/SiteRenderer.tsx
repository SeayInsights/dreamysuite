"use client";

import { memo, useMemo } from "react";
import { BLOCK_COMPONENTS } from "@/app/components/blocks";
import { useEditorStore } from "@/app/stores/editorStore";
import { TRANSLATABLE_FIELDS } from "@/lib/translations";
import { BlockTransitionWrapper } from "@/app/components/BlockTransitionWrapper";
import { getBlockStyle, type Breakpoint } from "@/lib/blockPositioning";

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
	breakpoint,
}: {
	block: SiteBlock;
	breakpoint: Breakpoint;
}) {
	const Component = BLOCK_COMPONENTS[block.type];
	const config = (typeof block.config === "object" && block.config !== null ? block.config : {}) as Record<string, unknown>;

	// Single source of truth: all positioning logic in blockPositioning.ts
	const wrapperStyle = getBlockStyle(config, breakpoint);

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
		<div
			data-block-wrapper={block.id}
			data-block-id={block.id}
			data-block-type={block.type}
			data-block-label={block.type}
			style={wrapperStyle}
		>
			<BlockTransitionWrapper>
				<Component block={block} />
			</BlockTransitionWrapper>
		</div>
	);
});

export function SiteRenderer({ blocks, ordered = false }: Props) {
	const sectionSpacing = useEditorStore((s) => s.settings.sectionSpacing);
	const gap = Number(sectionSpacing ?? 0) || 0;
	const breakpoint = useEditorStore((s) => s.breakpoint) as Breakpoint;

	const visible = ordered
		? blocks.filter((b) => b.isVisible !== 0)
		: blocks.filter((b) => b.isVisible !== 0).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

	const translated = useTranslatedBlocks(visible);

	// Container style: always relative to allow layering on all breakpoints
	// Calculate height to contain all absolutely-positioned blocks
	const maxExtent = translated.reduce((max, block) => {
		const cfg = block.config as Record<string, unknown>;
		const offsetY = (typeof cfg.blockOffsetY === "number" ? cfg.blockOffsetY : 0);
		const height = (typeof cfg.blockHeight === "number" ? cfg.blockHeight : 400);
		const scale = breakpoint === "desktop" ? 1 :
		             breakpoint === "tablet" ? 768 / 1280 : 390 / 1280;
		return Math.max(max, (offsetY + height) * scale);
	}, 0);

	const containerStyle: React.CSSProperties = {
		position: "relative",
		minHeight: Math.max(maxExtent + 200, window.innerHeight || 800),
		...(breakpoint !== "desktop" && gap > 0 ? {
			display: "flex",
			flexDirection: "column",
			gap: `${gap}px`,
		} : {}),
	};

	return (
		<div className="site-renderer relative" style={containerStyle}>
			{translated.map((block) => (
				<MemoBlock
					key={block.id}
					block={block}
					breakpoint={breakpoint}
				/>
			))}
		</div>
	);
}
