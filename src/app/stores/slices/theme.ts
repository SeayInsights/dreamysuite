import type { StateCreator } from "zustand";
import type { SettingsPatch } from "@/lib/schemas/settings";

// ---------------------------------------------------------------------------
// Theme token types (canonical home — consumed by editorShell, settings, UI)
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

export const DEFAULT_THEME: ThemeTokens = {
	colors: { primary: "#292524", secondary: "#78716c", accent: "#B8921A", background: "#ffffff", text: "#292524" },
	typography: { headingFont: "Georgia, serif", bodyFont: "Inter, system-ui, sans-serif", scale: 1 },
};

// ---------------------------------------------------------------------------
// settingsToTheme — converts site settings fields → ThemeTokens
// (consumed by settings slice on load, and by editorStore's undo/redo subscriber)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Internal helper — maps ThemeTokens back to a SettingsPatch
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// ThemeSlice
// ---------------------------------------------------------------------------

export interface ThemeSlice {
	themeTokens: ThemeTokens;
	setThemeTokens: (tokens: ThemeTokens) => void;
	applyPresetTheme: (presetId: string) => void;
}

// The slice calls get().updateSettings, so it must be composed alongside any
// slice that provides updateSettings (i.e. SettingsSlice). We use a minimal
// structural type rather than importing SettingsSlice to avoid re-introducing
// any circular dependency.
interface WithUpdateSettings {
	updateSettings: (patch: SettingsPatch) => void;
}

export const createThemeSlice: StateCreator<ThemeSlice & WithUpdateSettings, [], [], ThemeSlice> = (set, get) => ({
	themeTokens: DEFAULT_THEME,

	setThemeTokens: (themeTokens) => {
		set({ themeTokens });
		get().updateSettings({
			...themeToSettings(themeTokens),
			effectColor1: null,
			effectColor2: null,
			effectColor3: null,
		});
	},

	applyPresetTheme: (presetId) => {
		const preset = PRESET_THEMES.find((p) => p.id === presetId);
		if (!preset) return;
		const themeTokens = { colors: preset.colors, typography: preset.typography };
		set({ themeTokens });
		get().updateSettings({
			...themeToSettings(themeTokens),
			effectColor1: null,
			effectColor2: null,
			effectColor3: null,
		});
	},
});
