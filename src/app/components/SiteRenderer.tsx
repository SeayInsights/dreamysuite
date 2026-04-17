import { BLOCK_COMPONENTS } from "@/app/components/blocks";

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
}

export function SiteRenderer({ blocks }: Props) {
	const visible = blocks
		.filter((b) => b.isVisible !== 0)
		.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

	return (
		<div className="site-renderer">
			{visible.map((block) => {
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
