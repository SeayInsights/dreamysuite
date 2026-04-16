"use client";

import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
	slug: string;
}

export function PreviewButton({ slug }: Props) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onClick={() => window.open(`/${slug}`, "_blank", "noopener,noreferrer")}
			aria-label="Preview site"
			title="Preview (opens in new tab)"
			className="h-8 gap-1.5"
		>
			<Eye className="size-4" />
			<span>Preview</span>
		</Button>
	);
}
