"use client";

import { useState, useCallback } from "react";
import { Languages, RefreshCw, Check, AlertTriangle } from "lucide-react";
import { useEditorStore } from "@/app/stores/editorStore";
import { TRANSLATABLE_FIELDS } from "@/lib/translations";

const LANG_LABELS: Record<string, string> = {
	en: "English",
	vi: "Tiếng Việt",
	es: "Español",
	fr: "Français",
	"zh-CN": "中文 (简体)",
	"zh-TW": "中文 (繁體)",
	ko: "한국어",
	ja: "日本語",
	de: "Deutsch",
	pt: "Português",
	it: "Italiano",
	th: "ภาษาไทย",
	tl: "Filipino",
	hi: "हिन्दी",
	ar: "العربية",
};

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

export function TranslateTab() {
	const settings = useEditorStore((s) => s.settings);
	const blocks = useEditorStore((s) => s.blocks);
	const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
	const siteId = useEditorStore((s) => s.siteId);
	const getTranslation = useEditorStore((s) => s.getTranslation);
	const setTranslation = useEditorStore((s) => s.setTranslation);
	const translations = useEditorStore((s) => s.translations);

	const langs = parseSiteLanguages(settings.siteLanguages ?? null);
	const mainLang = settings.mainLanguage || "en";

	if (langs.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
				<Languages className="size-8 text-muted-foreground/50" />
				<p className="text-sm text-muted-foreground">
					Add languages in the Language tray to start translating content.
				</p>
			</div>
		);
	}

	const block = selectedBlockId ? blocks.find((b) => b.id === selectedBlockId) : null;

	if (!block) {
		return <PageTranslationSummary langs={langs} mainLang={mainLang} />;
	}

	const fields = TRANSLATABLE_FIELDS[block.type];
	if (!fields || fields.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
				<Check className="size-6 text-emerald-500" />
				<p className="text-sm text-muted-foreground">
					This block type has no translatable text fields.
				</p>
			</div>
		);
	}

	const cfg = parseCfg(block.config);

	return (
		<div className="flex flex-col gap-3 px-3 py-2">
			{/* Original text (read-only) */}
			<div className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/30 p-2.5">
				<span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
					Original ({LANG_LABELS[mainLang] ?? mainLang})
				</span>
				{fields.map((f) => (
					<div key={f.key} className="flex flex-col gap-0.5">
						<span className="text-[10px] text-muted-foreground">{f.label}</span>
						<span className="text-xs text-foreground">
							{String(cfg[f.key] ?? "—")}
						</span>
					</div>
				))}
			</div>

			{/* Per-language translation sections */}
			{langs.map((lang) => (
				<LanguageSection
					key={lang}
					lang={lang}
					blockId={block.id}
					blockType={block.type}
					fields={fields}
					cfg={cfg}
					mainLang={mainLang}
					siteId={siteId}
					getTranslation={getTranslation}
					setTranslation={setTranslation}
				/>
			))}

			{/* Bulk translate */}
			<BulkTranslateButton
				blockId={block.id}
				fields={fields}
				cfg={cfg}
				langs={langs}
				mainLang={mainLang}
				siteId={siteId}
				setTranslation={setTranslation}
			/>
		</div>
	);
}

function LanguageSection({
	lang,
	blockId,
	blockType,
	fields,
	cfg,
	mainLang,
	siteId,
	getTranslation,
	setTranslation,
}: {
	lang: string;
	blockId: string;
	blockType: string;
	fields: { key: string; label: string; multiline?: boolean }[];
	cfg: Record<string, unknown>;
	mainLang: string;
	siteId: string | null;
	getTranslation: (blockId: string, lang: string, field: string) => string;
	setTranslation: (blockId: string, lang: string, field: string, value: string) => void;
}) {
	const [translating, setTranslating] = useState<string | null>(null);

	const translateField = useCallback(
		async (fieldKey: string) => {
			if (!siteId) return;
			const source = String(cfg[fieldKey] ?? "");
			if (!source.trim()) return;
			setTranslating(fieldKey);
			try {
				const res = await fetch(`/api/sites/${siteId}/translate`, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						fromLang: mainLang,
						toLang: lang,
						content: { [blockId]: { [fieldKey]: source } },
					}),
				});
				if (res.ok) {
					const data = (await res.json()) as {
						translations: Record<string, Record<string, string>>;
					};
					const val = data.translations?.[blockId]?.[fieldKey];
					if (val) setTranslation(blockId, lang, fieldKey, val);
				}
			} catch {
				// silently fail
			} finally {
				setTranslating(null);
			}
		},
		[siteId, blockId, lang, mainLang, cfg, setTranslation],
	);

	return (
		<div className="flex flex-col gap-1.5 rounded-md border border-border p-2.5">
			<span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
				{LANG_LABELS[lang] ?? lang}
			</span>
			{fields.map((f) => {
				const value = getTranslation(blockId, lang, f.key);
				const isTranslating = translating === f.key;
				return (
					<div key={f.key} className="flex flex-col gap-0.5">
						<span className="text-[10px] text-muted-foreground">{f.label}</span>
						<div className="flex gap-1">
							{f.multiline ? (
								<textarea
									value={value}
									onChange={(e) =>
										setTranslation(blockId, lang, f.key, e.target.value)
									}
									placeholder="Not yet translated"
									rows={3}
									className="flex-1 resize-none rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-ring"
								/>
							) : (
								<input
									type="text"
									value={value}
									onChange={(e) =>
										setTranslation(blockId, lang, f.key, e.target.value)
									}
									placeholder="Not yet translated"
									className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-ring"
								/>
							)}
							<button
								type="button"
								onClick={() => translateField(f.key)}
								disabled={isTranslating}
								className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
								title="Auto-translate"
							>
								<RefreshCw
									className={`size-3 ${isTranslating ? "animate-spin" : ""}`}
								/>
							</button>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function BulkTranslateButton({
	blockId,
	fields,
	cfg,
	langs,
	mainLang,
	siteId,
	setTranslation,
}: {
	blockId: string;
	fields: { key: string; label: string }[];
	cfg: Record<string, unknown>;
	langs: string[];
	mainLang: string;
	siteId: string | null;
	setTranslation: (blockId: string, lang: string, field: string, value: string) => void;
}) {
	const [busy, setBusy] = useState(false);

	const translateAll = useCallback(async () => {
		if (!siteId) return;
		const content: Record<string, Record<string, string>> = {};
		for (const f of fields) {
			const src = String(cfg[f.key] ?? "");
			if (src.trim()) {
				content[blockId] = { ...content[blockId], [f.key]: src };
			}
		}
		if (!content[blockId]) return;
		setBusy(true);
		try {
			for (const lang of langs) {
				const res = await fetch(`/api/sites/${siteId}/translate`, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ fromLang: mainLang, toLang: lang, content }),
				});
				if (res.ok) {
					const data = (await res.json()) as {
						translations: Record<string, Record<string, string>>;
					};
					const blockTranslations = data.translations?.[blockId];
					if (blockTranslations) {
						for (const [field, value] of Object.entries(blockTranslations)) {
							setTranslation(blockId, lang, field, value);
						}
					}
				}
			}
		} catch {
			// silently fail
		} finally {
			setBusy(false);
		}
	}, [siteId, blockId, fields, cfg, langs, mainLang, setTranslation]);

	return (
		<button
			type="button"
			onClick={translateAll}
			disabled={busy}
			className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
		>
			<RefreshCw className={`size-3 ${busy ? "animate-spin" : ""}`} />
			{busy ? "Translating..." : "Translate All Fields"}
		</button>
	);
}

function PageTranslationSummary({
	langs,
	mainLang,
}: {
	langs: string[];
	mainLang: string;
}) {
	const blocks = useEditorStore((s) => s.blocks);
	const translations = useEditorStore((s) => s.translations);
	const siteId = useEditorStore((s) => s.siteId);
	const setTranslation = useEditorStore((s) => s.setTranslation);
	const settings = useEditorStore((s) => s.settings);
	const [busy, setBusy] = useState(false);

	const translatableBlocks = blocks.filter(
		(b) => TRANSLATABLE_FIELDS[b.type]?.length,
	);

	const stats = langs.map((lang) => {
		let total = 0;
		let filled = 0;
		for (const b of translatableBlocks) {
			const fields = TRANSLATABLE_FIELDS[b.type] ?? [];
			for (const f of fields) {
				total++;
				if (translations[b.id]?.[lang]?.[f.key]) filled++;
			}
		}
		return { lang, total, filled };
	});

	const translateEntirePage = useCallback(async () => {
		if (!siteId) return;
		setBusy(true);
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
					for (const [blockId, fieldMap] of Object.entries(
						data.translations ?? {},
					)) {
						for (const [field, value] of Object.entries(fieldMap)) {
							setTranslation(blockId, lang, field, value);
						}
					}
				}
			}
		} catch {
			// silently fail
		} finally {
			setBusy(false);
		}
	}, [siteId, langs, mainLang, translatableBlocks, translations, setTranslation]);

	return (
		<div className="flex flex-col gap-3 px-3 py-2">
			<div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2.5">
				<Languages className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
				<p className="text-[11px] leading-relaxed text-muted-foreground">
					Select a block to translate individual fields, or use the button below
					to translate all untranslated content at once.
				</p>
			</div>

			{/* Coverage per language */}
			{stats.map((s) => {
				const pct = s.total > 0 ? Math.round((s.filled / s.total) * 100) : 0;
				return (
					<div key={s.lang} className="flex flex-col gap-1">
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium">
								{LANG_LABELS[s.lang] ?? s.lang}
							</span>
							<span className="text-[10px] text-muted-foreground">
								{s.filled}/{s.total} fields
							</span>
						</div>
						<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
							<div
								className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-muted-foreground/20"}`}
								style={{ width: `${pct}%` }}
							/>
						</div>
					</div>
				);
			})}

			{/* Block list with status */}
			<div className="flex flex-col gap-1">
				<span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
					Blocks
				</span>
				{translatableBlocks.map((b) => {
					const fields = TRANSLATABLE_FIELDS[b.type] ?? [];
					const allDone = langs.every((lang) =>
						fields.every((f) => translations[b.id]?.[lang]?.[f.key]),
					);
					const anyDone = langs.some((lang) =>
						fields.some((f) => translations[b.id]?.[lang]?.[f.key]),
					);
					return (
						<div
							key={b.id}
							className="flex items-center gap-2 rounded px-2 py-1 text-xs"
						>
							{allDone ? (
								<Check className="size-3 text-emerald-500" />
							) : anyDone ? (
								<AlertTriangle className="size-3 text-amber-500" />
							) : (
								<div className="size-3 rounded-full border border-muted-foreground/30" />
							)}
							<span className="text-muted-foreground">{b.type}</span>
						</div>
					);
				})}
			</div>

			<button
				type="button"
				onClick={translateEntirePage}
				disabled={busy}
				className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
			>
				<RefreshCw className={`size-3 ${busy ? "animate-spin" : ""}`} />
				{busy ? "Translating..." : "Translate Entire Page"}
			</button>
		</div>
	);
}
