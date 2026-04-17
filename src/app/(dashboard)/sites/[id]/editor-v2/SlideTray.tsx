"use client";

import { useEffect, useRef } from "react";

import { useEditorStore } from "@/app/stores/editorStore";

import { PagesTray } from "./trays/PagesTray";
import { ElementsTray } from "./trays/ElementsTray";
import { LayersTray } from "./trays/LayersTray";
import { ThemeTray } from "./trays/ThemeTray";
import { SettingsTray } from "./trays/SettingsTray";

const TRAY_WIDTH = 288;
const ANIM_MS = 200;

export function SlideTray() {
	const ref = useRef<HTMLDivElement>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const openTray = useEditorStore((s) => s.openTray);
	const setOpenTray = useEditorStore((s) => s.setOpenTray);
	const railCollapsed = useEditorStore((s) => s.railCollapsed);

	// Set the initial off-screen position instantly (before paint), then
	// enable the CSS transition so subsequent open/close are animated.
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		el.style.transform = `translateX(-${TRAY_WIDTH}px)`;
		el.style.pointerEvents = "none";
		const raf = requestAnimationFrame(() => {
			if (ref.current) {
				ref.current.style.transition = `transform ${ANIM_MS}ms ease-out, left ${ANIM_MS}ms ease-out`;
			}
		});
		return () => cancelAnimationFrame(raf);
	}, []);

	// Slide in / out on openTray changes.
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (closeTimer.current) clearTimeout(closeTimer.current);

		if (openTray) {
			el.style.pointerEvents = "auto";
			el.style.transform = "translateX(0px)";
		} else {
			el.style.transform = `translateX(-${TRAY_WIDTH}px)`;
			// Disable pointer events only after the slide-out animation finishes.
			closeTimer.current = setTimeout(() => {
				if (ref.current) ref.current.style.pointerEvents = "none";
			}, ANIM_MS);
		}

		return () => {
			if (closeTimer.current) clearTimeout(closeTimer.current);
		};
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
			// z-[9999] + isolate: sits above canvas, inspector, and all overlays.
			// transform/pointerEvents managed via useEffect to avoid Tailwind JIT
			// purge issues with dynamically toggled transform classes.
			className="absolute top-0 bottom-0 z-[9999] w-72 border-r border-border bg-slate-50 shadow-xl isolate"
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
