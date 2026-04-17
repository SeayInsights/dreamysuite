"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

import { useEditorStore } from "@/app/stores/editorStore";

import { PagesTray } from "./trays/PagesTray";
import { ElementsTray } from "./trays/ElementsTray";
import { LayersTray } from "./trays/LayersTray";
import { ThemeTray } from "./trays/ThemeTray";
import { SettingsTray } from "./trays/SettingsTray";

export function SlideTray() {
	const ref = useRef<HTMLDivElement>(null);
	const openTray = useEditorStore((s) => s.openTray);
	const setOpenTray = useEditorStore((s) => s.setOpenTray);
	const railCollapsed = useEditorStore((s) => s.railCollapsed);

	useEffect(() => {
		if (!openTray) return;
		const handler = (e: MouseEvent) => {
			const target = e.target as HTMLElement | null;
			if (!target) return;
			if (ref.current?.contains(target)) return;
			if (target.closest("[data-tray-trigger]")) return;
			setOpenTray(null);
		};
		const t = window.setTimeout(() => {
			document.addEventListener("mousedown", handler);
		}, 0);
		return () => {
			window.clearTimeout(t);
			document.removeEventListener("mousedown", handler);
		};
	}, [openTray, setOpenTray]);

	return (
		<div
			ref={ref}
			role="dialog"
			aria-hidden={!openTray}
			className={cn(
				"absolute top-0 bottom-0 z-[150] w-72 border-r border-border bg-slate-50 shadow-lg",
				"transition-[transform,left] duration-200 ease-out",
				openTray
					? "translate-x-0 pointer-events-auto"
					: "-translate-x-full pointer-events-none",
			)}
			style={{ left: railCollapsed ? 0 : 48 }}
		>
			{openTray === "pages" && <PagesTray />}
			{openTray === "elements" && <ElementsTray />}
			{openTray === "layers" && <LayersTray />}
			{openTray === "theme" && <ThemeTray />}
			{openTray === "settings" && <SettingsTray />}
		</div>
	);
}
