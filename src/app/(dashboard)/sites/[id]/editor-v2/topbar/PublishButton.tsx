"use client";

import { useState } from "react";
import { Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
	siteId: string;
}

export function PublishButton({ siteId }: Props) {
	const [publishing, setPublishing] = useState(false);

	async function handlePublish() {
		setPublishing(true);
		try {
			await fetch(`/api/sites/${siteId}/settings`, {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ isLive: 1 }),
			});
		} finally {
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
