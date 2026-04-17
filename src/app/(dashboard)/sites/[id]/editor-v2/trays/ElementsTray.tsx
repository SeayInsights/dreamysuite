"use client";

import {
	Sparkles,
	Type,
	Image as ImageIcon,
	Images,
	Film,
	FormInput,
	BookOpen,
	Clock,
	MapPin,
	Minus,
	Square,
	Quote,
	Timer,
	type LucideIcon,
} from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";
import { BLOCK_REGISTRY } from "@/app/(dashboard)/sites/[id]/editor-v2/blocks/registry";

type BlockDef = { id: string; label: string; Icon: LucideIcon; blockType: string };
type Category = { id: string; label: string; blocks: BlockDef[] };

const CATEGORIES: Category[] = [
	{
		id: "content",
		label: "Content",
		blocks: [
			{ id: "hero",    label: "Hero",    Icon: Sparkles, blockType: "home-hero" },
			{ id: "text",    label: "Text",    Icon: Type,     blockType: "multi-text" },
			{ id: "quote",   label: "Quote",   Icon: Quote,    blockType: "multi-text" },
			{ id: "divider", label: "Divider", Icon: Minus,    blockType: "spacer" },
		],
	},
	{
		id: "media",
		label: "Media",
		blocks: [
			{ id: "image",   label: "Image",   Icon: ImageIcon, blockType: "gallery" },
			{ id: "gallery", label: "Gallery", Icon: Images,    blockType: "gallery" },
			{ id: "video",   label: "Video",   Icon: Film,      blockType: "media-video" },
		],
	},
	{
		id: "wedding",
		label: "Wedding",
		blocks: [
			{ id: "rsvp",       label: "RSVP",       Icon: FormInput, blockType: "rsvp-form" },
			{ id: "guestbook",  label: "Guest Book", Icon: BookOpen,  blockType: "guest-book" },
			{ id: "timeline",   label: "Timeline",   Icon: Clock,     blockType: "story-timeline" },
			{ id: "info-card",  label: "Info Card",  Icon: MapPin,    blockType: "info-card" },
			{ id: "countdown",  label: "Countdown",  Icon: Timer,     blockType: "countdown" },
			{ id: "venue-map",  label: "Venue Map",  Icon: Square,    blockType: "venue-map" },
		],
	},
];

export function ElementsTray() {
	const blocks = useEditorStore((s) => s.blocks);
	const insertBlock = useEditorStore((s) => s.insertBlock);

	function addBlock(blockType: string) {
		const entry = BLOCK_REGISTRY[blockType];
		if (!entry) return;
		const newBlock = {
			id: crypto.randomUUID(),
			type: blockType,
			isVisible: 1,
			sortOrder: blocks.length,
			config: entry.defaultData,
		};
		insertBlock(newBlock, blocks.length);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Elements
				</h2>
			</div>

			<div className="flex-1 overflow-y-auto p-3">
				{CATEGORIES.map((cat) => (
					<div key={cat.id} className="mb-4 last:mb-0">
						<p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
							{cat.label}
						</p>
						<div className="grid grid-cols-2 gap-2">
							{cat.blocks.map(({ id, label, Icon, blockType }) => (
								<button
									key={id}
									type="button"
									onClick={() => addBlock(blockType)}
									className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-3 text-xs text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95"
									title={`Add ${label} block`}
								>
									<Icon className="size-4" />
									<span className="truncate">{label}</span>
								</button>
							))}
						</div>
					</div>
				))}
			</div>

			<div className="border-t border-border px-4 py-3">
				<p className="text-[11px] text-muted-foreground">
					Click to add — drag-to-position coming soon
				</p>
			</div>
		</div>
	);
}
