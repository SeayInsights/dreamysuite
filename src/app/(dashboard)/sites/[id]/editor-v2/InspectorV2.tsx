"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion/mini";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useEditorStore } from "@/app/stores/editorStore";
import { duration, EASING } from "@/lib/motion";

const PANEL_WIDTH = 320;

type TabId = "design" | "advanced";
const TABS: { id: TabId; label: string }[] = [
	{ id: "design", label: "Design" },
	{ id: "advanced", label: "Advanced" },
];

export function InspectorV2() {
	const ref = useRef<HTMLDivElement>(null);
	const wasOpen = useRef(false);

	useEffect(() => {
		if (ref.current) ref.current.style.transform = `translateX(${PANEL_WIDTH}px)`;
	}, []);
	const inspectorOpen = useEditorStore((s) => s.inspectorOpen);
	const setInspectorOpen = useEditorStore((s) => s.setInspectorOpen);
	const settingsLoaded = useEditorStore((s) => s.settingsLoaded);
	const [tab, setTab] = useState<TabId>("design");

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (inspectorOpen) {
			el.style.pointerEvents = "auto";
			animate(
				el,
				{
					x: [
						wasOpen.current ? "0px" : `${PANEL_WIDTH}px`,
						"0px",
					],
				},
				{
					duration: duration("inspectorSlide") / 1000,
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
				{ x: ["0px", `${PANEL_WIDTH}px`] },
				{
					duration: duration("inspectorSlide") / 1000,
					ease: EASING.exit,
				},
			).finished.then(() => {
				if (ref.current) {
					ref.current.style.transform = `translateX(${PANEL_WIDTH}px)`;
					ref.current.style.pointerEvents = "none";
				}
			});
			wasOpen.current = false;
		}
	}, [inspectorOpen]);

	return (
		<aside
			ref={ref}
			role="complementary"
			aria-label="Inspector"
			aria-hidden={!inspectorOpen}
			className="pointer-events-none absolute bottom-0 right-0 top-0 z-[150] w-80 border-l border-border bg-white shadow-lg"
			style={{}}
		>
			<div className="flex h-10 items-center justify-between border-b border-border px-3">
				<div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Page Settings
				</div>
				<button
					type="button"
					aria-label="Close inspector"
					onClick={() => setInspectorOpen(false)}
					className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
				>
					<X className="size-4" />
				</button>
			</div>

			<div
				role="tablist"
				aria-label="Inspector tabs"
				className="flex items-center gap-0.5 border-b border-border px-2 py-1.5"
			>
				{TABS.map((t) => {
					const active = tab === t.id;
					return (
						<button
							key={t.id}
							type="button"
							role="tab"
							aria-selected={active}
							onClick={() => setTab(t.id)}
							className={cn(
								"h-7 rounded-sm px-2 text-xs font-medium transition-colors",
								active
									? "bg-accent text-accent-foreground"
									: "text-muted-foreground hover:bg-accent/50",
							)}
						>
							{t.label}
						</button>
					);
				})}
			</div>

			<div
				role="tabpanel"
				className="h-[calc(100%-5.25rem)] overflow-y-auto"
			>
				{!settingsLoaded ? (
					<div className="flex items-center justify-center p-8">
						<div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
					</div>
				) : tab === "design" ? (
					<div className="p-4 text-sm text-muted-foreground">
						Design tab content coming soon
					</div>
				) : (
					<div className="p-4 text-sm text-muted-foreground">
						Advanced tab content coming soon
					</div>
				)}
			</div>
		</aside>
	);
}
