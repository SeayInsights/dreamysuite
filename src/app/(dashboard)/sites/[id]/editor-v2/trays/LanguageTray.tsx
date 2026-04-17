"use client";

import { Globe, Check, X } from "lucide-react";

import { useEditorStore } from "@/app/stores/editorStore";

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

export function LanguageTray() {
	const settings = useEditorStore((s) => s.settings);
	const updateSettings = useEditorStore((s) => s.updateSettings);

	const mainLang = settings.mainLanguage || "en";
	const secondLang = settings.secondLanguage;
	const mainInfo = LANGUAGES.find((l) => l.code === mainLang);
	const secondInfo = secondLang ? LANGUAGES.find((l) => l.code === secondLang) : null;

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Language
				</h2>
			</div>

			<div className="flex-1 overflow-y-auto px-3 py-2">
				<div className="flex flex-col gap-3">
					{/* Feature description */}
					<div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5">
						<Globe className="mt-0.5 size-4 shrink-0 text-amber-700" />
						<p className="text-[11px] leading-relaxed text-amber-800">
							Add a second language to your site. Visitors will see a toggle to switch between languages.
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
							{LANGUAGES.filter((l) => l.code !== secondLang).map((l) => (
								<option key={l.code} value={l.code}>
									{l.native} — {l.english}
								</option>
							))}
						</select>
					</div>

					{/* Second language */}
					<div className="flex flex-col gap-1">
						<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
							Second language
						</label>
						{secondLang ? (
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
									<div className="flex items-center gap-2">
										<Check className="size-3.5 text-emerald-500" />
										<span className="text-sm">
											{secondInfo?.native ?? secondLang}
										</span>
										<span className="text-xs text-muted-foreground">
											{secondInfo?.english}
										</span>
									</div>
									<button
										type="button"
										onClick={() => updateSettings({ secondLanguage: null })}
										className="rounded p-0.5 text-muted-foreground hover:text-destructive"
										title="Remove second language"
									>
										<X className="size-3.5" />
									</button>
								</div>
								<p className="text-[11px] text-muted-foreground">
									Visitors will see a language toggle on your site. Add translations for each block in the block inspector.
								</p>
							</div>
						) : (
							<div className="flex flex-col gap-1">
								<p className="text-[11px] text-muted-foreground">
									Choose a second language to enable bilingual mode
								</p>
								<div className="flex flex-col gap-0.5 rounded-md border border-border p-1.5">
									{LANGUAGES.filter((l) => l.code !== mainLang).map((l) => (
										<button
											key={l.code}
											type="button"
											onClick={() => updateSettings({ secondLanguage: l.code })}
											className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/30"
										>
											<span className="min-w-0 flex-1">{l.native}</span>
											<span className="shrink-0 text-xs text-muted-foreground">{l.english}</span>
										</button>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Font override for second language */}
					{secondLang && (
						<div className="flex flex-col gap-1">
							<label className="text-[11px] font-medium uppercase leading-none tracking-wider text-muted-foreground">
								Font override
							</label>
							<p className="text-[11px] text-muted-foreground">
								Optional custom fonts for the second language (useful for CJK or Devanagari scripts)
							</p>
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center gap-2">
									<label className="w-16 shrink-0 text-[11px] text-muted-foreground">Heading</label>
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
									<label className="w-16 shrink-0 text-[11px] text-muted-foreground">Body</label>
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
