"use client";

import { useEffect, useRef, useState } from "react";
import Sortable from "sortablejs";
import {
	FileText,
	Plus,
	File,
	Home as HomeIcon,
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
	Trash2,
	type LucideIcon,
} from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";

interface PageSuggestion {
	slug: string;
	label: string;
	icon: LucideIcon;
}

const SHARED_PAGES: PageSuggestion[] = [
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

const ALL_SUGGESTION_SLUGS = new Set(
	Object.values(EVENT_PAGES).flat().map((s) => s.slug),
);

export function PagesTray() {
	const pages = useEditorStore((s) => s.pages);
	const currentPageId = useEditorStore((s) => s.currentPageId);
	const setCurrentPageId = useEditorStore((s) => s.setCurrentPageId);
	const setPages = useEditorStore((s) => s.setPages);
	const siteId = useEditorStore((s) => s.siteId);
	const eventType = useEditorStore((s) => s.eventType);
	const setBlocks = useEditorStore((s) => s.setBlocks);

	const [customName, setCustomName] = useState("");
	const [saving, setSaving] = useState<string | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");

	const listRef = useRef<HTMLDivElement>(null);
	const pagesRef = useRef(pages);
	pagesRef.current = pages;

	const suggestions = EVENT_PAGES[eventType ?? ""] ?? FALLBACK_PAGES;
	const existingSlugs = new Set(pages.map((p) => p.slug));

	const homePage = pages.find((p) => p.sortOrder === 0);
	const otherPages = pages.filter((p) => p.sortOrder !== 0);

	function isRenamable(page: { slug: string; sortOrder: number }) {
		if (page.sortOrder === 0) return true;
		return !ALL_SUGGESTION_SLUGS.has(page.slug);
	}

	async function saveRename(pageId: string) {
		const trimmed = editValue.trim();
		setEditingId(null);
		if (!trimmed || !siteId) return;
		try {
			const res = await fetch(`/api/sites/${siteId}/pages/${pageId}`, {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ label: trimmed }),
			});
			if (res.ok) {
				setPages(pages.map((p) => (p.id === pageId ? { ...p, label: trimmed } : p)));
			}
		} catch { /* ignore */ }
	}

	function startRename(page: { id: string; label: string; slug: string; sortOrder: number }) {
		if (!isRenamable(page)) return;
		setEditingId(page.id);
		setEditValue(page.label);
	}

	useEffect(() => {
		const el = listRef.current;
		if (!el) return;

		const sortable = Sortable.create(el, {
			animation: 150,
			ghostClass: "opacity-30",
			onEnd: (evt) => {
				const oldIdx = evt.oldIndex;
				const newIdx = evt.newIndex;
				if (oldIdx == null || newIdx == null || oldIdx === newIdx) return;

				const current = pagesRef.current;
				const others = current.filter((p) => p.sortOrder !== 0);
				const reordered = [...others];
				const [moved] = reordered.splice(oldIdx, 1);
				reordered.splice(newIdx, 0, moved);

				const home = current.find((p) => p.sortOrder === 0);
				const updated = [
					...(home ? [home] : []),
					...reordered.map((p, i) => ({ ...p, sortOrder: i + 1 })),
				];
				setPages(updated);

				if (siteId) {
					const toSync = reordered.map((p, i) => ({ ...p, sortOrder: i + 1 }));
					Promise.all(
						toSync.map((p) =>
							fetch(`/api/sites/${siteId}/pages/${p.id}`, {
								method: "PUT",
								headers: { "content-type": "application/json" },
								body: JSON.stringify({ sortOrder: p.sortOrder }),
							}),
						),
					).catch(() => {});
				}
			},
		});

		return () => sortable.destroy();
	}, [siteId, setPages]);

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
				page: { id: string; slug: string; label: string; sortOrder: number; isVisible?: number };
			};
			setPages([...pages, { ...page, isVisible: page.isVisible ?? 1 }]);
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

	async function deletePage(pageId: string) {
		if (!siteId) return;
		setDeleting(true);
		try {
			const res = await fetch(`/api/sites/${siteId}/pages/${pageId}`, {
				method: "DELETE",
			});
			if (!res.ok) return;
			const remaining = pages.filter((p) => p.id !== pageId);
			setPages(remaining);
			if (currentPageId === pageId) {
				const next = remaining[0] ?? null;
				setCurrentPageId(next?.id ?? null);
				setBlocks([]);
			}
		} finally {
			setDeleting(false);
			setConfirmDelete(null);
		}
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
				<div className="p-2">
					<p className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
						Active
					</p>

					{/* Home — always first, not draggable, not deletable, double-click to rename */}
					{homePage && (
						<div className="group relative">
							{editingId === homePage.id ? (
								<div className="flex items-center gap-2 rounded-md px-2 py-2">
									<HomeIcon className="size-4 shrink-0 text-muted-foreground" />
									<input
										autoFocus
										value={editValue}
										onChange={(e) => setEditValue(e.target.value)}
										onBlur={() => saveRename(homePage.id)}
										onKeyDown={(e) => {
											if (e.key === "Enter") saveRename(homePage.id);
											if (e.key === "Escape") setEditingId(null);
										}}
										className="h-6 flex-1 rounded border border-ring bg-background px-1.5 text-sm outline-none"
									/>
								</div>
							) : (
								<button
									type="button"
									onClick={() => setCurrentPageId(homePage.id)}
									onDoubleClick={() => startRename(homePage)}
									className={
										"flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors " +
										(currentPageId === homePage.id
											? "bg-accent text-accent-foreground"
											: "text-muted-foreground hover:bg-accent/50")
									}
								>
									<HomeIcon className="size-4 shrink-0" />
									<span className="flex-1 truncate">{homePage.label}</span>
								</button>
							)}
						</div>
					)}

					{/* Other pages — draggable, double-click to rename custom pages */}
					<div ref={listRef} className="flex flex-col">
						{otherPages.map((page) => (
							<div key={page.id} data-id={page.id} className="group relative">
								{confirmDelete === page.id ? (
									<div className="flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1.5">
										<span className="flex-1 text-xs text-destructive">Delete &ldquo;{page.label}&rdquo;?</span>
										<button
											type="button"
											onClick={() => deletePage(page.id)}
											disabled={deleting}
											className="rounded px-1.5 py-0.5 text-[11px] font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
										>
											{deleting ? "..." : "Yes"}
										</button>
										<button
											type="button"
											onClick={() => setConfirmDelete(null)}
											className="rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent/50"
										>
											No
										</button>
									</div>
								) : editingId === page.id ? (
									<div className="flex items-center gap-2 rounded-md px-2 py-2">
										<File className="size-4 shrink-0 text-muted-foreground" />
										<input
											autoFocus
											value={editValue}
											onChange={(e) => setEditValue(e.target.value)}
											onBlur={() => saveRename(page.id)}
											onKeyDown={(e) => {
												if (e.key === "Enter") saveRename(page.id);
												if (e.key === "Escape") setEditingId(null);
											}}
											className="h-6 flex-1 rounded border border-ring bg-background px-1.5 text-sm outline-none"
										/>
									</div>
								) : (
									<button
										type="button"
										onClick={() => setCurrentPageId(page.id)}
										onDoubleClick={() => startRename(page)}
										className={
											"flex w-full cursor-grab items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors active:cursor-grabbing " +
											(currentPageId === page.id
												? "bg-accent text-accent-foreground"
												: "text-muted-foreground hover:bg-accent/50")
										}
									>
										<File className="size-4 shrink-0" />
										<span className="flex-1 truncate">{page.label}</span>
									</button>
								)}
								{confirmDelete !== page.id && editingId !== page.id && (
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											setConfirmDelete(page.id);
										}}
										className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
										title={`Delete ${page.label}`}
									>
										<Trash2 className="size-3.5" />
									</button>
								)}
							</div>
						))}
					</div>
				</div>

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
