/**
 * useEditSession.ts
 *
 * Manages the active EditState for TextEditor: holds the state/ref pair and
 * provides `commit` and `discard` callbacks that write back to the editor store.
 */

import { useCallback, useRef, useState } from "react";

import { useEditorStore } from "@/app/stores/editorStore";
import { useFloatingToolbar } from "../hooks/useFloatingToolbar";
import {
  type EditState,
  parseCfgFromBlock,
} from "./textEditorTypes";

export interface UseEditSessionReturn {
  editState: EditState | null;
  setEditState: React.Dispatch<React.SetStateAction<EditState | null>>;
  editStateRef: React.MutableRefObject<EditState | null>;
  commit: (state: EditState) => void;
  discard: (state: EditState) => void;
}

export function useEditSession(
  toolbar: ReturnType<typeof useFloatingToolbar>,
): UseEditSessionReturn {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const setIsTextEditing = useEditorStore((s) => s.setIsTextEditing);
  const setSelectedField = useEditorStore((s) => s.setSelectedField);
  const setTranslation = useEditorStore((s) => s.setTranslation);

  const [editState, setEditState] = useState<EditState | null>(null);

  // Keep a ref so event handlers close over the ref, not stale state
  const editStateRef = useRef<EditState | null>(null);
  editStateRef.current = editState;

  const commit = useCallback(
    (state: EditState) => {
      const el = state.element;
      const text = el.innerText.trim();

      if (state.translatingLang) {
        setTranslation(state.blockId, state.translatingLang, state.field, text);
      } else {
        const currentBlock = useEditorStore
          .getState()
          .blocks.find((b) => b.id === state.blockId);
        if (!currentBlock) return;

        const currentCfg = parseCfgFromBlock(currentBlock);

        if (state.arrayKey !== undefined && state.itemIndex !== undefined) {
          const arr = Array.isArray(currentCfg[state.arrayKey])
            ? (currentCfg[state.arrayKey] as Record<string, unknown>[])
            : [];
          const nextArr = arr.map((item, i) =>
            i === state.itemIndex
              ? { ...item, [state.field]: text }
              : item,
          );
          updateBlock(state.blockId, {
            config: { ...currentCfg, [state.arrayKey]: nextArr },
          });
        } else {
          updateBlock(state.blockId, {
            config: { ...currentCfg, [state.field]: text },
          });
        }
      }

      el.removeAttribute("contenteditable");
      el.removeAttribute("spellcheck");
      el.style.outline = "";
      toolbar.hide();
      setEditState(null);
      setIsTextEditing(false);
      setSelectedField(null);
    },
    [updateBlock, setTranslation, toolbar, setIsTextEditing, setSelectedField],
  );

  const discard = useCallback(
    (state: EditState) => {
      const el = state.element;
      el.innerText = state.originalText;
      el.removeAttribute("contenteditable");
      el.removeAttribute("spellcheck");
      el.style.outline = "";

      updateBlock(state.blockId, { config: state.originalCfg });

      toolbar.hide();
      setEditState(null);
      setIsTextEditing(false);
      setSelectedField(null);
    },
    [updateBlock, toolbar, setIsTextEditing, setSelectedField],
  );

  return { editState, setEditState, editStateRef, commit, discard };
}
