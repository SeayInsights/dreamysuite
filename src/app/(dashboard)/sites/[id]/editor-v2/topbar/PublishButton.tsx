"use client";

import { useState } from "react";
import { Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/app/stores/editorStore";
import { trackEditorSave } from "@/lib/telemetry/editor";

interface Props {
	siteId: string;
}

export function PublishButton({ siteId }: Props) {
	const [publishing, setPublishing] = useState(false);
	const saveSettings = useEditorStore((s) => s.saveSettings);

	async function handlePublish() {
		setPublishing(true);
		const start = performance.now();
		let ok = false;
		try {
			await saveSettings(siteId);
			const res = await fetch(`/api/sites/${siteId}/settings`, {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ isLive: 1 }),
			});
			ok = res.ok;
		} finally {
			trackEditorSave(siteId, ok, performance.now() - start);
			setPublishing(false);
		}
	}

	return (
		<Button
			type="button"
			size="sm"
			onClick={handlePublish}
			disabled={publishing}
			className="h-8 gap-1.5"
		>
			<Rocket className="size-4" />
			<span>{publishing ? "Publishing..." : "Publish"}</span>
		</Button>
	);
}
