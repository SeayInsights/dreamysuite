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

export type { Block, Breakpoint, EditorMode, Section, DragState };

export type EditorState = DocumentSlice & EditorShellSlice & TransientSlice & SettingsSlice & TranslationSlice;

/**
 * Unified editor store composed of three slices:
 *   - document: blocks + dirty flag (tracked by Zundo for undo/redo)
 *   - editorShell: UI state — selection, breakpoint, mode, panels (NOT tracked)
 *   - transient: drag/hover ephemera (NOT tracked)
 *
 * Zundo's partialize+equality restrict history to the `blocks` reference.
 * UI state changes (opening a tray, switching breakpoint) never create a history
 * entry, so undo/redo only rolls back document edits — not panel visibility.
 */
export const useEditorStore = create<EditorState>()(
	temporal(
		(...a) => ({
			...createDocumentSlice(...a),
			...createEditorShellSlice(...a),
			...createTransientSlice(...a),
			...createSettingsSlice(...a),
			...createTranslationSlice(...a),
		}),
		{
			partialize: (state) => ({ blocks: state.blocks }),
			equality: (past, current) => past.blocks === current.blocks,
		},
	),
);
