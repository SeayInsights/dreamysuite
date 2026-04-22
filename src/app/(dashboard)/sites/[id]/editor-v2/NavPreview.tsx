"use client";

import { useMemo, useState } from "react";
import { useEditorStore } from "@/app/stores/editorStore";
import { getEffectComponent } from "@/lib/effects/loader";

type Material = "solid" | "glass" | "frosted";

const LANG_NAMES: Record<string, string> = {
	en: "English", vi: "Tiếng Việt", es: "Español", fr: "Français",
	"zh-CN": "中文 (简体)", "zh-TW": "中文 (繁體)", ko: "한국어", ja: "日本語",
	de: "Deutsch", pt: "Português", it: "Italiano", th: "ภาษาไทย",
	tl: "Filipino", hi: "हिन्दी", ar: "العربية",
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

function materialStyles(material: Material, bg: string): React.CSSProperties {
	if (material === "glass") {
		return {
			background: "rgba(255,255,255,0.15)",
			backdropFilter: "blur(12px) saturate(1.2)",
			WebkitBackdropFilter: "blur(12px) saturate(1.2)",
		};
	}
	if (material === "frosted") {
		return {
			background: "rgba(255,255,255,0.3)",
			backdropFilter: "blur(24px) saturate(1.4)",
			WebkitBackdropFilter: "blur(24px) saturate(1.4)",
		};
	}
	return {
		background: bg,
		backdropFilter: "blur(8px)",
		WebkitBackdropFilter: "blur(8px)",
	};
}

function materialBorder(material: Material, bg: string, shape: string): string {
	if (material === "glass") return "1px solid rgba(255,255,255,0.25)";
	if (material === "frosted") return "1px solid rgba(255,255,255,0.4)";
	if (shape === "floating") return "1px solid transparent";
	return `1px solid color-mix(in srgb, ${bg} 85%, #000)`;
}

function LangToggle({ mainLang, langs, font, color, highlight }: { mainLang: string; langs: string[]; font: string; color: string; highlight: string }) {
	const displayLang = useEditorStore((s) => s.displayLang);
	const setDisplayLang = useEditorStore((s) => s.setDisplayLang);
	if (langs.length === 0) return null;

	const allLangs = [mainLang, ...langs];
	const active = displayLang ?? mainLang;

	function cycle(e: React.MouseEvent) {
		e.stopPropagation();
		const idx = allLangs.indexOf(active);
		const next = allLangs[(idx + 1) % allLangs.length];
		setDisplayLang(next === mainLang ? null : next);
	}

	const label = displayLang ? (LANG_NAMES[mainLang] ?? mainLang) : (LANG_NAMES[langs[0]] ?? langs[0]);

	return (
		<button
			type="button"
			onClick={cycle}
			style={{
				fontFamily: font, fontSize: "0.85rem",
				color: displayLang ? highlight : color,
				background: "none", border: "none", cursor: "pointer",
				whiteSpace: "nowrap", padding: "0.5rem 0",
				letterSpacing: "0.03em",
			}}
		>
			{label}
		</button>
	);
}

function HamburgerIcon({ open }: { open: boolean }) {
	return (
		<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
			{open ? (
				<>
					<line x1="4" y1="4" x2="18" y2="18" />
					<line x1="18" y1="4" x2="4" y2="18" />
				</>
			) : (
				<>
					<line x1="3" y1="6" x2="19" y2="6" />
					<line x1="3" y1="11" x2="19" y2="11" />
					<line x1="3" y1="16" x2="19" y2="16" />
				</>
			)}
		</svg>
	);
}

function MobileNav({
	pages,
	currentPageId,
	setCurrentPageId,
	showBrand,
	eventName,
	headingFont,
	bodyFont,
	bg,
	brandColor,
	linkColor,
	highlight,
	material,
	additionalLangs,
	mainLang,
}: {
	pages: { id: string; label: string; slug: string }[];
	currentPageId: string | null;
	setCurrentPageId: (id: string) => void;
	showBrand: boolean;
	eventName: string;
	headingFont: string;
	bodyFont: string;
	bg: string;
	brandColor: string;
	linkColor: string;
	highlight: string;
	material: Material;
	additionalLangs: string[];
	mainLang: string;
}) {
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<nav
			style={{
				...materialStyles(material, bg),
				borderBottom: materialBorder(material, bg, "bar"),
				flexShrink: 0,
				position: "relative",
				zIndex: 20,
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					padding: "0.625rem 1rem",
				}}
			>
				{showBrand ? (
					<span
						style={{
							fontFamily: headingFont,
							fontSize: "0.95rem",
							fontWeight: "normal",
							fontStyle: "italic",
							color: brandColor,
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
							maxWidth: "60%",
						}}
					>
						{eventName}
					</span>
				) : (
					<div />
				)}
				<button
					type="button"
					onClick={() => setMenuOpen(!menuOpen)}
					style={{
						background: "none",
						border: "none",
						color: linkColor,
						cursor: "pointer",
						padding: "0.25rem",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
					aria-label={menuOpen ? "Close menu" : "Open menu"}
				>
					<HamburgerIcon open={menuOpen} />
				</button>
			</div>
			{menuOpen && (
				<div
					style={{
						position: "absolute",
						top: "100%",
						left: 0,
						right: 0,
						background: "rgba(255,255,255,0.18)",
						backdropFilter: "blur(16px) saturate(1.3)",
						WebkitBackdropFilter: "blur(16px) saturate(1.3)",
						borderBottom: "1px solid rgba(255,255,255,0.25)",
						boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
						padding: "0.5rem 0",
						zIndex: 21,
					}}
				>
					{pages.map((page) => {
						const isActive = page.id === currentPageId;
						return (
							<button
								key={page.id}
								type="button"
								onClick={() => {
									setCurrentPageId(page.id);
									setMenuOpen(false);
								}}
								style={{
									display: "block",
									width: "100%",
									padding: "0.75rem 1.25rem",
									fontSize: "0.9rem",
									fontFamily: bodyFont,
									fontWeight: isActive ? 600 : 400,
									color: isActive ? highlight : linkColor,
									background: "none",
									border: "none",
									textAlign: "left",
									cursor: "pointer",
									letterSpacing: "0.03em",
									transition: "color 0.15s",
								}}
							>
								{page.label || page.slug}
							</button>
						);
					})}
					{additionalLangs.length > 0 && (
						<div style={{ padding: "0.25rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
							<LangToggle mainLang={mainLang} langs={additionalLangs} font={bodyFont} color={linkColor} highlight={highlight} />
						</div>
					)}
				</div>
			)}
		</nav>
	);
}

function materialShadow(material: Material, shape: string): string | undefined {
	if (material === "glass" && (shape === "pill" || shape === "floating"))
		return "0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.3)";
	if (material === "frosted" && (shape === "pill" || shape === "floating"))
		return "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)";
	if (shape === "pill") return "0 2px 12px rgba(0,0,0,0.08)";
	if (shape === "floating") return "0 4px 20px rgba(0,0,0,0.12)";
	return undefined;
}

export function NavPreview() {
	const pages = useEditorStore((s) => s.pages);
	const settings = useEditorStore((s) => s.settings);
	const currentPageId = useEditorStore((s) => s.currentPageId);
	const setCurrentPageId = useEditorStore((s) => s.setCurrentPageId);
	const themeTokens = useEditorStore((s) => s.themeTokens);
	const breakpoint = useEditorStore((s) => s.breakpoint);

	const NavStyleEffect = useMemo(
		() => (settings.effectNavStyle ? getEffectComponent(settings.effectNavStyle) : null),
		[settings.effectNavStyle],
	);

	const additionalLangs = useMemo(() => parseSiteLanguages(settings.siteLanguages ?? null), [settings.siteLanguages]);

	const visiblePages = pages.filter((p) => p.isVisible !== 0);
	if (visiblePages.length < 1) return null;

	if (NavStyleEffect) {
		const isCompact = breakpoint === "mobile" || breakpoint === "tablet";
		const eventName = settings.eventName ?? "My Site";
		const initials = eventName.split(/[\s&+]+/).map((w: string) => w.charAt(0)).filter(Boolean).join("").toUpperCase().slice(0, 3);
		const accent = settings.navHighlightColor ?? themeTokens.colors.primary ?? "#B8921A";
		const logoSvg = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="${accent}"/><text x="40" y="40" text-anchor="middle" dominant-baseline="central" font-family="Georgia,serif" font-size="24" font-weight="bold" fill="#fff">${initials}</text></svg>`)}`;
		const bg = settings.navBg ?? "#ffffff";
		const brandColor = settings.navBrandColor ?? "#1C1917";
		const linkColor = settings.navLinkColor ?? "#6B6560";
		const headingFont = themeTokens.typography.headingFont || "system-ui, sans-serif";
		const bodyFont = themeTokens.typography.bodyFont || "system-ui, sans-serif";
		const navItems = visiblePages.map((p) => {
			const label = p.label || p.slug;
			return {
				label,
				href: `#${p.slug}`,
				icon: label.charAt(0).toUpperCase(),
				onClick: (e?: React.MouseEvent) => { e?.preventDefault(); setCurrentPageId(p.id); },
				color: accent,
				isActive: p.id === currentPageId,
			};
		});
		return (
			<div style={{
				flexShrink: 0,
				position: "relative",
				zIndex: 20,
				minHeight: isCompact ? 44 : 56,
				width: isCompact ? "auto" : "100%",
				alignSelf: isCompact ? "flex-start" : undefined,
				padding: isCompact ? "4px 0 0 4px" : undefined,
			}}>
				<NavStyleEffect
					items={navItems}
					logo={logoSvg}
					logoAlt={initials}
					accent={accent}
					bg={bg}
					textColor={linkColor}
					brandColor={brandColor}
					headingFont={headingFont}
					bodyFont={bodyFont}
					brandName={eventName}
					compact={isCompact}
				/>
				{additionalLangs.length > 0 && !isCompact && (
					<div style={{ position: "absolute", left: "75%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 25 }}>
						<LangToggle mainLang={settings.mainLanguage || "en"} langs={additionalLangs} font={bodyFont} color={linkColor} highlight={accent} />
					</div>
				)}
			</div>
		);
	}

	const showBrand = (settings.showNavBrand ?? 1) === 1;
	const eventName = settings.eventName ?? "My Site";
	const shape = (settings.navShape as string) ?? "bar";
	const material = ((settings.navMaterial as string) ?? "solid") as Material;
	const underline = (settings.navUnderline ?? "on") === "on";
	const linkPadding = (settings.navLinkPadding as string) ?? "0.875rem";

	const bg = settings.navBg ?? "#ffffff";
	const brandColor = settings.navBrandColor ?? "#1C1917";
	const linkColor = settings.navLinkColor ?? "#6B6560";
	const highlight = settings.navHighlightColor ?? "#B8921A";

	const headingFont = themeTokens.typography.headingFont || "system-ui, sans-serif";
	const bodyFont = themeTokens.typography.bodyFont || "system-ui, sans-serif";

	const isPillOrFloating = shape === "pill" || shape === "floating";
	const isMobileOrTablet = breakpoint === "mobile" || breakpoint === "tablet";

	if (isMobileOrTablet) {
		return (
			<MobileNav
				pages={visiblePages}
				currentPageId={currentPageId}
				setCurrentPageId={setCurrentPageId}
				showBrand={showBrand}
				eventName={eventName}
				headingFont={headingFont}
				bodyFont={bodyFont}
				bg={bg}
				brandColor={brandColor}
				linkColor={linkColor}
				highlight={highlight}
				material={material}
				additionalLangs={additionalLangs}
				mainLang={settings.mainLanguage || "en"}
			/>
		);
	}

	const linkStyle = (isActive: boolean): React.CSSProperties => ({
		display: "block",
		padding: `${linkPadding} 0.875rem`,
		fontSize: "0.85rem",
		letterSpacing: "0.03em",
		color: isActive ? highlight : linkColor,
		textDecoration: isActive && underline ? "underline" : "none",
		textDecorationColor: isActive && underline ? highlight : undefined,
		textUnderlineOffset: isActive && underline ? "3px" : undefined,
		textDecorationThickness: isActive && underline ? "2px" : undefined,
		cursor: "pointer",
		whiteSpace: "nowrap",
		background: "none",
		border: "none",
		fontFamily: bodyFont,
		fontWeight: isActive ? 600 : 400,
		transition: "color 0.15s",
	});

	if (isPillOrFloating) {
		return (
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr auto 1fr",
					alignItems: "center",
					padding: "6px 1.5rem",
					flexShrink: 0,
					position: "relative" as const,
					zIndex: 20,
				}}
			>
				{showBrand ? (
					<span
						style={{
							fontFamily: headingFont,
							fontSize: "1rem",
							fontWeight: "normal",
							fontStyle: "italic",
							color: brandColor,
							whiteSpace: "nowrap",
						}}
					>
						{eventName}
					</span>
				) : (
					<div />
				)}
				<nav
					style={{
						borderRadius: shape === "pill" ? 999 : 14,
						width: "fit-content",
						boxShadow: materialShadow(material, shape),
						...materialStyles(material, bg),
						border: materialBorder(material, bg, shape),
						padding: shape === "pill" ? "0 0.25rem" : "0 0.5rem",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: 0 }}>
						<ul style={{ display: "flex", listStyle: "none", gap: 0, margin: 0, padding: 0 }}>
							{visiblePages.map((page) => {
								const isActive = page.id === currentPageId;
								return (
									<li key={page.id} style={{ flexShrink: 0 }}>
										<button type="button" onClick={() => setCurrentPageId(page.id)} style={linkStyle(isActive)}>
											{page.label || page.slug}
										</button>
									</li>
								);
							})}
						</ul>
					</div>
				</nav>
				<div style={{ display: "flex", justifyContent: "center" }}>
					<LangToggle mainLang={settings.mainLanguage || "en"} langs={additionalLangs} font={bodyFont} color={linkColor} highlight={highlight} />
				</div>
			</div>
		);
	}

	return (
		<nav
			style={{
				...materialStyles(material, bg),
				borderBottom: materialBorder(material, bg, shape),
				padding: 0,
				flexShrink: 0,
				position: "relative",
				zIndex: 20,
			}}
		>
			<div
				style={{
					maxWidth: 820,
					margin: "0 auto",
					padding: "0 1.25rem",
					display: "flex",
					alignItems: "center",
					gap: 0,
					overflowX: "auto",
				}}
			>
				{showBrand && (
					<a
						style={{
							fontFamily: headingFont,
							fontSize: "1rem",
							fontWeight: "normal",
							color: brandColor,
							textDecoration: "none",
							whiteSpace: "nowrap",
							padding: `${linkPadding} 0`,
							marginRight: "1.5rem",
							flexShrink: 0,
						}}
					>
						{eventName}
					</a>
				)}
				<ul style={{ display: "flex", listStyle: "none", gap: 0, margin: 0, padding: 0, flex: 1 }}>
					{visiblePages.map((page) => {
						const isActive = page.id === currentPageId;
						return (
							<li key={page.id} style={{ flexShrink: 0 }}>
								<button type="button" onClick={() => setCurrentPageId(page.id)} style={linkStyle(isActive)}>
									{page.label || page.slug}
								</button>
							</li>
						);
					})}
				</ul>
			</div>
			{additionalLangs.length > 0 && (
				<div style={{ position: "absolute", left: "75%", top: "50%", transform: "translate(-50%, -50%)" }}>
					<LangToggle mainLang={settings.mainLanguage || "en"} langs={additionalLangs} font={bodyFont} color={linkColor} highlight={highlight} />
				</div>
			)}
		</nav>
	);
}
