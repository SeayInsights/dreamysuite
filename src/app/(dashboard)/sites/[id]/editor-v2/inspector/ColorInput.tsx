"use client";

import { useState, useCallback } from "react";

type ColorMode = "hex" | "rgb";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const m = /^#?([0-9a-f]{6})$/i.exec(hex);
	if (!m) return null;
	return {
		r: parseInt(m[1].slice(0, 2), 16),
		g: parseInt(m[1].slice(2, 4), 16),
		b: parseInt(m[1].slice(4, 6), 16),
	};
}

function rgbToHex(r: number, g: number, b: number): string {
	const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
	return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`;
}

function parseColor(value: string): { r: number; g: number; b: number } {
	const rgb = hexToRgb(value);
	if (rgb) return rgb;
	const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
	if (m) return { r: +m[1], g: +m[2], b: +m[3] };
	return { r: 255, g: 255, b: 255 };
}

interface ColorInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	isInheriting?: boolean;
}

export function ColorInput({ value, onChange, placeholder, isInheriting }: ColorInputProps) {
	const [mode, setMode] = useState<ColorMode>("hex");
	const { r, g, b } = parseColor(value || "#ffffff");
	const hex = value && /^#[0-9a-f]{6}$/i.test(value) ? value : rgbToHex(r, g, b);

	const handleRgbChange = useCallback(
		(channel: "r" | "g" | "b", raw: string) => {
			const v = Math.max(0, Math.min(255, parseInt(raw) || 0));
			const next = { r, g, b, [channel]: v };
			onChange(rgbToHex(next.r, next.g, next.b));
		},
		[r, g, b, onChange],
	);

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<input
					type="color"
					value={hex}
					onChange={(e) => onChange(e.target.value)}
					className="h-7 w-7 shrink-0 cursor-pointer rounded border border-input bg-transparent p-0.5"
				/>
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
				{value && (
					<button
						type="button"
						onClick={() => onChange("")}
						className="shrink-0 text-[10px] text-muted-foreground underline hover:text-foreground"
					>
						remove
					</button>
				)}
			</div>

			{mode === "hex" ? (
				<input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder ?? (isInheriting ? "inheriting" : "transparent")}
					maxLength={7}
					className={`h-7 w-full rounded border border-input bg-background px-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring ${isInheriting ? "italic text-muted-foreground" : ""}`}
				/>
			) : (
				<div className="flex items-center gap-1.5">
					{(["r", "g", "b"] as const).map((ch) => (
						<div key={ch} className="flex-1">
							<label className="mb-0.5 block text-center text-[9px] uppercase text-muted-foreground">
								{ch}
							</label>
							<input
								type="number"
								min={0}
								max={255}
								value={value ? { r, g, b }[ch] : ""}
								onChange={(e) => handleRgbChange(ch, e.target.value)}
								placeholder={isInheriting ? "-" : "0"}
								className="h-7 w-full rounded border border-input bg-background px-1.5 text-center text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
