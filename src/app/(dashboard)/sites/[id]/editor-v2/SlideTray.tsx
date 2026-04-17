"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/mini";

import { useEditorStore } from "@/app/stores/editorStore";
import { duration, EASING } from "@/lib/motion";

import { PagesTray } from "./trays/PagesTray";
import { ElementsTray } from "./trays/ElementsTray";
import { LayersTray } from "./trays/LayersTray";
import { ThemeTray } from "./trays/ThemeTray";
import { SettingsTray } from "./trays/SettingsTray";

const TRAY_WIDTH = 288;

/**
 * Slide-out tray that overlays the canvas (does not push it).
 *
 * Opens when editorShell.openTray is set via the IconRail. Closes on:
 *   - Clicking the same rail button again
 *   - Clicking anywhere outside the tray that isn't another rail button
 */
export function SlideTray() {
	const ref = useRef<HTMLDivElement>(null);
	const wasOpen = useRef(false);
	const openTray = useEditorStore((s) => s.openTray);
	const setOpenTray = useEditorStore((s) => s.setOpenTray);
	const railCollapsed = useEditorStore((s) => s.railCollapsed);

	// Initialize off-screen without an inline style that WAAPI would fight.
	useEffect(() => {
		if (ref.current) ref.current.style.transform = `translateX(-${TRAY_WIDTH}px)`;
	}, []);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (openTray) {
			el.style.pointerEvents = "auto";
			animate(
				el,
				{ x: [wasOpen.current ? "0px" : `-${TRAY_WIDTH}px`, "0px"] },
				{
					duration: duration("traySlide") / 1000,
					ease: EASING.enter,
				},
			).finished.then(() => {
				if (ref.current) ref.current.style.transform = "translateX(0px)";
			});
			wasOpen.current = true;
			return;
		}
		if (wasOpen.current) {
			animate(
				el,
				{ x: ["0px", `-${TRAY_WIDTH}px`] },
				{
					duration: duration("traySlide") / 1000,
					ease: EASING.exit,
				},
			).finished.then(() => {
				if (ref.current) {
					ref.current.style.transform = `translateX(-${TRAY_WIDTH}px)`;
					ref.current.style.pointerEvents = "none";
				}
			});
			wasOpen.current = false;
		}
	}, [openTray]);

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
			className="pointer-events-none absolute top-0 bottom-0 z-[150] w-72 border-r border-border bg-white shadow-lg transition-[left] duration-200"
			style={{
				left: railCollapsed ? 0 : 48,
			}}
		>
			{openTray === "pages" && <PagesTray />}
			{openTray === "elements" && <ElementsTray />}
			{openTray === "layers" && <LayersTray />}
			{openTray === "theme" && <ThemeTray />}
			{openTray === "settings" && <SettingsTray />}
		</div>
	);
}
