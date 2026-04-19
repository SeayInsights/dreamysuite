import type { StateCreator } from "zustand";
import type { ThemeSlice } from "./theme";

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
	| "effects"
	| "settings";

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

	saveError: string | null;
	setSaveError: (msg: string | null) => void;

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

	setBreakpoint: (bp: Breakpoint) => void;
	setMode: (mode: EditorMode) => void;
	toggleRail: () => void;
	setRailCollapsed: (v: boolean) => void;
	setOpenTray: (t: Section | null) => void;
	toggleInspector: () => void;
	setInspectorOpen: (v: boolean) => void;
	toggleFullPreview: () => void;
}

// EditorShellSlice no longer owns theme state — ThemeSlice does.
// The StateCreator is typed without ThemeSlice since it does not call any
// theme methods; compose them side-by-side in editorStore instead.
export const createEditorShellSlice: StateCreator<EditorShellSlice & ThemeSlice, [], [], EditorShellSlice> = (
	set,
) => ({
	siteId: null,
	siteSlug: null,
	siteCustomDomain: null,
	eventType: null,
	setSiteId: (siteId) => set({ siteId }),
	setSiteMeta: ({ slug, customDomain, eventType }) =>
		set({ siteSlug: slug, siteCustomDomain: customDomain, eventType }),
	setEventType: (eventType) => set({ eventType }),

	saveError: null,
	setSaveError: (saveError) => set({ saveError }),

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

	setBreakpoint: (breakpoint) => set({ breakpoint }),
	setMode: (mode) => set({ mode }),
	toggleRail: () => set((s) => ({ railCollapsed: !s.railCollapsed })),
	setRailCollapsed: (railCollapsed) => set({ railCollapsed }),
	setOpenTray: (openTray) => set({ openTray }),
	toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
	setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
	toggleFullPreview: () => set((s) => ({ fullPreview: !s.fullPreview })),
});
