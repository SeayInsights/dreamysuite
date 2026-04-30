"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { useEditorStore } from "@/app/stores/editorStore";

interface Photo {
	id: string;
	r2Key: string;
	filename: string;
	mimeType: string;
	size: number;
	sortOrder: number;
}

interface Props {
	value: string | null;
	onChange: (url: string | null) => void;
	label?: string;
}

export function SitePhotoPicker({ value, onChange, label }: Props) {
	const siteId = useEditorStore((s) => s.siteId);
	const [photos, setPhotos] = useState<Photo[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!siteId) return;
		fetch(`/api/sites/${siteId}/photos`)
			.then((r) => (r.ok ? r.json() : Promise.reject()))
			.then((d) => setPhotos((d as { photos: Photo[] }).photos))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [siteId]);

	const photoUrl = useCallback(
		(id: string) => `/api/sites/${siteId}/photos/${id}`,
		[siteId],
	);

	const selectedId = photos.find((p) => value === photoUrl(p.id))?.id ?? null;

	return (
		<div className="space-y-1.5">
			{label && (
				<label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
					{label}
				</label>
			)}

			{value && (
				<div className="relative h-20 overflow-hidden rounded border border-border">
					<Image
						src={value}
						alt="Selected"
						fill
						className="object-cover"
						onError={(e) => {
							(e.target as HTMLImageElement).style.display = "none";
						}}
					/>
					<button
						type="button"
						onClick={() => onChange(null)}
						className="absolute right-1 top-1 rounded bg-black/60 p-0.5 text-white hover:bg-black/80"
						title="Remove"
					>
						<X className="size-3" />
					</button>
				</div>
			)}

			{loading ? (
				<p className="py-2 text-center text-[10px] text-muted-foreground">Loading photos...</p>
			) : photos.length === 0 ? (
				<div className="flex flex-col items-center gap-1 rounded-md border border-dashed border-border px-3 py-3">
					<ImagePlus className="size-4 text-muted-foreground" />
					<p className="text-[10px] text-muted-foreground">
						Upload photos in the Media tray first
					</p>
				</div>
			) : (
				<div className="grid grid-cols-4 gap-1">
					{photos.map((photo) => {
						const url = photoUrl(photo.id);
						const isSelected = selectedId === photo.id;
						return (
							<button
								key={photo.id}
								type="button"
								onClick={() => onChange(isSelected ? null : url)}
								className={
									"relative aspect-square overflow-hidden rounded-md ring-2 transition-all " +
									(isSelected
										? "ring-primary"
										: "ring-transparent hover:ring-primary/40")
								}
							>
								<Image
									src={url}
									alt={photo.filename}
									fill
									className="object-cover"
								/>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
