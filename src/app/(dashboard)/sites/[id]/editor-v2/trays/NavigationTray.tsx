"use client";

import { useState } from "react";
import {
	ChevronUp,
	ChevronDown,
	Eye,
	EyeOff,
} from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";

export function NavigationTray() {
	const settings = useEditorStore((s) => s.settings);
	const updateSettings = useEditorStore((s) => s.updateSettings);
	const pages = useEditorStore((s) => s.pages);
	const setPages = useEditorStore((s) => s.setPages);
	const siteId = useEditorStore((s) => s.siteId);
	const [editingLabel, setEditingLabel] = useState<string | null>(null);
	const [labelValue, setLabelValue] = useState("");

	const showBrand = (settings.showNavBrand ?? 1) === 1;
	const navShape = (settings.navShape as string) ?? "bar";
	const navPosition = (settings.navPosition as string) ?? "fixed";

	async function updatePageLabel(pageId: string, label: string) {
		if (!siteId || !label.trim()) return;
		try {
			const res = await fetch(`/api/sites/${siteId}/pages/${pageId}`, {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ label: label.trim() }),
			});
			if (res.ok) {
				setPages(pages.map((p) => (p.id === pageId ? { ...p, label: label.trim() } : p)));
			}
		} catch { /* ignore */ }
		setEditingLabel(null);
	}

	async function togglePageVisible(pageId: string, currentlyVisible: boolean) {
		if (!siteId) return;
		const isVisible = !currentlyVisible;
		try {
			const res = await fetch(`/api/sites/${siteId}/pages/${pageId}`, {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ isVisible }),
			});
			if (res.ok) {
				setPages(pages.map((p) => (p.id === pageId ? { ...p, isVisible: isVisible ? 1 : 0 } : p)));
			}
		} catch { /* ignore */ }
	}

	async function movePage(pageId: string, direction: -1 | 1) {
		if (!siteId) return;
		const idx = pages.findIndex((p) => p.id === pageId);
		const targetIdx = idx + direction;
		if (targetIdx < 0 || targetIdx >= pages.length) return;
		const reordered = [...pages];
		const [moved] = reordered.splice(idx, 1);
		reordered.splice(targetIdx, 0, moved);
		const updated = reordered.map((p, i) => ({ ...p, sortOrder: i }));
		setPages(updated);
		const stmts = updated.map((p) =>
			fetch(`/api/sites/${siteId}/pages/${p.id}`, {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ sortOrder: p.sortOrder }),
			}),
		);
		await Promise.all(stmts).catch(() => {});
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Navigation
				</h2>
			</div>

			<div className="flex-1 overflow-y-auto px-3 py-2">
				<div className="flex flex-col gap-3">
					{/* Nav items */}
					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Pages in nav
						</label>
						<div className="flex flex-col gap-0.5">
							{pages.map((page, i) => {
								const visible = page.isVisible !== 0;
								const isEditing = editingLabel === page.id;
								return (
									<div
										key={page.id}
										className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5"
									>
										<div className="flex flex-col">
											<button
												type="button"
												onClick={() => movePage(page.id, -1)}
												disabled={i === 0}
												className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20"
											>
												<ChevronUp className="size-3" />
											</button>
											<button
												type="button"
												onClick={() => movePage(page.id, 1)}
												disabled={i === pages.length - 1}
												className="text-muted-foreground/50 hover:text-foreground disabled:opacity-20"
											>
												<ChevronDown className="size-3" />
											</button>
										</div>

										{isEditing ? (
											<input
												autoFocus
												value={labelValue}
												onChange={(e) => setLabelValue(e.target.value)}
												onBlur={() => updatePageLabel(page.id, labelValue)}
												onKeyDown={(e) => {
													if (e.key === "Enter") updatePageLabel(page.id, labelValue);
													if (e.key === "Escape") setEditingLabel(null);
												}}
												className="h-6 flex-1 rounded border border-ring bg-background px-1.5 text-xs outline-none"
											/>
										) : (
											<button
												type="button"
												onClick={() => {
													setEditingLabel(page.id);
													setLabelValue(page.label);
												}}
												className="flex-1 truncate text-left text-xs text-foreground hover:text-ring"
												title="Click to rename"
											>
												{page.label}
											</button>
										)}

										<button
											type="button"
											onClick={() => togglePageVisible(page.id, visible)}
											className="shrink-0 rounded p-0.5"
											title={visible ? "Hide from nav" : "Show in nav"}
										>
											{visible ? (
												<Eye className="size-3.5 text-emerald-500" />
											) : (
												<EyeOff className="size-3.5 text-muted-foreground/40" />
											)}
										</button>
									</div>
								);
							})}
						</div>
					</div>

					{/* Brand */}
					<div className="flex items-center justify-between">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Show site name
						</label>
						<Toggle on={showBrand} onToggle={() => updateSettings({ showNavBrand: showBrand ? 0 : 1 })} />
					</div>

					{/* Shape */}
					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Style
						</label>
						<div className="flex gap-1">
							{(["bar", "pill", "floating"] as const).map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => updateSettings({ navShape: s === "bar" ? null : s })}
									className={
										"flex-1 rounded-md border px-2 py-1.5 text-xs font-medium capitalize transition-colors " +
										(navShape === s || (s === "bar" && !settings.navShape)
											? "border-ring bg-accent text-accent-foreground"
											: "border-border text-muted-foreground hover:border-ring/50")
									}
								>
									{s}
								</button>
							))}
						</div>
					</div>

					{/* Position */}
					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Position
						</label>
						<div className="flex gap-1">
							{(["fixed", "scroll-away"] as const).map((p) => (
								<button
									key={p}
									type="button"
									onClick={() => updateSettings({ navPosition: p })}
									className={
										"flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors " +
										(navPosition === p
											? "border-ring bg-accent text-accent-foreground"
											: "border-border text-muted-foreground hover:border-ring/50")
									}
								>
									{p === "fixed" ? "Fixed" : "Scroll away"}
								</button>
							))}
						</div>
					</div>

					{/* Underline */}
					<div className="flex items-center justify-between">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Link underline
						</label>
						<Toggle
							on={(settings.navUnderline ?? "on") === "on"}
							onToggle={() =>
								updateSettings({
									navUnderline: (settings.navUnderline ?? "on") === "on" ? "off" : "on",
								})
							}
						/>
					</div>

					{/* Colors */}
					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Colors
						</label>
						<div className="flex flex-col gap-1.5">
							<ColorRow label="Background" value={settings.navBg ?? "white"} onChange={(v) => updateSettings({ navBg: v })} />
							<ColorRow label="Brand" value={settings.navBrandColor ?? "#1C1917"} onChange={(v) => updateSettings({ navBrandColor: v })} />
							<ColorRow label="Links" value={settings.navLinkColor ?? "#6B6560"} onChange={(v) => updateSettings({ navLinkColor: v })} />
							<ColorRow label="Highlight" value={settings.navHighlightColor ?? "#B8921A"} onChange={(v) => updateSettings({ navHighlightColor: v })} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className={
				"relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors " +
				(on ? "bg-emerald-500" : "bg-muted-foreground/30")
			}
		>
			<span
				className={
					"inline-block size-3.5 rounded-full bg-white shadow transition-transform " +
					(on ? "translate-x-[18px]" : "translate-x-[3px]")
				}
			/>
		</button>
	);
}

function ColorRow({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<div className="flex items-center gap-2">
			<label className="w-16 shrink-0 text-[11px] text-muted-foreground">{label}</label>
			<div className="flex flex-1 items-center gap-1.5">
				<input
					type="color"
					value={value.startsWith("#") ? value : "#ffffff"}
					onChange={(e) => onChange(e.target.value)}
					className="size-6 shrink-0 cursor-pointer rounded border border-border"
				/>
				<input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-ring"
				/>
			</div>
		</div>
	);
}
