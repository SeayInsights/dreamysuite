"use client";

import { useState } from "react";
import {
	FileText,
	Home,
	Plus,
	File,
	Heart,
	Camera,
	Clock,
	MapPin,
	Gift,
	MessageSquare,
	Users,
	Plane,
	Sparkles,
	CalendarDays,
	HelpCircle,
	PartyPopper,
	BookOpen,
	type LucideIcon,
} from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";

interface PageSuggestion {
	slug: string;
	label: string;
	icon: LucideIcon;
}

const SHARED_PAGES: PageSuggestion[] = [
	{ slug: "home", label: "Home", icon: Home },
	{ slug: "our-story", label: "Our Story", icon: Heart },
	{ slug: "gallery", label: "Gallery", icon: Camera },
	{ slug: "rsvp", label: "RSVP", icon: FileText },
	{ slug: "guest-book", label: "Guest Book", icon: MessageSquare },
];

const EVENT_PAGES: Record<string, PageSuggestion[]> = {
	wedding: [
		...SHARED_PAGES,
		{ slug: "wedding-party", label: "Wedding Party", icon: Users },
		{ slug: "schedule", label: "Schedule", icon: Clock },
		{ slug: "venue-travel", label: "Venue & Travel", icon: MapPin },
		{ slug: "registry", label: "Registry", icon: Gift },
		{ slug: "accommodations", label: "Accommodations", icon: MapPin },
		{ slug: "faq", label: "FAQ", icon: HelpCircle },
	],
	anniversary: [
		...SHARED_PAGES,
		{ slug: "through-the-years", label: "Through the Years", icon: Clock },
		{ slug: "celebration-details", label: "Celebration Details", icon: PartyPopper },
		{ slug: "registry", label: "Registry / Wishes", icon: Gift },
	],
	"vow-renewal": [
		...SHARED_PAGES,
		{ slug: "ceremony-details", label: "Ceremony Details", icon: Sparkles },
		{ slug: "schedule", label: "Schedule", icon: Clock },
		{ slug: "venue-travel", label: "Venue & Travel", icon: MapPin },
	],
	engagement: [
		...SHARED_PAGES,
		{ slug: "the-proposal", label: "The Proposal", icon: Sparkles },
		{ slug: "party-details", label: "Party Details", icon: PartyPopper },
		{ slug: "registry", label: "Registry", icon: Gift },
		{ slug: "schedule", label: "Schedule", icon: Clock },
	],
	elopement: [
		...SHARED_PAGES,
		{ slug: "the-adventure", label: "The Adventure", icon: Plane },
		{ slug: "travel-details", label: "Travel Details", icon: MapPin },
		{ slug: "schedule", label: "Schedule", icon: CalendarDays },
	],
	celebration: [
		...SHARED_PAGES,
		{ slug: "event-details", label: "Event Details", icon: PartyPopper },
		{ slug: "schedule", label: "Schedule", icon: Clock },
		{ slug: "venue", label: "Venue", icon: MapPin },
		{ slug: "faq", label: "FAQ", icon: HelpCircle },
	],
};

const FALLBACK_PAGES = SHARED_PAGES;

export function PagesTray() {
	const pages = useEditorStore((s) => s.pages);
	const currentPageId = useEditorStore((s) => s.currentPageId);
	const setCurrentPageId = useEditorStore((s) => s.setCurrentPageId);
	const setPages = useEditorStore((s) => s.setPages);
	const siteId = useEditorStore((s) => s.siteId);
	const eventType = useEditorStore((s) => s.eventType);

	const [customName, setCustomName] = useState("");
	const [saving, setSaving] = useState<string | null>(null);

	const suggestions = EVENT_PAGES[eventType ?? ""] ?? FALLBACK_PAGES;
	const existingSlugs = new Set(pages.map((p) => p.slug));

	async function createPage(slug: string, label: string) {
		if (!siteId) return;
		setSaving(slug);
		try {
			const res = await fetch(`/api/sites/${siteId}/pages`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ slug, label }),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => null) as { error?: { message?: string } } | null;
				alert(data?.error?.message ?? "Failed to create page");
				return;
			}
			const { page } = (await res.json()) as {
				page: { id: string; slug: string; label: string; sortOrder: number };
			};
			setPages([...pages, page]);
			setCurrentPageId(page.id);
		} finally {
			setSaving(null);
		}
	}

	async function addCustomPage() {
		if (!customName.trim()) return;
		const slug = customName
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
		await createPage(slug, customName.trim());
		setCustomName("");
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Pages
				</h2>
				<span className="text-xs text-muted-foreground">{pages.length}</span>
			</div>

			<div className="flex-1 overflow-y-auto">
				{/* Active pages */}
				{pages.length > 0 && (
					<div className="p-2">
						<p className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
							Active
						</p>
						{pages.map((page) => (
							<button
								key={page.id}
								type="button"
								onClick={() => setCurrentPageId(page.id)}
								className={
									"flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors " +
									(currentPageId === page.id
										? "bg-accent text-accent-foreground"
										: "text-muted-foreground hover:bg-accent/50")
								}
							>
								{page.sortOrder === 0 ? (
									<Home className="size-4 shrink-0" />
								) : (
									<File className="size-4 shrink-0" />
								)}
								<span className="flex-1 truncate">{page.label}</span>
							</button>
						))}
					</div>
				)}

				{/* Suggested pages */}
				<div className="border-t border-border p-2">
					<p className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
						Add page
					</p>
					<div className="space-y-0.5">
						{suggestions
							.filter((s) => !existingSlugs.has(s.slug))
							.map(({ slug, label, icon: Icon }) => (
								<button
									key={slug}
									type="button"
									onClick={() => createPage(slug, label)}
									disabled={saving === slug}
									className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/50 disabled:opacity-50"
								>
									<Icon className="size-4 shrink-0" />
									<span className="flex-1 truncate">{label}</span>
									<Plus className="size-3.5 shrink-0 opacity-40" />
								</button>
							))}

						{/* Custom page option */}
						<div className="mt-2 flex items-center gap-1 px-1">
							<BookOpen className="size-4 shrink-0 text-muted-foreground" />
							<input
								value={customName}
								onChange={(e) => setCustomName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") addCustomPage();
								}}
								placeholder="Other page name..."
								className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-ring"
								disabled={saving !== null}
							/>
							<button
								type="button"
								onClick={addCustomPage}
								disabled={saving !== null || !customName.trim()}
								className="rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground disabled:opacity-50"
							>
								Add
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
