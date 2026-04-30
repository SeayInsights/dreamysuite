"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/mini";

import { cn } from "@/lib/utils";
import { useEditorStore, type Section } from "@/app/stores/editorStore";
import { duration, EASING } from "@/lib/motion";
import { SIDEBAR_SECTIONS, type PanelId } from "./lib/sidebarConfig";

/**
 * Maps PanelId (from sidebarConfig) to Section (from editorStore).
 * This bridges the new sidebar structure with the existing tray system.
 */
const PANEL_TO_SECTION: Record<PanelId, Section> = {
	elements: "elements",
	photos: "photos",
	videos: "videos",
	music: "music",
	effects: "effects",
	"page-list": "pages",
	navigation: "navigation",
	layers: "layers",
	theme: "theme",
	language: "language",
	"site-settings": "settings",
};



/**
 * 48px vertical navigation sidebar with 4-section consolidation.
 *
 * On first mount the sidebar renders at 240px (labels visible) and animates to
 * 48px within 250ms. After that the `[` key toggles between 48px and 0px.
 *
 * Phase 2: Implements nested panel routing - 4 sections expand to show sub-panels.
 */
export function SidebarNav() {
	const ref = useRef<HTMLDivElement>(null);
	const didMount = useRef(false);
	const railCollapsed = useEditorStore((s) => s.railCollapsed);
	const openTray = useEditorStore((s) => s.openTray);
	const setOpenTray = useEditorStore((s) => s.setOpenTray);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const target = railCollapsed ? 0 : 48;
		if (!didMount.current) {
			el.style.width = "240px";
			didMount.current = true;
		}
		animate(
			el,
			{ width: `${target}px` },
			{
				duration: duration("railSlide") / 1000,
				ease: EASING.standard,
			},
		);
	}, [railCollapsed]);

	return (
		<div
			ref={ref}
			className="relative z-20 h-full shrink-0 overflow-hidden border-r border-border bg-white"
			style={{ width: 48 }}
			aria-label="Editor navigation sidebar"
		>
			<nav className="flex flex-col gap-1 p-1.5">
				{SIDEBAR_SECTIONS.map((section) => {
					// Single-panel sections open directly
					if (section.panel) {
						const sectionId = PANEL_TO_SECTION[section.panel];
						const active = openTray === sectionId;
						return (
							<button
								key={section.id}
								type="button"
								data-tray-trigger
								onClick={() => setOpenTray(active ? null : sectionId)}
								className={cn(
									"flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors",
									"text-muted-foreground hover:bg-accent hover:text-accent-foreground",
									active && "bg-accent text-accent-foreground",
								)}
								aria-label={section.label}
								aria-pressed={active}
								title={section.label}
							>
								<section.icon className="size-5 shrink-0" />
							</button>
						);
					}

					// Multi-panel sections open tray with first panel
					const firstPanel = section.panels?.[0];
					if (!firstPanel) return null;

					const sectionId = PANEL_TO_SECTION[firstPanel];
					// Check if ANY of this section's panels are active
					const active = section.panels?.some(
						panelId => PANEL_TO_SECTION[panelId] === openTray
					);

					return (
						<button
							key={section.id}
							type="button"
							data-tray-trigger
							onClick={() => setOpenTray(active ? null : sectionId)}
							className={cn(
								"flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors",
								"text-muted-foreground hover:bg-accent hover:text-accent-foreground",
								active && "bg-accent text-accent-foreground",
							)}
							aria-label={section.label}
							aria-pressed={active}
							title={section.label}
						>
							<section.icon className="size-5 shrink-0" />
						</button>
					);
				})}
			</nav>
		</div>
	);
}
