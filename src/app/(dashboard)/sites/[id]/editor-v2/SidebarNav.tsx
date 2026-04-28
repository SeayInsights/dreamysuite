"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion/mini";
import { ChevronRight } from "lucide-react";

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
 * Converts panel IDs to display labels.
 */
function formatPanelLabel(panelId: PanelId): string {
	const labels: Record<PanelId, string> = {
		elements: "Elements",
		photos: "Photos",
		videos: "Videos",
		music: "Music",
		effects: "Effects",
		"page-list": "Pages",
		navigation: "Nav",
		layers: "Layers",
		theme: "Theme",
		language: "Language",
		"site-settings": "Settings",
	};
	return labels[panelId];
}

/**
 * Horizontal tab switcher for multi-panel sections.
 * Shows animated indicator on active tab.
 */
function TabSwitcher({
	panels,
	activePanel,
	onSelect,
}: {
	panels: PanelId[];
	activePanel: Section | null;
	onSelect: (panelId: PanelId) => void;
}) {
	const indicatorRef = useRef<HTMLDivElement>(null);
	const tabRefs = useRef<Map<PanelId, HTMLButtonElement>>(new Map());

	// Animate indicator to active tab position
	useEffect(() => {
		const indicator = indicatorRef.current;
		if (!indicator) return;

		// Find active panel ID from activePanel Section
		const activePanelId = panels.find(
			(panelId) => PANEL_TO_SECTION[panelId] === activePanel
		);

		if (!activePanelId) {
			// No active tab - hide indicator
			indicator.style.opacity = "0";
			return;
		}

		const activeTab = tabRefs.current.get(activePanelId);
		if (!activeTab) return;

		// Show indicator and animate to position
		indicator.style.opacity = "1";
		animate(
			indicator,
			{
				x: activeTab.offsetLeft,
				width: activeTab.offsetWidth,
			},
			{
				duration: duration("selectionFade") / 1000,
				ease: EASING.standard,
			}
		);
	}, [activePanel, panels]);

	return (
		<div className="relative mx-1.5 mb-1">
			{/* Tab buttons */}
			<div className="flex gap-1 p-1 bg-muted/30 rounded-md">
				{panels.map((panelId) => {
					const sectionId = PANEL_TO_SECTION[panelId];
					const active = activePanel === sectionId;
					return (
						<button
							key={panelId}
							ref={(el) => {
								if (el) {
									tabRefs.current.set(panelId, el);
								} else {
									tabRefs.current.delete(panelId);
								}
							}}
							type="button"
							data-tray-trigger
							onClick={() => onSelect(panelId)}
							className={cn(
								"relative z-10 flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors",
								"hover:text-foreground",
								active
									? "text-foreground"
									: "text-muted-foreground"
							)}
							aria-label={formatPanelLabel(panelId)}
							aria-pressed={active}
							title={formatPanelLabel(panelId)}
						>
							{formatPanelLabel(panelId)}
						</button>
					);
				})}
			</div>

			{/* Animated indicator */}
			<div
				ref={indicatorRef}
				className="absolute bottom-1 left-1 h-[calc(100%-8px)] bg-accent rounded pointer-events-none"
				style={{
					opacity: 0,
					width: 0,
					transform: "translateX(0)",
				}}
			/>
		</div>
	);
}

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
