"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/mini";
import {
	FileText,
	Plus,
	Layers,
	Palette,
	PanelTop,
	Image as ImageIcon,
	Music,
	Sparkles,
	Languages,
	Settings as SettingsIcon,
	type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useEditorStore, type Section } from "@/app/stores/editorStore";
import { duration, EASING } from "@/lib/motion";

type RailItem = { id: Section; label: string; Icon: LucideIcon };

const ITEMS: RailItem[] = [
	{ id: "pages", label: "Pages", Icon: FileText },
	{ id: "elements", label: "Elements", Icon: Plus },
	{ id: "layers", label: "Layers", Icon: Layers },
	{ id: "theme", label: "Theme", Icon: Palette },
	{ id: "navigation", label: "Nav", Icon: PanelTop },
	{ id: "media", label: "Media", Icon: ImageIcon },
	{ id: "music", label: "Music", Icon: Music },
	{ id: "effects", label: "Effects", Icon: Sparkles },
	{ id: "language", label: "Language", Icon: Languages },
	{ id: "settings", label: "Settings", Icon: SettingsIcon },
];

/**
 * 48px vertical icon rail.
 *
 * On first mount the rail renders at 240px (labels visible) and animates to
 * 48px within 250ms — the "auto-collapse on editor entry" reveal. After that
 * the `[` key toggles between 48px (default) and 0px (hidden entirely).
 *
 * State lives in editorShell.railCollapsed. Mount animation is a one-shot
 * visual effect and does not touch state.
 */
export function IconRail() {
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
			aria-label="Editor navigation rail"
		>
			<nav className="flex flex-col gap-1 p-1.5">
				{ITEMS.map(({ id, label, Icon }) => {
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
