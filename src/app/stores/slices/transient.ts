import type { StateCreator } from "zustand";

import type { AlignGuide } from "@/app/(dashboard)/sites/[id]/editor-v2/hooks/dragGeometry";

export interface DragState {
  kind: "block" | "element" | null;
  id: string | null;
  fromIndex?: number;
}

export interface TransientSlice {
  drag: DragState;
  hoveredBlockId: string | null;
  isTextEditing: boolean;
  selectedField: string | null;
  isCropping: boolean;
  collidingIds: string[];
  /** Active alignment guide lines during a block drag (canvas-px coords). */
  alignGuides: AlignGuide[];
  /**
   * Canvas fit-scale (BreakpointFrame transform). Single source of truth so the
   * resize path (DragHandles, mounted outside the scale React-context) uses the
   * same value as move — a mismatch here corrupts persisted block dimensions.
   */
  canvasScale: number;
  contentDocument: Document | null;
  setDrag: (drag: DragState) => void;
  setHoveredBlockId: (id: string | null) => void;
  setIsTextEditing: (v: boolean) => void;
  setSelectedField: (field: string | null) => void;
  setIsCropping: (v: boolean) => void;
  setCollidingIds: (ids: string[]) => void;
  setAlignGuides: (guides: AlignGuide[]) => void;
  setCanvasScale: (scale: number) => void;
  setContentDocument: (doc: Document | null) => void;
}

export const createTransientSlice: StateCreator<TransientSlice> = (set) => ({
  drag: { kind: null, id: null },
  hoveredBlockId: null,
  isTextEditing: false,
  selectedField: null,
  isCropping: false,
  collidingIds: [],
  alignGuides: [],
  canvasScale: 1,
  contentDocument: null,
  setDrag: (drag) => set({ drag }),
  setHoveredBlockId: (hoveredBlockId) => set({ hoveredBlockId }),
  setIsTextEditing: (isTextEditing) => set({ isTextEditing }),
  setSelectedField: (selectedField) => set({ selectedField }),
  setIsCropping: (isCropping) => set({ isCropping }),
  setCollidingIds: (collidingIds) => set({ collidingIds }),
  setAlignGuides: (alignGuides) => set({ alignGuides }),
  setCanvasScale: (canvasScale) => set({ canvasScale }),
  setContentDocument: (contentDocument) => set({ contentDocument }),
});
