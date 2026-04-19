import { create } from "zustand";
import { temporal } from "zundo";
import {
	createDocumentSlice,
	type DocumentSlice,
	type Block,
} from "./slices/document";
import {
	createEditorShellSlice,
	type EditorShellSlice,
	type Breakpoint,
	type EditorMode,
	type Section,
} from "./slices/editorShell";
import {
	createTransientSlice,
	type TransientSlice,
	type DragState,
} from "./slices/transient";
import {
	createSettingsSlice,
	type SettingsSlice,
} from "./slices/settings";
import {
	createTranslationSlice,
	type TranslationSlice,
} from "./slices/translation";
import {
	createThemeSlice,
	settingsToTheme,
	type ThemeSlice,
	type ThemeTokens,
	type ThemeColors,
	type ThemeTypography,
} from "./slices/theme";

export type { Block, Breakpoint, EditorMode, Section, DragState, ThemeTokens, ThemeColors, ThemeTypography };

export type EditorState = DocumentSlice & EditorShellSlice & TransientSlice & SettingsSlice & TranslationSlice & ThemeSlice;

/**
 * Unified editor store composed of slices:
 *   - document: blocks + dirty flag (tracked by Zundo for undo/redo)
 *   - settings: site settings (tracked by Zundo for undo/redo)
 *   - theme: themeTokens + setThemeTokens + applyPresetTheme (NOT tracked)
 *   - editorShell: UI state — selection, breakpoint, mode, panels (NOT tracked)
 *   - transient: drag/hover ephemera (NOT tracked)
 *
 * Zundo's partialize+equality restrict history to blocks + settings.
 * UI state changes (opening a tray, switching breakpoint) never create a history
 * entry, so undo/redo only rolls back document and settings edits.
 */
export const useEditorStore = create<EditorState>()(
	temporal(
		(...a) => ({
			...createDocumentSlice(...a),
			...createEditorShellSlice(...a),
			...createTransientSlice(...a),
			...createSettingsSlice(...a),
			...createTranslationSlice(...a),
			...createThemeSlice(...a),
		}),
		{
			partialize: (state) => ({ blocks: state.blocks, settings: state.settings }),
			equality: (past, current) => past.blocks === current.blocks && past.settings === current.settings,
		},
	),
);

// Keep themeTokens in sync when settings change (e.g. via undo/redo)
let prevSettings = useEditorStore.getState().settings;
useEditorStore.subscribe((state) => {
	if (state.settings !== prevSettings) {
		prevSettings = state.settings;
		useEditorStore.setState({ themeTokens: settingsToTheme(state.settings) });
	}
});
