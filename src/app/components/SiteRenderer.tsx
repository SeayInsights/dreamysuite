import { useMemo } from "react";
import { BLOCK_COMPONENTS } from "@/app/components/blocks";
import { useEditorStore } from "@/app/stores/editorStore";
import { TRANSLATABLE_FIELDS } from "@/lib/translations";

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

export function SiteRenderer({ blocks, ordered = false }: Props) {
	const sectionSpacing = useEditorStore((s) => s.settings.sectionSpacing);
	const gap = Number(sectionSpacing ?? 0) || 0;

	const visible = ordered
		? blocks.filter((b) => b.isVisible !== 0)
		: blocks.filter((b) => b.isVisible !== 0).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

	const translated = useTranslatedBlocks(visible);

	return (
		<div
			className="site-renderer"
			style={{
				display: "flex",
				flexDirection: "column",
				gap: gap > 0 ? `${gap}px` : undefined,
			}}
		>
			{translated.map((block) => {
				const Component = BLOCK_COMPONENTS[block.type];
				if (!Component) {
					return (
						<div
							key={block.id}
							data-block-id={block.id}
							data-block-type={block.type}
							data-block-label={block.type}
							className="flex h-12 items-center justify-center border border-dashed border-border text-xs text-muted-foreground"
						>
							Unknown block: {block.type}
						</div>
					);
				}
				return <Component key={block.id} block={block} />;
			})}
		</div>
	);
}
