"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/mini";
import type { LucideIcon } from "lucide-react";

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
	media: "media",
	effects: "effects",
	"page-list": "pages",
	navigation: "navigation",
	layers: "layers",
	theme: "theme",
	language: "language",
	music: "music",
	"site-settings": "settings",
};

type NavItem = { id: Section; label: string; Icon: LucideIcon };

/**
 * Flattens SIDEBAR_SECTIONS into a flat list of nav items for Phase 2.
 * Phase 3 will implement the nested panel routing.
 */
function flattenSidebarSections(): NavItem[] {
	const items: NavItem[] = [];

	for (const section of SIDEBAR_SECTIONS) {
		if (section.panels) {
			// Multi-panel section - expand into individual items
			for (const panelId of section.panels) {
				const sectionId = PANEL_TO_SECTION[panelId];
				items.push({
					id: sectionId,
					label: formatPanelLabel(panelId),
					Icon: section.icon,
				});
			}
		} else if (section.panel) {
			// Single-panel section
			const sectionId = PANEL_TO_SECTION[section.panel];
			items.push({
				id: sectionId,
				label: section.label,
				Icon: section.icon,
			});
		}
	}

	return items;
}

/**
 * Converts panel IDs to display labels.
 * e.g., "page-list" → "Pages", "site-settings" → "Settings"
 */
function formatPanelLabel(panelId: PanelId): string {
	const labels: Record<PanelId, string> = {
		elements: "Elements",
		media: "Media",
		effects: "Effects",
		"page-list": "Pages",
		navigation: "Nav",
		layers: "Layers",
		theme: "Theme",
		language: "Language",
		music: "Music",
		"site-settings": "Settings",
	};
	return labels[panelId];
}

const NAV_ITEMS = flattenSidebarSections();

/**
 * 48px vertical navigation sidebar.
 *
 * On first mount the sidebar renders at 240px (labels visible) and animates to
 * 48px within 250ms — the "auto-collapse on editor entry" reveal. After that
 * the `[` key toggles between 48px (default) and 0px (hidden entirely).
 *
 * State lives in editorShell.railCollapsed. Mount animation is a one-shot
 * visual effect and does not touch state.
 *
 * Phase 2: Renders flat list from SIDEBAR_SECTIONS config.
 * Phase 3: Will implement nested panel routing with slide-out panels.
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
				{NAV_ITEMS.map(({ id, label, Icon }) => {
					const active = openTray === id;
					return (
						<button
							key={id}
							type="button"
							data-tray-trigger
							onClick={() => setOpenTray(active ? null : id)}
							className={cn(
								"flex h-9 items-center gap-3 rounded-md px-2 text-sm transition-colors",
								"text-muted-foreground hover:bg-accent hover:text-accent-foreground",
								active && "bg-accent text-accent-foreground",
							)}
							aria-label={label}
							aria-pressed={active}
							title={label}
						>
							<Icon className="size-5 shrink-0" />
							<span className="whitespace-nowrap font-medium">{label}</span>
						</button>
					);
				})}
			</nav>
		</div>
	);
}
