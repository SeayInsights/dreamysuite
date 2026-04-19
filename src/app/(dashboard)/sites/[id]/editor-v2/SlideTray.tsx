"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

import { useEditorStore } from "@/app/stores/editorStore";
import { prefersReducedMotion } from "@/lib/motion";

const PagesTray = dynamic(() => import("./trays/PagesTray").then((m) => ({ default: m.PagesTray })));
const ElementsTray = dynamic(() => import("./trays/ElementsTray").then((m) => ({ default: m.ElementsTray })));
const LayersTray = dynamic(() => import("./trays/LayersTray").then((m) => ({ default: m.LayersTray })));
const ThemeTray = dynamic(() => import("./trays/ThemeTray").then((m) => ({ default: m.ThemeTray })));
const MediaTray = dynamic(() => import("./trays/MediaTray").then((m) => ({ default: m.MediaTray })));
const MusicTray = dynamic(() => import("./trays/MusicTray").then((m) => ({ default: m.MusicTray })));
const NavigationTray = dynamic(() => import("./trays/NavigationTray").then((m) => ({ default: m.NavigationTray })));
const EffectsTray = dynamic(() => import("./trays/EffectsTray").then((m) => ({ default: m.EffectsTray })));
const LanguageTray = dynamic(() => import("./trays/LanguageTray").then((m) => ({ default: m.LanguageTray })));
const SettingsTray = dynamic(() => import("./trays/SettingsTray").then((m) => ({ default: m.SettingsTray })));

const TRAY_WIDTH = 288;
const ANIM_MS = 200;

export function SlideTray() {
	const ref = useRef<HTMLDivElement>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const openTray = useEditorStore((s) => s.openTray);
	const setOpenTray = useEditorStore((s) => s.setOpenTray);
	const railCollapsed = useEditorStore((s) => s.railCollapsed);

	// Set initial hidden state before first paint, then enable CSS transition.
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		el.style.opacity = "0";
		el.style.transform = "translateX(-60px)";
		el.style.pointerEvents = "none";
		const dur = prefersReducedMotion() ? 0 : ANIM_MS;
		const raf = requestAnimationFrame(() => {
			if (ref.current) {
				ref.current.style.transition = `opacity ${dur}ms ease-out, transform ${dur}ms ease-out`;
			}
		});
		return () => cancelAnimationFrame(raf);
	}, []);

	// Fade + nudge in / out (tray stays at its target x, never sweeps over the rail).
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (closeTimer.current) clearTimeout(closeTimer.current);

		if (openTray) {
			el.style.pointerEvents = "auto";
			el.style.opacity = "1";
			el.style.transform = "translateX(0px)";
		} else {
			el.style.opacity = "0";
			el.style.transform = "translateX(-60px)";
			const dur = prefersReducedMotion() ? 0 : ANIM_MS;
			closeTimer.current = setTimeout(() => {
				if (ref.current) ref.current.style.pointerEvents = "none";
			}, dur);
		}

		return () => {
			if (closeTimer.current) clearTimeout(closeTimer.current);
		};
	}, [openTray]);

	// Close on outside click.
	useEffect(() => {
		if (!openTray) return;
		const handler = (e: MouseEvent) => {
			const target = e.target as HTMLElement | null;
			if (!target) return;
			if (ref.current?.contains(target)) return;
			if (target.closest("[data-tray-trigger]")) return;
			if (target.closest("[data-topbar]")) return;
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
			className="fixed top-12 bottom-0 z-[9999] w-72 border-r border-border bg-white shadow-xl"
			style={{ left: railCollapsed ? 0 : 48 }}
		>
			{openTray === "pages" && <PagesTray />}
			{openTray === "elements" && <ElementsTray />}
			{openTray === "layers" && <LayersTray />}
			{openTray === "theme" && <ThemeTray />}
			{openTray === "navigation" && <NavigationTray />}
			{openTray === "media" && <MediaTray />}
			{openTray === "music" && <MusicTray />}
			{openTray === "effects" && <EffectsTray />}
			{openTray === "language" && <LanguageTray />}
			{openTray === "settings" && <SettingsTray />}
		</div>
	);
}
