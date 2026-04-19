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
	HelpCircle,
	Lightbulb,
	type LucideIcon,
} from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";
import { BLOCK_REGISTRY } from "@/app/(dashboard)/sites/[id]/editor-v2/blocks/registry";

type BlockDef = { id: string; label: string; Icon: LucideIcon; blockType: string };
type Category = { id: string; label: string; blocks: BlockDef[] };

const CONTENT_BLOCKS: BlockDef[] = [
	{ id: "hero",    label: "Hero",    Icon: Sparkles, blockType: "home-hero" },
	{ id: "text",    label: "Text",    Icon: Type,     blockType: "multi-text" },
	{ id: "quote",   label: "Quote",   Icon: Quote,    blockType: "multi-text" },
	{ id: "divider", label: "Divider", Icon: Minus,    blockType: "spacer" },
];

const MEDIA_BLOCKS: BlockDef[] = [
	{ id: "image",   label: "Image",   Icon: ImageIcon, blockType: "gallery" },
	{ id: "gallery", label: "Gallery", Icon: Images,    blockType: "gallery" },
	{ id: "video",   label: "Video",   Icon: Film,      blockType: "media-video" },
];

const RSVP       = { id: "rsvp",       label: "RSVP",         Icon: FormInput, blockType: "rsvp-form" } as const;
const GUESTBOOK  = { id: "guestbook",  label: "Guest Book",   Icon: BookOpen,  blockType: "guest-book" } as const;
const TIMELINE   = { id: "timeline",   label: "Timeline",     Icon: Clock,     blockType: "story-timeline" } as const;
const INFO_CARD  = { id: "info-card",  label: "Info Card",    Icon: MapPin,    blockType: "info-card" } as const;
const COUNTDOWN  = { id: "countdown",  label: "Countdown",    Icon: Timer,     blockType: "countdown" } as const;
const VENUE_MAP  = { id: "venue-map",  label: "Venue Map",    Icon: Square,    blockType: "venue-map" } as const;
const FAQ        = { id: "faq",        label: "FAQ",          Icon: HelpCircle, blockType: "faq" } as const;
const SCHEDULE   = { id: "schedule",   label: "Schedule",     Icon: Clock,      blockType: "schedule" } as const;
const FUN_FACTS  = { id: "fun-facts",  label: "Fun Facts",    Icon: Lightbulb,  blockType: "fun-facts" } as const;
const TRAVEL     = { id: "travel",     label: "Travel",       Icon: MapPin,     blockType: "travel" } as const;

const EVENT_BLOCKS: Record<string, { label: string; blocks: BlockDef[] }> = {
	wedding: {
		label: "Wedding",
		blocks: [RSVP, GUESTBOOK, TIMELINE, SCHEDULE, FAQ, FUN_FACTS, TRAVEL, INFO_CARD, COUNTDOWN, VENUE_MAP],
	},
	anniversary: {
		label: "Anniversary",
		blocks: [GUESTBOOK, { ...TIMELINE, label: "Through the Years" }, SCHEDULE, FAQ, FUN_FACTS, COUNTDOWN, INFO_CARD],
	},
	"vow-renewal": {
		label: "Vow Renewal",
		blocks: [RSVP, GUESTBOOK, TIMELINE, SCHEDULE, FAQ, FUN_FACTS, TRAVEL, COUNTDOWN, VENUE_MAP],
	},
	engagement: {
		label: "Engagement",
		blocks: [RSVP, GUESTBOOK, { ...TIMELINE, label: "The Proposal" }, SCHEDULE, FAQ, FUN_FACTS, COUNTDOWN, INFO_CARD],
	},
	elopement: {
		label: "Elopement",
		blocks: [GUESTBOOK, { ...TIMELINE, label: "The Adventure" }, SCHEDULE, FAQ, FUN_FACTS, TRAVEL, INFO_CARD],
	},
	celebration: {
		label: "Celebration",
		blocks: [RSVP, GUESTBOOK, SCHEDULE, FAQ, FUN_FACTS, COUNTDOWN, VENUE_MAP, INFO_CARD],
	},
};

const FALLBACK_EVENT = { label: "Event", blocks: [RSVP, GUESTBOOK, TIMELINE, SCHEDULE, FAQ, FUN_FACTS, TRAVEL, INFO_CARD, COUNTDOWN, VENUE_MAP] };

function getCategories(eventType: string | null): Category[] {
	const event = EVENT_BLOCKS[eventType ?? ""] ?? FALLBACK_EVENT;
	return [
		{ id: "content", label: "Content", blocks: CONTENT_BLOCKS },
		{ id: "media",   label: "Media",   blocks: MEDIA_BLOCKS },
		{ id: "event",   label: event.label, blocks: event.blocks },
	];
}

export function ElementsTray() {
	const blocks = useEditorStore((s) => s.blocks);
	const insertBlock = useEditorStore((s) => s.insertBlock);
	const eventType = useEditorStore((s) => s.eventType);
	const categories = getCategories(eventType);

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
				{categories.map((cat) => (
					<div key={cat.id} className="mb-4">
						<p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
							{cat.label}
						</p>
						<div className="grid grid-cols-2 gap-2">
							{cat.blocks.map(({ id, label, Icon, blockType }) => (
								<button
									key={id}
									type="button"
									onClick={() => addBlock(blockType)}
									className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-3 text-xs text-amber-800 transition-all hover:border-amber-300 hover:bg-amber-100 hover:text-amber-900 active:scale-95"
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
		</div>
	);
}
