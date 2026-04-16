import type { StateCreator } from "zustand";

export type Breakpoint = "desktop" | "tablet" | "mobile";
export type EditorMode = "simple" | "pro";
export type Section =
	| "pages"
	| "elements"
	| "layers"
	| "theme"
	| "settings";

export interface EditorShellSlice {
	selectedBlockId: string | null;
	selectBlock: (id: string | null) => void;

	breakpoint: Breakpoint;
	mode: EditorMode;
	railCollapsed: boolean;
	openTray: Section | null;
	inspectorOpen: boolean;
	fullPreview: boolean;

	setBreakpoint: (bp: Breakpoint) => void;
	setMode: (mode: EditorMode) => void;
	toggleRail: () => void;
	setRailCollapsed: (v: boolean) => void;
	setOpenTray: (t: Section | null) => void;
	toggleInspector: () => void;
	setInspectorOpen: (v: boolean) => void;
	toggleFullPreview: () => void;
}

export const createEditorShellSlice: StateCreator<EditorShellSlice> = (
	set,
) => ({
	selectedBlockId: null,
	selectBlock: (id) => set({ selectedBlockId: id }),

	breakpoint: "desktop",
	mode: "simple",
	railCollapsed: false,
	openTray: null,
	inspectorOpen: false,
	fullPreview: false,

	setBreakpoint: (breakpoint) => set({ breakpoint }),
	setMode: (mode) => set({ mode }),
	toggleRail: () => set((s) => ({ railCollapsed: !s.railCollapsed })),
	setRailCollapsed: (railCollapsed) => set({ railCollapsed }),
	setOpenTray: (openTray) => set({ openTray }),
	toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
	setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
	toggleFullPreview: () => set((s) => ({ fullPreview: !s.fullPreview })),
});
