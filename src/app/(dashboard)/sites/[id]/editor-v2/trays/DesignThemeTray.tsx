"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { NavigationTray } from "./NavigationTray";
import { ThemeTray } from "./ThemeTray";

type TabId = "navigation" | "theme" | "effects";
const TABS: { id: TabId; label: string }[] = [
	{ id: "navigation", label: "Navigation" },
	{ id: "theme", label: "Theme" },
	{ id: "effects", label: "Effects" },
];

export function DesignThemeTray() {
	const [activeTab, setActiveTab] = useState<TabId>("navigation");

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Design & Theme
				</h2>
			</div>

			<div
				role="tablist"
				aria-label="Design and theme tabs"
				className="flex items-center gap-0.5 border-b border-border px-2 py-1.5"
			>
				{TABS.map((t) => {
					const active = activeTab === t.id;
					return (
						<button
							key={t.id}
							type="button"
							role="tab"
							aria-selected={active}
							onClick={() => setActiveTab(t.id)}
							className={cn(
								"h-7 rounded-sm px-2 text-xs font-medium transition-colors",
								active
									? "bg-accent text-accent-foreground"
									: "text-muted-foreground hover:bg-accent/50",
							)}
						>
							{t.label}
						</button>
					);
				})}
			</div>

			<div role="tabpanel" className="h-[calc(100%-5.25rem)] overflow-hidden">
				{activeTab === "navigation" ? (
					<NavigationTray />
				) : activeTab === "theme" ? (
					<ThemeTray />
				) : (
					<div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
						Effects coming soon
					</div>
				)}
			</div>
		</div>
	);
}
