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

/**
 * Converts panel IDs to display labels.
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
	const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
					const isExpanded = expandedSection === section.id;

					// Single-panel sections (like Settings) open directly
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
									"flex h-9 items-center gap-3 rounded-md px-2 text-sm transition-colors",
									"text-muted-foreground hover:bg-accent hover:text-accent-foreground",
									active && "bg-accent text-accent-foreground",
								)}
								aria-label={section.label}
								aria-pressed={active}
								title={section.label}
							>
								<section.icon className="size-5 shrink-0" />
								<span className="whitespace-nowrap font-medium">{section.label}</span>
							</button>
						);
					}

					// Multi-panel sections show expandable section header
					return (
						<div key={section.id} className="flex flex-col gap-0.5">
							<button
								type="button"
								onClick={() => setExpandedSection(isExpanded ? null : section.id)}
								className={cn(
									"flex h-9 items-center gap-2 rounded-md px-2 text-sm transition-colors",
									"text-muted-foreground hover:bg-accent/50",
									isExpanded && "bg-accent/30",
								)}
								aria-label={`${section.label} section`}
								aria-expanded={isExpanded}
								title={section.label}
							>
								<section.icon className="size-5 shrink-0" />
								<span className="flex-1 whitespace-nowrap font-medium text-left">{section.label}</span>
								<ChevronRight
									className={cn(
										"size-4 shrink-0 transition-transform",
										isExpanded && "rotate-90"
									)}
								/>
							</button>

							{/* Nested sub-panels */}
							{isExpanded && section.panels && (
								<div className="ml-6 flex flex-col gap-0.5">
									{section.panels.map((panelId) => {
										const sectionId = PANEL_TO_SECTION[panelId];
										const active = openTray === sectionId;
										return (
											<button
												key={panelId}
												type="button"
												data-tray-trigger
												onClick={() => setOpenTray(active ? null : sectionId)}
												className={cn(
													"flex h-8 items-center gap-2 rounded-md px-2 text-xs transition-colors",
													"text-muted-foreground hover:bg-accent hover:text-accent-foreground",
													active && "bg-accent text-accent-foreground",
												)}
												aria-label={formatPanelLabel(panelId)}
												aria-pressed={active}
												title={formatPanelLabel(panelId)}
											>
												<span className="whitespace-nowrap font-medium">{formatPanelLabel(panelId)}</span>
											</button>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</nav>
		</div>
	);
}
