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
	const breakpoint = useEditorStore((s) => s.breakpoint) as Breakpoint;

	const visible = ordered
		? blocks.filter((b) => b.isVisible !== 0)
		: blocks.filter((b) => b.isVisible !== 0).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

	const translated = useTranslatedBlocks(visible);

	// Container style: always relative to allow layering on all breakpoints
	// Blocks scale their positions proportionally to viewport width
	const containerStyle: React.CSSProperties = {
		position: "relative",
		minHeight: "100vh",
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
