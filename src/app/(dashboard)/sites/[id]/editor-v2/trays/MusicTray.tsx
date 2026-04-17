"use client";

import { useState } from "react";
import { Music, Play, RotateCcw, ExternalLink } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";

export function MusicTray() {
	const settings = useEditorStore((s) => s.settings);
	const updateSettings = useEditorStore((s) => s.updateSettings);
	const pages = useEditorStore((s) => s.pages);

	const [urlDraft, setUrlDraft] = useState(settings.musicUrl ?? "");

	const songResetPages: string[] = (() => {
		try {
			const parsed = JSON.parse(settings.songResetPages ?? "");
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	})();

	function commitUrl() {
		const trimmed = urlDraft.trim();
		updateSettings({ musicUrl: trimmed || null });
	}

	function toggleResetPage(pageId: string) {
		const next = songResetPages.includes(pageId)
			? songResetPages.filter((id) => id !== pageId)
			: [...songResetPages, pageId];
		updateSettings({ songResetPages: next.length > 0 ? JSON.stringify(next) : null });
	}

	const hasMusic = !!settings.musicUrl;
	const sourceLabel = describeSource(settings.musicUrl);

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Music
				</h2>
			</div>

			<div className="flex-1 overflow-y-auto px-3 py-2">
				<div className="flex flex-col gap-3">
					{/* Source URL */}
					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Song link
						</label>
						<p className="text-[11px] text-muted-foreground">
							YouTube, Spotify, SoundCloud, or direct audio URL
						</p>
						<input
							type="url"
							value={urlDraft}
							onChange={(e) => setUrlDraft(e.target.value)}
							onBlur={commitUrl}
							onKeyDown={(e) => {
								if (e.key === "Enter") commitUrl();
							}}
							placeholder="https://youtube.com/watch?v=..."
							className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring"
						/>
						{hasMusic && sourceLabel && (
							<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
								<Music className="size-3" />
								<span>{sourceLabel}</span>
							</div>
						)}
						{hasMusic && <MusicPreview url={settings.musicUrl!} />}
					</div>

					{hasMusic && (
						<>
							{/* Autoplay */}
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between">
									<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
										Autoplay on open
									</label>
									<ToggleSwitch
										on={settings.popupAfterAnimation !== 1}
										onToggle={() =>
											updateSettings({
												popupAfterAnimation: settings.popupAfterAnimation === 1 ? 0 : 1,
											})
										}
									/>
								</div>
								<p className="text-[11px] text-muted-foreground">
									Start playing when visitors open the site
								</p>
							</div>

							{/* Per-page restart */}
							{pages.length > 0 && (
								<div className="flex flex-col gap-1">
									<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
										Restart song on page
									</label>
									<p className="text-[11px] text-muted-foreground">
										Song restarts from the beginning when visitors navigate to these pages
									</p>
									<div className="flex flex-col gap-0.5 rounded-md border border-border p-2">
										{pages.map((page) => {
											const on = songResetPages.includes(page.id);
											return (
												<button
													key={page.id}
													type="button"
													onClick={() => toggleResetPage(page.id)}
													className="flex items-center justify-between rounded px-1.5 py-1 transition-colors hover:bg-accent/30"
												>
													<span className="flex items-center gap-1.5 text-sm">
														<RotateCcw className={
															"size-3 " + (on ? "text-emerald-500" : "text-muted-foreground/30")
														} />
														<span className="truncate">{page.label}</span>
													</span>
													<span
														className={
															"relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors " +
															(on ? "bg-emerald-500" : "bg-muted-foreground/30")
														}
													>
														<span
															className={
																"inline-block size-3 rounded-full bg-white shadow transition-transform " +
																(on ? "translate-x-[13px]" : "translate-x-[2px]")
															}
														/>
													</span>
												</button>
											);
										})}
									</div>
								</div>
							)}

							{/* Remove music */}
							<button
								type="button"
								onClick={() => {
									updateSettings({ musicUrl: null, songResetPages: null });
									setUrlDraft("");
								}}
								className="text-xs text-destructive hover:underline"
							>
								Remove music
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
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

function MusicPreview({ url }: { url: string }) {
	const embed = getEmbedInfo(url);
	if (!embed) return null;

	if (embed.type === "audio") {
		return (
			<audio controls src={embed.src} className="w-full rounded-md" preload="metadata">
				<track kind="captions" />
			</audio>
		);
	}

	return (
		<iframe
			src={embed.src}
			title="Music preview"
			allow="autoplay; encrypted-media"
			className="w-full rounded-md border-0"
			style={{ height: embed.height }}
		/>
	);
}

type EmbedInfo =
	| { type: "iframe"; src: string; height: number }
	| { type: "audio"; src: string };

function getEmbedInfo(url: string): EmbedInfo | null {
	try {
		const u = new URL(url);

		// YouTube
		if (u.hostname === "youtu.be") {
			const id = u.pathname.slice(1).split("?")[0];
			if (id) return { type: "iframe", src: `https://www.youtube.com/embed/${id}`, height: 60 };
		}
		if (u.hostname.includes("youtube.com")) {
			const id = u.searchParams.get("v");
			if (id) return { type: "iframe", src: `https://www.youtube.com/embed/${id}`, height: 60 };
		}

		// Spotify — track, album, or playlist
		if (u.hostname.includes("spotify.com")) {
			const match = u.pathname.match(/\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
			if (match) return { type: "iframe", src: `https://open.spotify.com/embed/${match[1]}/${match[2]}?theme=0`, height: 80 };
		}

		// SoundCloud
		if (u.hostname.includes("soundcloud.com")) {
			return { type: "iframe", src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23B8921A&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`, height: 120 };
		}

		// Direct audio file
		const ext = u.pathname.split(".").pop()?.toLowerCase();
		if (ext && ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) {
			return { type: "audio", src: url };
		}
	} catch {
		// invalid URL
	}
	return null;
}

function describeSource(url: string | null): string | null {
	if (!url) return null;
	try {
		const u = new URL(url);
		if (u.hostname.includes("youtube") || u.hostname.includes("youtu.be")) return "YouTube";
		if (u.hostname.includes("spotify")) return "Spotify";
		if (u.hostname.includes("soundcloud")) return "SoundCloud";
		if (u.hostname.includes("apple")) return "Apple Music";
		const ext = u.pathname.split(".").pop()?.toLowerCase();
		if (ext && ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) return "Audio file";
		return u.hostname;
	} catch {
		return null;
	}
}
