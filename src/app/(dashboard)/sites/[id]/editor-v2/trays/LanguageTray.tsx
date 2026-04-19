"use client";

import { useState, useCallback } from "react";
import { Globe, Check, X, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

import { useEditorStore } from "@/app/stores/editorStore";
import { TRANSLATABLE_FIELDS } from "@/lib/translations";

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

function parseCfg(config: unknown): Record<string, unknown> {
	if (!config) return {};
	if (typeof config === "string") {
		try { return JSON.parse(config); } catch { return {}; }
	}
	return config as Record<string, unknown>;
}

export function LanguageTray() {
	const settings = useEditorStore((s) => s.settings);
	const updateSettings = useEditorStore((s) => s.updateSettings);
	const blocks = useEditorStore((s) => s.blocks);
	const translations = useEditorStore((s) => s.translations);
	const setTranslation = useEditorStore((s) => s.setTranslation);
	const siteId = useEditorStore((s) => s.siteId);
	const displayLang = useEditorStore((s) => s.displayLang);
	const setDisplayLang = useEditorStore((s) => s.setDisplayLang);
	const [showPicker, setShowPicker] = useState(false);
	const [translating, setTranslating] = useState(false);
	const [translateError, setTranslateError] = useState<string | null>(null);

	const mainLang = settings.mainLanguage || "en";
	const langs = parseSiteLanguages(settings.siteLanguages ?? null);
	const canAdd = langs.length < MAX_LANGUAGES;
	const usedCodes = new Set([mainLang, ...langs]);

	const translateEntirePage = useCallback(async () => {
		if (!siteId) return;
		setTranslating(true);
		setTranslateError(null);
		let failures = 0;
		const translatableBlocks = blocks.filter(
			(b) => TRANSLATABLE_FIELDS[b.type]?.length,
		);
		try {
			for (const lang of langs) {
				const content: Record<string, Record<string, string>> = {};
				for (const b of translatableBlocks) {
					const fields = TRANSLATABLE_FIELDS[b.type] ?? [];
					const cfg = parseCfg(b.config);
					for (const f of fields) {
						if (translations[b.id]?.[lang]?.[f.key]) continue;
						const src = String(cfg[f.key] ?? "");
						if (src.trim()) {
							if (!content[b.id]) content[b.id] = {};
							content[b.id][f.key] = src;
						}
					}
				}
				if (Object.keys(content).length === 0) continue;
				const res = await fetch(`/api/sites/${siteId}/translate`, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ fromLang: mainLang, toLang: lang, content }),
				});
				if (res.ok) {
					const data = (await res.json()) as {
						translations: Record<string, Record<string, string>>;
					};
					for (const [blockId, fieldMap] of Object.entries(data.translations ?? {})) {
						for (const [field, value] of Object.entries(fieldMap)) {
							setTranslation(blockId, lang, field, value);
						}
					}
				} else {
					failures++;
					if (res.status === 429) break;
				}
			}
		} catch {
			failures++;
		} finally {
			setTranslating(false);
			if (failures > 0) setTranslateError(`${failures} language(s) failed — try again shortly`);
		}
	}, [siteId, blocks, langs, mainLang, translations, setTranslation]);

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
							Use the editing toggle below to edit text directly in another language.
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

					{/* Editing language toggle */}
					{langs.length > 0 && (
						<div className="flex flex-col gap-1.5">
							<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
								Editing language
							</label>
							<div className="flex flex-wrap gap-1">
								<button
									type="button"
									onClick={() => setDisplayLang(null)}
									className={cn(
										"rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
										!displayLang || displayLang === mainLang
											? "border-primary bg-primary/10 text-primary"
											: "border-border text-muted-foreground hover:border-ring hover:text-foreground",
									)}
								>
									{LANGUAGES.find((l) => l.code === mainLang)?.native ?? mainLang}
								</button>
								{langs.map((code) => {
									const active = displayLang === code;
									const info = LANGUAGES.find((l) => l.code === code);
									return (
										<button
											key={code}
											type="button"
											onClick={() => setDisplayLang(active ? null : code)}
											className={cn(
												"rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
												active
													? "border-amber-400 bg-amber-100 text-amber-900"
													: "border-border text-muted-foreground hover:border-ring hover:text-foreground",
											)}
										>
											{info?.native ?? code}
										</button>
									);
								})}
							</div>
							{displayLang && displayLang !== mainLang && (
								<p className="text-[10px] text-amber-700">
									Double-click any text block to edit in {LANGUAGES.find((l) => l.code === displayLang)?.english ?? displayLang}. Changes save as translations.
								</p>
							)}
						</div>
					)}

					{/* Translate entire page */}
					{langs.length > 0 && (
						<div className="flex flex-col gap-1.5">
							{translateError && (
								<div className="rounded-md bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
									{translateError}
								</div>
							)}
							<button
								type="button"
								onClick={translateEntirePage}
								disabled={translating}
								className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
							>
								<RefreshCw className={`size-3 ${translating ? "animate-spin" : ""}`} />
								{translating ? "Translating..." : "Translate Entire Page"}
							</button>
						</div>
					)}

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
