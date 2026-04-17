"use client";

import { Palette } from "lucide-react";

const PALETTES = [
	{ id: "sage", name: "Sage", colors: ["#B8921A", "#8B7355", "#D4C4A0", "#F5F1E8"] },
	{ id: "dusk", name: "Dusk", colors: ["#4A4E69", "#9A8C98", "#C9ADA7", "#F2E9E4"] },
	{ id: "garden", name: "Garden", colors: ["#6B8E5A", "#A4B494", "#D4C5A8", "#F5F0E6"] },
	{ id: "blush", name: "Blush", colors: ["#C97B63", "#E8B4A0", "#F4D9CC", "#FAF3EE"] },
];

const FONTS = [
	{ id: "serif", name: "Classic", stack: "Playfair, serif" },
	{ id: "sans", name: "Modern", stack: "Inter, sans-serif" },
	{ id: "display", name: "Romance", stack: "Cormorant, serif" },
];

export function ThemeTray() {
	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Theme
				</h2>
			</div>

			<div className="flex-1 overflow-y-auto p-3">
				<section className="mb-4">
					<p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
						Palette
					</p>
					<div className="space-y-1.5">
						{PALETTES.map((p) => (
							<button
								key={p.id}
								type="button"
								className="flex w-full items-center gap-2.5 rounded-md border border-border bg-background px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent/30"
							>
								<div className="flex gap-0.5">
									{p.colors.map((c, i) => (
										<div
											key={i}
											className="size-4 rounded-sm border border-border/40"
											style={{ background: c }}
										/>
									))}
								</div>
								<span className="flex-1 truncate">{p.name}</span>
							</button>
						))}
					</div>
				</section>

				<section>
					<p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
						Typography
					</p>
					<div className="space-y-1.5">
						{FONTS.map((f) => (
							<button
								key={f.id}
								type="button"
								className="flex w-full items-center justify-between rounded-md border border-border bg-background px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent/30"
							>
								<span style={{ fontFamily: f.stack }}>{f.name}</span>
								<span className="text-xs text-muted-foreground">Aa</span>
							</button>
						))}
					</div>
				</section>
			</div>

			<div className="border-t border-border px-4 py-3">
				<p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
					<Palette className="size-3" />
					Live token editing arrives in Phase 7
				</p>
			</div>
		</div>
	);
}
