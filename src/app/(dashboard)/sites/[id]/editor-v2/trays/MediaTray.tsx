"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Trash2, Film, Plus, X, Music } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";

interface Photo {
	id: string;
	r2Key: string;
	filename: string;
	mimeType: string;
	size: number;
	sortOrder: number;
}

export function MediaTray() {
	const [tab, setTab] = useState<"photos" | "videos" | "music">("photos");

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center gap-1 border-b border-border px-3 py-2">
				<button
					type="button"
					onClick={() => setTab("photos")}
					className={
						"rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
						(tab === "photos"
							? "bg-accent text-accent-foreground"
							: "text-muted-foreground hover:text-foreground")
					}
				>
					Photos
				</button>
				<button
					type="button"
					onClick={() => setTab("videos")}
					className={
						"rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
						(tab === "videos"
							? "bg-accent text-accent-foreground"
							: "text-muted-foreground hover:text-foreground")
					}
				>
					Videos
				</button>
				<button
					type="button"
					onClick={() => setTab("music")}
					className={
						"rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
						(tab === "music"
							? "bg-accent text-accent-foreground"
							: "text-muted-foreground hover:text-foreground")
					}
				>
					Music
				</button>
			</div>

			{tab === "photos" ? <PhotosPanel /> : tab === "videos" ? <VideosPanel /> : <MusicPanel />}
		</div>
	);
}

// ── Photos Panel ──────────────────────────────────────────────────────────

function PhotosPanel() {
	const siteId = useEditorStore((s) => s.siteId);
	const [photos, setPhotos] = useState<Photo[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!siteId) return;
		fetch(`/api/sites/${siteId}/photos`)
			.then((r) => (r.ok ? r.json() : Promise.reject()))
			.then((d) => setPhotos((d as { photos: Photo[] }).photos))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [siteId]);

	const uploadFiles = useCallback(
		async (files: FileList | File[]) => {
			if (!siteId) return;
			setUploading(true);
			const fileArr = Array.from(files);
			for (const file of fileArr) {
				const form = new FormData();
				form.append("file", file);
				try {
					const res = await fetch(`/api/sites/${siteId}/photos`, {
						method: "POST",
						body: form,
					});
					if (res.ok) {
						const { photo } = (await res.json()) as { photo: Photo };
						setPhotos((prev) => [...prev, photo]);
					}
				} catch {
					/* skip failed uploads */
				}
			}
			setUploading(false);
		},
		[siteId],
	);

	async function deletePhoto(photoId: string) {
		if (!siteId) return;
		await fetch(`/api/sites/${siteId}/photos/${photoId}`, { method: "DELETE" });
		setPhotos((prev) => prev.filter((p) => p.id !== photoId));
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		setDragOver(false);
		if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
	}

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<div
				className={
					"mx-3 mt-2 flex cursor-pointer flex-col items-center gap-1.5 rounded-md border-2 border-dashed px-3 py-4 transition-colors " +
					(dragOver
						? "border-primary bg-primary/5"
						: "border-border hover:border-primary/40")
				}
				onClick={() => inputRef.current?.click()}
				onDragOver={(e) => {
					e.preventDefault();
					setDragOver(true);
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={handleDrop}
			>
				<Upload className="size-5 text-muted-foreground" />
				<p className="text-xs text-muted-foreground">
					{uploading ? "Uploading..." : "Drop photos or click to upload"}
				</p>
				<input
					ref={inputRef}
					type="file"
					accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
					multiple
					className="hidden"
					onChange={(e) => {
						if (e.target.files?.length) uploadFiles(e.target.files);
						e.target.value = "";
					}}
				/>
			</div>

			<div className="flex-1 overflow-y-auto p-3">
				{loading ? (
					<p className="text-center text-xs text-muted-foreground">Loading...</p>
				) : photos.length === 0 ? (
					<p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
						No photos yet
					</p>
				) : (
					<div className="grid grid-cols-3 gap-1.5">
						{photos.map((photo) => (
							<div key={photo.id} className="group relative aspect-square overflow-hidden rounded-md bg-muted">
								<img
									src={`/api/sites/${siteId}/photos/${photo.id}`}
									alt={photo.filename}
									className="size-full object-cover"
								/>
								<button
									type="button"
									onClick={() => deletePhoto(photo.id)}
									className="absolute right-1 top-1 rounded bg-black/60 p-0.5 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
									title="Delete"
								>
									<Trash2 className="size-3" />
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

// ── Videos Panel ──────────────────────────────────────────────────────────

function VideosPanel() {
	const siteId = useEditorStore((s) => s.siteId);
	const [url, setUrl] = useState("");
	const [videos, setVideos] = useState<{ id: string; url: string; title: string | null }[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!siteId) return;
		fetch(`/api/sites/${siteId}/media?type=video`)
			.then((r) => (r.ok ? r.json() : Promise.reject()))
			.then((d) => setVideos((d as { items: { id: string; url: string; title: string | null }[] }).items))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [siteId]);

	async function addVideo() {
		const trimmed = url.trim();
		if (!trimmed || !siteId) return;
		const label = extractVideoLabel(trimmed);
		try {
			const res = await fetch(`/api/sites/${siteId}/media`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ url: trimmed, title: label, mediaType: "video" }),
			});
			if (res.ok) {
				const { item } = (await res.json()) as { item: { id: string; url: string; title: string | null } };
				setVideos((prev) => [...prev, item]);
			}
		} catch { /* skip */ }
		setUrl("");
	}

	async function removeVideo(id: string) {
		if (!siteId) return;
		await fetch(`/api/sites/${siteId}/media/${id}`, { method: "DELETE" }).catch(() => {});
		setVideos((prev) => prev.filter((v) => v.id !== id));
	}

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<div className="flex flex-col gap-1 px-3 pt-2">
				<p className="text-[11px] text-muted-foreground">
					Paste a YouTube or Vimeo link
				</p>
				<div className="flex gap-1.5">
					<input
						type="url"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") addVideo();
						}}
						placeholder="https://youtube.com/watch?v=..."
						className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring"
					/>
					<button
						type="button"
						onClick={addVideo}
						disabled={!url.trim()}
						className="flex shrink-0 items-center gap-1 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
					>
						<Plus className="size-3.5" />
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-3">
				{loading ? (
					<p className="text-center text-xs text-muted-foreground">Loading...</p>
				) : videos.length === 0 ? (
					<div className="flex flex-col items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-4 text-center">
						<Film className="size-5 text-muted-foreground" />
						<p className="text-xs text-muted-foreground">No videos added yet</p>
					</div>
				) : (
					<div className="flex flex-col gap-1.5">
						{videos.map((video) => (
							<div
								key={video.id}
								className="group flex items-center gap-2 rounded-md border border-border px-2.5 py-2"
							>
								<Film className="size-3.5 shrink-0 text-muted-foreground" />
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm">{video.title || "Video"}</p>
									<p className="truncate text-[11px] text-muted-foreground">{video.url}</p>
								</div>
								<button
									type="button"
									onClick={() => removeVideo(video.id)}
									className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
								>
									<X className="size-3.5" />
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function extractVideoLabel(url: string): string {
	try {
		const u = new URL(url);
		if (u.hostname.includes("youtube") || u.hostname.includes("youtu.be")) return "YouTube video";
		if (u.hostname.includes("vimeo")) return "Vimeo video";
		return u.hostname;
	} catch {
		return "Video";
	}
}

// ── Music Panel ──────────────────────────────────────────────────────────

function MusicPanel() {
	const musicUrl = useEditorStore((s) => s.settings.musicUrl);
	const updateSettings = useEditorStore((s) => s.updateSettings);
	const [urlDraft, setUrlDraft] = useState(musicUrl ?? "");

	function commitUrl() {
		const trimmed = urlDraft.trim();
		updateSettings({ musicUrl: trimmed || null });
	}

	return (
		<div className="flex flex-1 flex-col overflow-hidden px-3 pt-2">
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-1.5">
					<label className="text-xs font-medium">Background Music URL</label>
					<p className="text-[11px] text-muted-foreground">
						Paste a direct MP3/audio URL
					</p>
					<input
						type="url"
						value={urlDraft}
						onChange={(e) => setUrlDraft(e.target.value)}
						onBlur={commitUrl}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								commitUrl();
								e.currentTarget.blur();
							}
						}}
						placeholder="https://example.com/song.mp3"
						className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-ring"
					/>
				</div>

				{musicUrl && (
					<div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
						<Music className="size-4 text-muted-foreground" />
						<p className="flex-1 truncate text-xs">Music loaded</p>
					</div>
				)}
			</div>
		</div>
	);
}
