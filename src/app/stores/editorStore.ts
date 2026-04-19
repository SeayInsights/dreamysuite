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
 *
 * Undo history is scoped per page. Switching currentPageId swaps in/out the
 * temporal store's pastStates/futureStates for that page so history never
 * bleeds across pages.
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

// ── Page-scoped undo history ───────────────────────────────────────────────
// Each page gets its own pastStates/futureStates. When currentPageId changes
// we snapshot the current temporal state for the outgoing page and restore
// (or initialise) the incoming page's stack.

type PageHistory = {
	pastStates: ReturnType<typeof useEditorStore.temporal.getState>["pastStates"];
	futureStates: ReturnType<typeof useEditorStore.temporal.getState>["futureStates"];
};

const pageHistoryCache = new Map<string, PageHistory>();

let prevPageId = useEditorStore.getState().currentPageId;
useEditorStore.subscribe((state) => {
	const nextPageId = state.currentPageId;
	if (nextPageId === prevPageId) return;

	const history = useEditorStore.temporal.getState();

	// Save the outgoing page's history.
	if (prevPageId !== null) {
		pageHistoryCache.set(prevPageId, {
			pastStates: history.pastStates,
			futureStates: history.futureStates,
		});
	}

	// Restore the incoming page's history (or start empty).
	const saved = nextPageId !== null ? pageHistoryCache.get(nextPageId) : undefined;
	useEditorStore.temporal.setState({
		pastStates: saved?.pastStates ?? [],
		futureStates: saved?.futureStates ?? [],
	});

	prevPageId = nextPageId;
});

// Keep themeTokens in sync when settings change (e.g. via undo/redo)
let prevSettings = useEditorStore.getState().settings;
useEditorStore.subscribe((state) => {
	if (state.settings !== prevSettings) {
		prevSettings = state.settings;
		useEditorStore.setState({ themeTokens: settingsToTheme(state.settings) });
	}
});
