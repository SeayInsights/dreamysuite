import type { StateCreator } from "zustand";
import type { SettingsSlice } from "./settings";
import type { SettingsPatch } from "@/lib/schemas/settings";

export type Breakpoint = "desktop" | "tablet" | "mobile";
export type EditorMode = "simple" | "pro";
export type Section =
	| "pages"
	| "elements"
	| "layers"
	| "theme"
	| "navigation"
	| "media"
	| "music"
	| "language"
	| "settings";

// ---------------------------------------------------------------------------
// Theme token types
// ---------------------------------------------------------------------------

export interface ThemeColors {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
	text: string;
}

export interface ThemeTypography {
	headingFont: string;
	bodyFont: string;
	scale: number;
}

export interface ThemeTokens {
	colors: ThemeColors;
	typography: ThemeTypography;
}

export const PRESET_THEMES: Array<{
	id: string;
	name: string;
	colors: ThemeColors;
	typography: ThemeTypography;
}> = [
	{
		id: "classic",
		name: "Classic",
		colors: { primary: "#1c1917", secondary: "#78716c", accent: "#b8921a", background: "#faf8f6", text: "#1c1917" },
		typography: { headingFont: "Georgia, serif", bodyFont: "system-ui, sans-serif", scale: 1 },
	},
	{
		id: "modern",
		name: "Modern",
		colors: { primary: "#0f172a", secondary: "#64748b", accent: "#6366f1", background: "#ffffff", text: "#0f172a" },
		typography: { headingFont: "ui-sans-serif, system-ui", bodyFont: "ui-sans-serif, system-ui", scale: 1 },
	},
	{
		id: "romantic",
		name: "Romantic",
		colors: { primary: "#7c3aed", secondary: "#a78bfa", accent: "#f472b6", background: "#fdf4ff", text: "#1c1917" },
		typography: { headingFont: "Georgia, serif", bodyFont: "ui-sans-serif", scale: 1.05 },
	},
	{
		id: "minimal",
		name: "Minimal",
		colors: { primary: "#000000", secondary: "#666666", accent: "#000000", background: "#ffffff", text: "#000000" },
		typography: { headingFont: "ui-sans-serif", bodyFont: "ui-sans-serif", scale: 0.95 },
	},
	{
		id: "garden",
		name: "Garden",
		colors: { primary: "#166534", secondary: "#4ade80", accent: "#f59e0b", background: "#f0fdf4", text: "#14532d" },
		typography: { headingFont: "Georgia, serif", bodyFont: "ui-sans-serif", scale: 1 },
	},
];

const DEFAULT_THEME: ThemeTokens = {
	colors: PRESET_THEMES[0].colors,
	typography: PRESET_THEMES[0].typography,
};

// ---------------------------------------------------------------------------

export interface EditorPage {
	id: string;
	slug: string;
	label: string;
	sortOrder: number;
	isVisible: number;
}

export interface EditorShellSlice {
	siteId: string | null;
	siteSlug: string | null;
	siteCustomDomain: string | null;
	eventType: string | null;
	setSiteId: (id: string) => void;
	setSiteMeta: (meta: { slug: string; customDomain: string | null; eventType: string | null }) => void;
	setEventType: (eventType: string | null) => void;

	selectedBlockId: string | null;
	selectBlock: (id: string | null) => void;

	pages: EditorPage[];
	currentPageId: string | null;
	setPages: (pages: EditorPage[]) => void;
	setCurrentPageId: (id: string | null) => void;

	breakpoint: Breakpoint;
	mode: EditorMode;
	railCollapsed: boolean;
	openTray: Section | null;
	inspectorOpen: boolean;
	fullPreview: boolean;

	themeTokens: ThemeTokens;
	setThemeTokens: (tokens: ThemeTokens) => void;
	applyPresetTheme: (presetId: string) => void;

	setBreakpoint: (bp: Breakpoint) => void;
	setMode: (mode: EditorMode) => void;
	toggleRail: () => void;
	setRailCollapsed: (v: boolean) => void;
	setOpenTray: (t: Section | null) => void;
	toggleInspector: () => void;
	setInspectorOpen: (v: boolean) => void;
	toggleFullPreview: () => void;
}

function themeToSettings(tokens: ThemeTokens): SettingsPatch {
	return {
		accentColor: tokens.colors.accent,
		bgColor: tokens.colors.background,
		headingFont: tokens.typography.headingFont,
		bodyFont: tokens.typography.bodyFont,
		headingColor: tokens.colors.primary,
		siteTextColor: tokens.colors.text,
		bodyColor: tokens.colors.secondary,
	};
}

export function settingsToTheme(s: {
	accentColor?: string | null;
	bgColor?: string | null;
	headingFont?: string | null;
	bodyFont?: string | null;
	headingColor?: string | null;
	siteTextColor?: string | null;
	bodyColor?: string | null;
}): ThemeTokens {
	const d = DEFAULT_THEME;
	return {
		colors: {
			primary: s.headingColor ?? d.colors.primary,
			secondary: s.bodyColor ?? d.colors.secondary,
			accent: s.accentColor ?? d.colors.accent,
			background: s.bgColor ?? d.colors.background,
			text: s.siteTextColor ?? d.colors.text,
		},
		typography: {
			headingFont: s.headingFont ?? d.typography.headingFont,
			bodyFont: s.bodyFont ?? d.typography.bodyFont,
			scale: d.typography.scale,
		},
	};
}

export const createEditorShellSlice: StateCreator<EditorShellSlice & SettingsSlice, [], [], EditorShellSlice> = (
	set, get,
) => ({
	siteId: null,
	siteSlug: null,
	siteCustomDomain: null,
	eventType: null,
	setSiteId: (siteId) => set({ siteId }),
	setSiteMeta: ({ slug, customDomain, eventType }) =>
		set({ siteSlug: slug, siteCustomDomain: customDomain, eventType }),
	setEventType: (eventType) => set({ eventType }),

	selectedBlockId: null,
	selectBlock: (id) => set({ selectedBlockId: id }),

	pages: [],
	currentPageId: null,
	setPages: (pages) => set({ pages }),
	setCurrentPageId: (currentPageId) => set({ currentPageId }),

	breakpoint: "desktop",
	mode: "simple",
	railCollapsed: false,
	openTray: null,
	inspectorOpen: false,
	fullPreview: false,

	themeTokens: DEFAULT_THEME,
	setThemeTokens: (themeTokens) => {
		set({ themeTokens });
		get().updateSettings(themeToSettings(themeTokens));
	},
	applyPresetTheme: (presetId) => {
		const preset = PRESET_THEMES.find((p) => p.id === presetId);
		if (!preset) return;
		const themeTokens = { colors: preset.colors, typography: preset.typography };
		set({ themeTokens });
		get().updateSettings(themeToSettings(themeTokens));
	},

	setBreakpoint: (breakpoint) => set({ breakpoint }),
	setMode: (mode) => set({ mode }),
	toggleRail: () => set((s) => ({ railCollapsed: !s.railCollapsed })),
	setRailCollapsed: (railCollapsed) => set({ railCollapsed }),
	setOpenTray: (openTray) => set({ openTray }),
	toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
	setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
	toggleFullPreview: () => set((s) => ({ fullPreview: !s.fullPreview })),
});
