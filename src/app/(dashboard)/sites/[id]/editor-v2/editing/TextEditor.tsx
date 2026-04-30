"use client";

import { type JSX } from "react";

import { useEditorStore } from "@/app/stores/editorStore";
import { useFloatingToolbar } from "../hooks/useFloatingToolbar";
import { useDblClickActivation } from "./useDblClickActivation";
import { useEditEventHandlers } from "./useEditEventHandlers";
import { useEditSession } from "./useEditSession";

/**
 * TextEditor
 *
 * Activates on dblclick of any element with `data-editable-field="<cfgKey>"`.
 * Flips contentEditable directly on that element (no overlay — true in-place
 * editing). On blur or Escape, writes the field value + style keys back into
 * cfg via updateBlock. Floating toolbar changes persist immediately.
 *
 * Mount this as a sibling of the canvas content inside EditorOverlay.
 * No ref needed — it attaches listeners to the container.
 */
export function TextEditor({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}): JSX.Element {
  const setIsTextEditing = useEditorStore((s) => s.setIsTextEditing);
  const setSelectedField = useEditorStore((s) => s.setSelectedField);

  const toolbar = useFloatingToolbar();

  const { editState, setEditState, editStateRef, commit, discard } =
    useEditSession(toolbar);

  useDblClickActivation({
    containerRef,
    toolbar,
    setEditState,
    setIsTextEditing,
    setSelectedField,
  });

  useEditEventHandlers({ editState, editStateRef, commit, discard });

  // FloatingFormatToolbar suppressed (E021) — text formatting now in inspector Content tab.
  // Inline editing (contentEditable, keyboard shortcuts, blur-commit) remains fully active.
  if (!editState) return <></>;
  return <></>;
}
