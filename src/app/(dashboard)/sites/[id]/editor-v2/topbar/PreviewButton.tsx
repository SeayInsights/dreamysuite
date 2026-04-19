"use client";

import { useEffect, useCallback } from "react";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ShortcutEvent } from "../hooks/useShortcuts";

interface Props {
	siteId: string;
}

export function PreviewButton({ siteId }: Props) {
	const openPreview = useCallback(() => {
		window.open(`/preview/${siteId}`, "_blank", "noopener,noreferrer");
	}, [siteId]);

	useEffect(() => {
		function onShortcut(e: Event) {
			const detail = (e as CustomEvent<ShortcutEvent>).detail;
			if (detail?.kind === "preview:open") openPreview();
		}
		window.addEventListener("editor-v2:shortcut", onShortcut);
		return () => window.removeEventListener("editor-v2:shortcut", onShortcut);
	}, [openPreview]);

	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onClick={openPreview}
			aria-label="Preview site"
			title="Preview (P)"
			className="h-8 gap-1.5"
		>
			<Eye className="size-4" />
			<span>Preview</span>
		</Button>
	);
}
