"use client";

import { useEditorStore } from "@/app/stores/editorStore";
import { NavPreview } from "../NavPreview";
import { EffectPicker } from "../EffectPicker";
import type { EventType } from "@/lib/effects/types";

export function NavigationTray() {
	const settings = useEditorStore((s) => s.settings);
	const updateSettings = useEditorStore((s) => s.updateSettings);

	const showBrand = (settings.showNavBrand ?? 1) === 1;
	const navShape = (settings.navShape as string) ?? "bar";
	const navMaterial = (settings.navMaterial as string) ?? "solid";
	const navPosition = (settings.navPosition as string) ?? "fixed";
	const eventType = useEditorStore((s) => s.eventType) as EventType | null;

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Navigation
				</h2>
			</div>

			{/* Live preview */}
			<div className="border-b border-border bg-muted/30">
				<label className="block px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
					Preview
				</label>
				<div className="overflow-x-auto px-3 py-2">
					<NavPreview />
				</div>
			</div>

			<div className="flex-1 overflow-y-auto px-3 py-2">
				<div className="flex flex-col gap-3">
					{/* Brand */}
					<div className="flex items-center justify-between">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Show site name
						</label>
						<Toggle on={showBrand} onToggle={() => updateSettings({ showNavBrand: showBrand ? 0 : 1 })} />
					</div>

					{/* Shape */}
					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Style
						</label>
						<div className="flex gap-1">
							{(["bar", "pill", "floating"] as const).map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => updateSettings({ navShape: s === "bar" ? null : s })}
									className={
										"flex-1 rounded-md border px-2 py-1.5 text-xs font-medium capitalize transition-colors " +
										(navShape === s || (s === "bar" && !settings.navShape)
											? "border-ring bg-accent text-accent-foreground"
											: "border-border text-muted-foreground hover:border-ring/50")
									}
								>
									{s}
								</button>
							))}
						</div>
					</div>

					{/* Material */}
					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Material
						</label>
						<div className="flex gap-1">
							{(["solid", "glass", "frosted"] as const).map((m) => (
								<button
									key={m}
									type="button"
									onClick={() => updateSettings({ navMaterial: m === "solid" ? null : m })}
									className={
										"flex-1 rounded-md border px-2 py-1.5 text-xs font-medium capitalize transition-colors " +
										(navMaterial === m || (m === "solid" && !settings.navMaterial)
											? "border-ring bg-accent text-accent-foreground"
											: "border-border text-muted-foreground hover:border-ring/50")
									}
								>
									{m}
								</button>
							))}
						</div>
					</div>

					{/* Nav Effect */}
					<EffectPicker
						category="nav"
						value={settings.effectNav}
						onChange={(id) => updateSettings({ effectNav: id, effectPreset: null })}
						eventType={eventType}
						label="Nav Effect"
					/>

					{/* Position */}
					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Behavior
						</label>
						<div className="flex flex-col gap-0.5">
							{([
								{ value: "fixed", label: "Always visible", desc: "Stays at top while scrolling" },
								{ value: "hide-on-scroll", label: "Hide on scroll", desc: "Hides when scrolling down, shows on scroll up" },
								{ value: "static", label: "Static", desc: "Scrolls away with the page" },
							] as const).map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => updateSettings({ navPosition: opt.value })}
									className={
										"flex flex-col rounded-md border px-2.5 py-1.5 text-left transition-colors " +
										(navPosition === opt.value
											? "border-ring bg-accent"
											: "border-border hover:border-ring/50")
									}
								>
									<span className={
										"text-xs font-medium " +
										(navPosition === opt.value ? "text-accent-foreground" : "text-foreground")
									}>
										{opt.label}
									</span>
									<span className="text-[10px] text-muted-foreground">{opt.desc}</span>
								</button>
							))}
						</div>
					</div>

					{/* Underline */}
					<div className="flex items-center justify-between">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Link underline
						</label>
						<Toggle
							on={(settings.navUnderline ?? "on") === "on"}
							onToggle={() =>
								updateSettings({
									navUnderline: (settings.navUnderline ?? "on") === "on" ? "off" : "on",
								})
							}
						/>
					</div>

					{/* Colors */}
					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Colors
						</label>
						<div className="flex flex-col gap-1.5">
							<ColorRow label="Background" value={settings.navBg ?? "white"} onChange={(v) => updateSettings({ navBg: v })} />
							<ColorRow label="Brand" value={settings.navBrandColor ?? "#1C1917"} onChange={(v) => updateSettings({ navBrandColor: v })} />
							<ColorRow label="Links" value={settings.navLinkColor ?? "#6B6560"} onChange={(v) => updateSettings({ navLinkColor: v })} />
							<ColorRow label="Highlight" value={settings.navHighlightColor ?? "#B8921A"} onChange={(v) => updateSettings({ navHighlightColor: v })} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className={
				"relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors " +
				(on ? "bg-emerald-500" : "bg-muted-foreground/30")
			}
		>
			<span
				className={
					"inline-block size-3.5 rounded-full bg-white shadow transition-transform " +
					(on ? "translate-x-[18px]" : "translate-x-[3px]")
				}
			/>
		</button>
	);
}

function ColorRow({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<div className="flex items-center gap-2">
			<label className="w-16 shrink-0 text-[11px] text-muted-foreground">{label}</label>
			<div className="flex flex-1 items-center gap-1.5">
				<input
					type="color"
					value={value.startsWith("#") ? value : "#ffffff"}
					onChange={(e) => onChange(e.target.value)}
					className="size-6 shrink-0 cursor-pointer rounded border border-border"
				/>
				<input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-ring"
				/>
			</div>
		</div>
	);
}
