"use client";

import { useState, useCallback, useMemo } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { themeSwatches, themeGradients } from "../lib/themeSwatches";
import { hexToRgb, rgbToHex } from "@/lib/color";

type ColorMode = "hex" | "rgb";
type BgTab = "solid" | "gradient" | "transparent";

const DIRECTIONS: { label: string; angle: string; icon: string }[] = [
	{ label: "Left → Right", angle: "90deg", icon: "→" },
	{ label: "Top → Bottom", angle: "180deg", icon: "↓" },
	{ label: "Bottom → Top", angle: "0deg", icon: "↑" },
	{ label: "Right → Left", angle: "270deg", icon: "←" },
];

function applyOpacity(hex: string, opacity: number): string {
	if (opacity >= 100) return hex;
	const [r, g, b] = hexToRgb(hex);
	return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
}

function applyAngle(grad: string, angle: string): string {
	return grad.replace(/^linear-gradient\([^,]+,/, `linear-gradient(${angle},`);
}

interface ColorInputProps {
	value: string;
	onChange: (value: string) => void;
	isInheriting?: boolean;
}

export function ColorInput({ value, onChange, isInheriting }: ColorInputProps) {
	const themeColors = useEditorStore((s) => s.themeTokens.colors);
	const swatches = useMemo(() => themeSwatches(themeColors), [themeColors]);
	const gradients = useMemo(() => themeGradients(themeColors), [themeColors]);

	const isGradient = value.startsWith("linear-gradient") || value.startsWith("radial-gradient");
	const isTransparent = value === "transparent" || value === "";
	const [tab, setTab] = useState<BgTab>(isGradient ? "gradient" : isTransparent ? "solid" : "solid");
	const [mode, setMode] = useState<ColorMode>("hex");
	const [opacity, setOpacity] = useState(100);
	const [gradDir, setGradDir] = useState("135deg");

	const solidHex = !isGradient && !isTransparent && value ? value : "#ffffff";
	const [r, g, b] = hexToRgb(solidHex);

	const applySolid = useCallback(
		(hex: string, op?: number) => {
			onChange(applyOpacity(hex, op ?? opacity));
		},
		[onChange, opacity],
	);

	return (
		<div className="space-y-2.5">
			{/* Tab row */}
			<div className="flex overflow-hidden rounded-md border border-border text-xs">
				{(["solid", "gradient", "transparent"] as BgTab[]).map((t) => (
					<button
						key={t}
						type="button"
						onClick={() => {
							setTab(t);
							if (t === "transparent") onChange("transparent");
						}}
						className={`flex-1 py-1 capitalize transition-colors ${
							tab === t
								? "bg-primary text-primary-foreground"
								: "bg-background text-muted-foreground hover:bg-muted"
						}`}
					>
						{t}
					</button>
				))}
			</div>

			{/* Solid tab */}
			{tab === "solid" && (
				<>
					<div className="grid grid-cols-4 gap-1.5">
						{swatches.map((color, i) => (
							<button
								key={i}
								type="button"
								aria-label={`Set color to ${color}`}
								onClick={() => applySolid(color)}
								className={`h-7 w-full rounded border transition-transform hover:scale-110 ${
									value === color
										? "border-primary ring-1 ring-primary"
										: "border-border"
								}`}
								style={{ backgroundColor: color }}
							/>
						))}
					</div>

					<div className="flex items-center gap-1.5">
						<div className="flex h-7 shrink-0 overflow-hidden rounded border border-input text-[10px] font-medium">
							<button
								type="button"
								onClick={() => setMode("hex")}
								className={`px-2 transition-colors ${mode === "hex" ? "bg-accent text-accent-foreground" : "bg-background text-muted-foreground hover:bg-accent/50"}`}
							>
								HEX
							</button>
							<button
								type="button"
								onClick={() => setMode("rgb")}
								className={`px-2 transition-colors ${mode === "rgb" ? "bg-accent text-accent-foreground" : "bg-background text-muted-foreground hover:bg-accent/50"}`}
							>
								RGB
							</button>
						</div>
						{mode === "hex" ? (
							<input
								type="text"
								value={isTransparent ? "" : value}
								onChange={(e) => onChange(e.target.value)}
								placeholder={isInheriting ? "inheriting" : "#ffffff"}
								maxLength={7}
								className={`h-7 w-full rounded border border-input bg-background px-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring ${isInheriting ? "italic text-muted-foreground" : ""}`}
							/>
						) : (
							<div className="flex gap-1">
								{([0, 1, 2] as const).map((i) => (
									<input
										key={i}
										type="number"
										min={0}
										max={255}
										value={isTransparent ? "" : [r, g, b][i]}
										onChange={(e) => {
											const parts: [number, number, number] = [r, g, b];
											parts[i] = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
											applySolid(rgbToHex(parts[0], parts[1], parts[2]));
										}}
										placeholder="0"
										className="h-7 w-12 rounded border border-input bg-background px-1 text-center text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
									/>
								))}
							</div>
						)}
					</div>

					<div className="space-y-1">
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span>Opacity</span>
							<span>{opacity}%</span>
						</div>
						<input
							type="range"
							min={0}
							max={100}
							value={opacity}
							className="w-full accent-primary"
							onChange={(e) => {
								const v = Number(e.target.value);
								setOpacity(v);
								if (/^#[0-9a-f]{6}$/i.test(solidHex)) {
									onChange(applyOpacity(solidHex, v));
								}
							}}
						/>
					</div>
				</>
			)}

			{/* Gradient tab */}
			{tab === "gradient" && (
				<div className="space-y-2.5">
					<div className="space-y-1">
						<p className="text-[10px] uppercase tracking-wide text-muted-foreground">Direction</p>
						<div className="grid grid-cols-4 gap-1">
							{DIRECTIONS.map((d) => (
								<button
									key={d.angle}
									type="button"
									title={d.label}
									onClick={() => {
										setGradDir(d.angle);
										if (value.startsWith("linear-gradient")) {
											onChange(applyAngle(value, d.angle));
										}
									}}
									className={`flex h-7 items-center justify-center rounded border text-sm transition-colors ${
										gradDir === d.angle
											? "border-primary bg-primary/10 text-primary"
											: "border-border bg-background text-muted-foreground hover:bg-muted"
									}`}
								>
									{d.icon}
								</button>
							))}
						</div>
					</div>
					<div className="space-y-1.5">
						{gradients.map((g) => {
							const grad = applyAngle(g.value, gradDir);
							return (
								<button
									key={g.value}
									type="button"
									onClick={() => onChange(grad)}
									className={`h-10 w-full rounded-md border px-3 text-left transition-transform hover:scale-[1.02] ${
										value === grad
											? "border-primary ring-1 ring-primary"
											: "border-border"
									}`}
									style={{ background: grad }}
								>
									<span
										className="text-[10px] font-semibold uppercase tracking-wide"
										style={{
											color: g.dark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.55)",
											textShadow: g.dark ? "0 1px 2px rgba(0,0,0,0.4)" : "none",
										}}
									>
										{g.label}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* Transparent tab */}
			{tab === "transparent" && (
				<div
					className="flex h-14 w-full items-center justify-center rounded border border-border text-xs text-muted-foreground"
					style={{
						backgroundImage: "repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%)",
						backgroundSize: "12px 12px",
					}}
				>
					No background
				</div>
			)}
		</div>
	);
}
