"use client";

import { ChevronLeft } from "lucide-react";

export function PanelHeader({ label, onBack }: { label: string; onBack: () => void }) {
	return (
		<div className="flex items-center gap-2 border-b border-border px-3 py-2">
			<button type="button" onClick={onBack} className="rounded p-0.5 hover:bg-accent/50">
				<ChevronLeft className="size-4 text-muted-foreground" />
			</button>
			<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				{label}
			</h2>
		</div>
	);
}
