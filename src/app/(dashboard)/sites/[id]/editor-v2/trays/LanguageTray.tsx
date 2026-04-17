"use client";

import { useState } from "react";
import { Globe, Check, X, Plus } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";

const MAX_LANGUAGES = 5;

const LANGUAGES: { code: string; native: string; english: string }[] = [
	{ code: "en", native: "English", english: "English" },
	{ code: "vi", native: "Tiếng Việt", english: "Vietnamese" },
	{ code: "es", native: "Español", english: "Spanish" },
	{ code: "fr", native: "Français", english: "French" },
	{ code: "zh-CN", native: "中文 (简体)", english: "Chinese (Simplified)" },
	{ code: "zh-TW", native: "中文 (繁體)", english: "Chinese (Traditional)" },
	{ code: "ko", native: "한국어", english: "Korean" },
	{ code: "ja", native: "日本語", english: "Japanese" },
	{ code: "de", native: "Deutsch", english: "German" },
	{ code: "pt", native: "Português", english: "Portuguese" },
	{ code: "it", native: "Italiano", english: "Italian" },
	{ code: "th", native: "ภาษาไทย", english: "Thai" },
	{ code: "tl", native: "Filipino", english: "Filipino" },
	{ code: "hi", native: "हिन्दी", english: "Hindi" },
	{ code: "ar", native: "العربية", english: "Arabic" },
];

function parseSiteLanguages(raw: string | null): string[] {
	if (!raw) return [];
	try {
		const arr = JSON.parse(raw);
		return Array.isArray(arr) ? arr.filter((c: unknown) => typeof c === "string") : [];
	} catch {
		return [];
	}
}

export function LanguageTray() {
	const settings = useEditorStore((s) => s.settings);
	const updateSettings = useEditorStore((s) => s.updateSettings);
	const [showPicker, setShowPicker] = useState(false);

	const mainLang = settings.mainLanguage || "en";
	const langs = parseSiteLanguages(settings.siteLanguages ?? null);
	const canAdd = langs.length < MAX_LANGUAGES;
	const usedCodes = new Set([mainLang, ...langs]);

	function addLanguage(code: string) {
		const next = [...langs, code];
		updateSettings({
			siteLanguages: JSON.stringify(next),
			secondLanguage: next[0] ?? null,
		});
		setShowPicker(false);
	}

	function removeLanguage(code: string) {
		const next = langs.filter((c) => c !== code);
		updateSettings({
			siteLanguages: next.length ? JSON.stringify(next) : null,
			secondLanguage: next[0] ?? null,
		});
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Languages
				</h2>
			</div>

			<div className="flex-1 overflow-y-auto px-3 py-2">
				<div className="flex flex-col gap-3">
					<div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5">
						<Globe className="mt-0.5 size-4 shrink-0 text-amber-700" />
						<p className="text-[11px] leading-relaxed text-amber-800">
							Add languages to your site. Visitors will see a
							{langs.length > 1 ? " dropdown" : " toggle"} to switch between languages.
							Translate block content in the inspector's Translate tab.
						</p>
					</div>

					{/* Primary language */}
					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Primary language
						</label>
						<select
							value={mainLang}
							onChange={(e) => updateSettings({ mainLanguage: e.target.value })}
							className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus:border-ring"
						>
							{LANGUAGES.filter((l) => !langs.includes(l.code)).map((l) => (
								<option key={l.code} value={l.code}>
									{l.native} — {l.english}
								</option>
							))}
						</select>
					</div>

					{/* Added languages */}
					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Additional languages ({langs.length}/{MAX_LANGUAGES})
						</label>

						{langs.length > 0 && (
							<div className="flex flex-col gap-1">
								{langs.map((code) => {
									const info = LANGUAGES.find((l) => l.code === code);
									return (
										<div
											key={code}
											className="flex items-center justify-between rounded-md border border-border px-3 py-2"
										>
											<div className="flex items-center gap-2">
												<Check className="size-3.5 text-emerald-500" />
												<span className="text-sm">{info?.native ?? code}</span>
												<span className="text-xs text-muted-foreground">
													{info?.english}
												</span>
											</div>
											<button
												type="button"
												onClick={() => removeLanguage(code)}
												className="rounded p-0.5 text-muted-foreground hover:text-destructive"
												title={`Remove ${info?.english ?? code}`}
											>
												<X className="size-3.5" />
											</button>
										</div>
									);
								})}
							</div>
						)}

						{canAdd && !showPicker && (
							<button
								type="button"
								onClick={() => setShowPicker(true)}
								className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
							>
								<Plus className="size-3.5" />
								Add language
							</button>
						)}

						{showPicker && (
							<div className="flex flex-col gap-0.5 rounded-md border border-border p-1.5">
								{LANGUAGES.filter((l) => !usedCodes.has(l.code)).map((l) => (
									<button
										key={l.code}
										type="button"
										onClick={() => addLanguage(l.code)}
										className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/30"
									>
										<span className="min-w-0 flex-1">{l.native}</span>
										<span className="shrink-0 text-xs text-muted-foreground">
											{l.english}
										</span>
									</button>
								))}
								<button
									type="button"
									onClick={() => setShowPicker(false)}
									className="mt-1 text-center text-xs text-muted-foreground hover:text-foreground"
								>
									Cancel
								</button>
							</div>
						)}

						{langs.length === 0 && !showPicker && (
							<p className="text-[11px] text-muted-foreground">
								No additional languages added yet
							</p>
						)}
					</div>

					{/* Font overrides per language */}
					{langs.length > 0 && (
						<div className="flex flex-col gap-1">
							<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
								Font overrides
							</label>
							<p className="text-[11px] text-muted-foreground">
								Optional custom fonts for non-Latin scripts (CJK, Devanagari, Arabic, etc.)
							</p>
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center gap-2">
									<label className="w-16 shrink-0 text-[11px] text-muted-foreground">
										Heading
									</label>
									<input
										type="text"
										value={settings.headingFontVi ?? ""}
										onChange={(e) =>
											updateSettings({ headingFontVi: e.target.value || null })
										}
										placeholder={settings.headingFont || "Same as primary"}
										className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-ring"
									/>
								</div>
								<div className="flex items-center gap-2">
									<label className="w-16 shrink-0 text-[11px] text-muted-foreground">
										Body
									</label>
									<input
										type="text"
										value={settings.bodyFontVi ?? ""}
										onChange={(e) =>
											updateSettings({ bodyFontVi: e.target.value || null })
										}
										placeholder={settings.bodyFont || "Same as primary"}
										className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-ring"
									/>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
