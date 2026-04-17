"use client";

import { useEditorStore } from "@/app/stores/editorStore";
import { PRESET_THEMES } from "@/app/stores/slices/editorShell";

export function ThemeTray() {
	const mode = useEditorStore((s) => s.mode);
	const themeTokens = useEditorStore((s) => s.themeTokens);
	const applyPresetTheme = useEditorStore((s) => s.applyPresetTheme);
	const setThemeTokens = useEditorStore((s) => s.setThemeTokens);

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
						Presets
					</p>
					<div className="space-y-1.5">
						{PRESET_THEMES.map((preset) => {
							const active =
								themeTokens.colors.primary === preset.colors.primary &&
								themeTokens.colors.accent === preset.colors.accent;
							return (
								<button
									key={preset.id}
									type="button"
									onClick={() => applyPresetTheme(preset.id)}
									className={`flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-left text-sm transition-colors ${
										active
											? "border-primary bg-accent/40"
											: "border-border bg-background hover:bg-accent/30"
									}`}
								>
									<div className="flex gap-0.5">
										{[preset.colors.primary, preset.colors.secondary, preset.colors.accent, preset.colors.background].map(
											(c, i) => (
												<div
													key={i}
													className="size-4 rounded-sm border border-border/40"
													style={{ background: c }}
												/>
											),
										)}
									</div>
									<span className="flex-1 truncate">{preset.name}</span>
								</button>
							);
						})}
					</div>
				</section>

				{mode === "pro" && (
					<>
						<section className="mb-4">
							<p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
								Colors
							</p>
							<div className="space-y-2">
								{(["primary", "secondary", "accent", "background", "text"] as const).map(
									(key) => (
										<div key={key} className="flex items-center gap-2">
											<label className="w-20 shrink-0 text-[10px] capitalize text-muted-foreground">
												{key}
											</label>
											<input
												type="color"
												value={themeTokens.colors[key]}
												onChange={(e) =>
													setThemeTokens({
														...themeTokens,
														colors: { ...themeTokens.colors, [key]: e.target.value },
													})
												}
												className="h-7 w-7 cursor-pointer rounded border border-input bg-transparent p-0.5"
											/>
											<input
												type="text"
												value={themeTokens.colors[key]}
												onChange={(e) =>
													setThemeTokens({
														...themeTokens,
														colors: { ...themeTokens.colors, [key]: e.target.value },
													})
												}
												className="h-7 w-full rounded border border-input bg-background px-2 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-ring"
											/>
										</div>
									),
								)}
							</div>
						</section>

						<section>
							<p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
								Typography
							</p>
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<label className="w-20 shrink-0 text-[10px] text-muted-foreground">Heading</label>
									<input
										type="text"
										value={themeTokens.typography.headingFont}
										onChange={(e) =>
											setThemeTokens({
												...themeTokens,
												typography: { ...themeTokens.typography, headingFont: e.target.value },
											})
										}
										className="h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
									/>
								</div>
								<div className="flex items-center gap-2">
									<label className="w-20 shrink-0 text-[10px] text-muted-foreground">Body</label>
									<input
										type="text"
										value={themeTokens.typography.bodyFont}
										onChange={(e) =>
											setThemeTokens({
												...themeTokens,
												typography: { ...themeTokens.typography, bodyFont: e.target.value },
											})
										}
										className="h-7 w-full rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
									/>
								</div>
								<div className="flex items-center gap-2">
									<label className="w-20 shrink-0 text-[10px] text-muted-foreground">Scale</label>
									<input
										type="range"
										min={0.8}
										max={1.3}
										step={0.05}
										value={themeTokens.typography.scale}
										onChange={(e) =>
											setThemeTokens({
												...themeTokens,
												typography: { ...themeTokens.typography, scale: parseFloat(e.target.value) },
											})
										}
										className="flex-1 accent-primary"
									/>
									<span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
										{themeTokens.typography.scale.toFixed(2)}
									</span>
								</div>
							</div>
						</section>
					</>
				)}
			</div>
		</div>
	);
}
