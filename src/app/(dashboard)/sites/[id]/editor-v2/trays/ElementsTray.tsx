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

type Block = { id: string; label: string; Icon: LucideIcon };
type Category = { id: string; label: string; blocks: Block[] };

const CATEGORIES: Category[] = [
	{
		id: "content",
		label: "Content",
		blocks: [
			{ id: "hero", label: "Hero", Icon: Sparkles },
			{ id: "text", label: "Text", Icon: Type },
			{ id: "quote", label: "Quote", Icon: Quote },
			{ id: "divider", label: "Divider", Icon: Minus },
		],
	},
	{
		id: "media",
		label: "Media",
		blocks: [
			{ id: "image", label: "Image", Icon: ImageIcon },
			{ id: "gallery", label: "Gallery", Icon: Images },
			{ id: "video", label: "Video", Icon: Film },
		],
	},
	{
		id: "wedding",
		label: "Wedding",
		blocks: [
			{ id: "rsvp", label: "RSVP", Icon: FormInput },
			{ id: "guestbook", label: "Guest Book", Icon: BookOpen },
			{ id: "timeline", label: "Timeline", Icon: Clock },
			{ id: "info-card", label: "Info Card", Icon: MapPin },
			{ id: "countdown", label: "Countdown", Icon: Timer },
			{ id: "cta", label: "CTA", Icon: Square },
		],
	},
];

export function ElementsTray() {
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
							{cat.blocks.map(({ id, label, Icon }) => (
								<button
									key={id}
									type="button"
									className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2 py-3 text-xs text-muted-foreground transition-all hover:border-accent-foreground/30 hover:bg-accent/30 hover:text-foreground"
									title={`Drag to add ${label}`}
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
					Drag-to-canvas lands in the canvas phase
				</p>
			</div>
		</div>
	);
}
