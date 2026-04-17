"use client";

import { FileText, Home, Plus } from "lucide-react";

const PAGES = [
	{ id: "home", label: "Home", icon: Home, active: true },
];

export function PagesTray() {
	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Pages
				</h2>
				<span className="text-xs text-muted-foreground">{PAGES.length}</span>
			</div>

			<nav className="flex-1 overflow-y-auto p-2">
				{PAGES.map(({ id, label, icon: Icon, active }) => (
					<button
						key={id}
						type="button"
						className={
							"flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors " +
							(active
								? "bg-accent text-accent-foreground"
								: "text-muted-foreground hover:bg-accent/50")
						}
					>
						<Icon className="size-4 shrink-0" />
						<span className="flex-1 truncate">{label}</span>
					</button>
				))}

				<button
					type="button"
					disabled
					className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-muted-foreground/60"
					title="Multi-page support coming soon"
				>
					<Plus className="size-4 shrink-0" />
					<span>Add page</span>
				</button>
			</nav>

			<div className="border-t border-border px-4 py-3">
				<p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
					<FileText className="size-3" />
					Multi-page arrives with the publishing phase
				</p>
			</div>
		</div>
	);
}
