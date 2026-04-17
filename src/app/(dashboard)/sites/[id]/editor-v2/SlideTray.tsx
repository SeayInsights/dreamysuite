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

export function SlideTray() {
	const ref = useRef<HTMLDivElement>(null);
	const hasOpenedOnce = useRef(false);
	const openTray = useEditorStore((s) => s.openTray);
	const setOpenTray = useEditorStore((s) => s.setOpenTray);
	const railCollapsed = useEditorStore((s) => s.railCollapsed);

	// Slide in / out with Motion One.
	// On initial mount (openTray = null, hasOpenedOnce = false) just position off-screen
	// without animation — avoids the "snap to 0px then slide away" flash that explicit
	// from-keyframes would cause.
	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		if (openTray) {
			hasOpenedOnce.current = true;
			el.style.pointerEvents = "auto";
			animate(
				el,
				{ x: [`-${TRAY_WIDTH}px`, "0px"] },
				{ duration: duration("traySlide") / 1000, ease: EASING.enter },
			).finished.then(() => {
				if (ref.current) ref.current.style.transform = "translateX(0px)";
			});
		} else if (hasOpenedOnce.current) {
			animate(
				el,
				{ x: ["0px", `-${TRAY_WIDTH}px`] },
				{ duration: duration("traySlide") / 1000, ease: EASING.exit },
			).finished.then(() => {
				if (ref.current) {
					ref.current.style.transform = `translateX(-${TRAY_WIDTH}px)`;
					ref.current.style.pointerEvents = "none";
				}
			});
		} else {
			el.style.transform = `translateX(-${TRAY_WIDTH}px)`;
			el.style.pointerEvents = "none";
		}
	}, [openTray]);

	// Close when the user clicks outside the tray.
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
			// position:fixed — bypasses the parent overflow:hidden clip and all
			// intermediate stacking contexts. top-12 clears the 48px TopBar.
			// transform/pointerEvents managed via useEffect.
			className="fixed top-12 bottom-0 z-[15] w-72 border-r border-border bg-white shadow-xl"
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
