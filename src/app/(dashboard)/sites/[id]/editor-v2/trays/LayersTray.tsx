"use client";

import { Layers } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";

export function LayersTray() {
	const selectedBlockId = useEditorStore((s) => s.selectedBlockId);

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Layers
				</h2>
			</div>

			<div className="flex-1 overflow-y-auto p-3">
				{/* Stub blocks match StubCanvas so users see structure reflected here. */}
				<ul className="space-y-0.5">
					<LayerItem label="Hero" depth={0} active={selectedBlockId === "stub-1"} />
					<LayerItem label="Story" depth={0} active={selectedBlockId === "stub-2"} />
					<LayerItem label="RSVP" depth={0} active={selectedBlockId === "stub-3"} />
				</ul>
			</div>

			<div className="border-t border-border px-4 py-3">
				<p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
					<Layers className="size-3" />
					Full outliner arrives with the canvas phase
				</p>
			</div>
		</div>
	);
}

function LayerItem({
	label,
	depth,
	active,
}: {
	label: string;
	depth: number;
	active: boolean;
}) {
	return (
		<li>
			<button
				type="button"
				className={
					"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors " +
					(active
						? "bg-accent text-accent-foreground"
						: "text-muted-foreground hover:bg-accent/50")
				}
				style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
			>
				<span className="size-1.5 rounded-full bg-current opacity-40" />
				<span className="flex-1 truncate">{label}</span>
			</button>
		</li>
	);
}
