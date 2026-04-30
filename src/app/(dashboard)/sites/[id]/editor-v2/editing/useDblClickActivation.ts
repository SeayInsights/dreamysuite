/**
 * useDblClickActivation.ts
 *
 * Attaches a dblclick listener to the editor container and activates
 * contentEditable inline editing on the target element.
 *
 * Two paths are handled:
 *   Path 1 — array-item field: element carries data-editable-item-index,
 *             data-editable-item-field, and data-editable-array-key.
 *   Path 2 — top-level field:  element carries data-editable-field.
 */

import { useEffect } from "react";

import { useEditorStore } from "@/app/stores/editorStore";
import { useFloatingToolbar } from "../hooks/useFloatingToolbar";
import { type EditState, parseCfgFromBlock } from "./textEditorTypes";

export function useDblClickActivation({
  containerRef,
  toolbar,
  setEditState,
  setIsTextEditing,
  setSelectedField,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  toolbar: ReturnType<typeof useFloatingToolbar>;
  setEditState: React.Dispatch<React.SetStateAction<EditState | null>>;
  setIsTextEditing: (v: boolean) => void;
  setSelectedField: (f: string | null) => void;
}) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleDblClick(e: MouseEvent) {
      const target = e.target as HTMLElement;

      // -----------------------------------------------------------------------
      // Path 1: array-item field  (data-editable-item-index / item-field / array-key)
      // -----------------------------------------------------------------------
      const itemEl = target.closest<HTMLElement>("[data-editable-item-index]");
      if (itemEl) {
        const rawIndex = itemEl.dataset.editableItemIndex;
        const itemField = itemEl.dataset.editableItemField;
        const arrayKey = itemEl.dataset.editableArrayKey;
        if (rawIndex === undefined || !itemField || !arrayKey) return;

        const itemIndex = parseInt(rawIndex, 10);
        if (!Number.isFinite(itemIndex)) return;

        const blockEl = itemEl.closest<HTMLElement>("[data-block-id]");
        const blockId = blockEl?.dataset.blockId;
        if (!blockId) return;

        e.preventDefault();
        e.stopPropagation();

        const store = useEditorStore.getState();
        const block = store.blocks.find((b) => b.id === blockId);
        if (!block) return;

        const cfg = parseCfgFromBlock(block);
        const blockRect = blockEl!.getBoundingClientRect();

        itemEl.setAttribute("contenteditable", "true");
        itemEl.setAttribute("spellcheck", "true");
        itemEl.style.outline = "2px solid var(--primary, #6366f1)";
        itemEl.style.outlineOffset = "2px";
        itemEl.style.borderRadius = "2px";

        const originalText = itemEl.innerText;

        const state: EditState = {
          blockId,
          field: itemField,
          originalText,
          originalCfg: cfg,
          blockRect,
          element: itemEl,
          translatingLang: null,
          arrayKey,
          itemIndex,
        };
        setEditState(state);
        setIsTextEditing(true);
        setSelectedField(itemField);

        requestAnimationFrame(() => {
          itemEl.focus();
          const sel = window.getSelection();
          if (sel && sel.rangeCount === 0) {
            const range = document.createRange();
            range.selectNodeContents(itemEl);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
          toolbar.show(blockRect);
        });
        return;
      }

      // -----------------------------------------------------------------------
      // Path 2: top-level field  (data-editable-field)
      // -----------------------------------------------------------------------
      const fieldEl = target.closest<HTMLElement>("[data-editable-field]");
      if (!fieldEl) return;

      const field = fieldEl.dataset.editableField;
      if (!field) return;

      const blockEl = fieldEl.closest<HTMLElement>("[data-block-id]");
      const blockId = blockEl?.dataset.blockId;
      if (!blockId) return;

      e.preventDefault();
      e.stopPropagation();

      const store = useEditorStore.getState();
      const block = store.blocks.find((b) => b.id === blockId);
      if (!block) return;

      const cfg = parseCfgFromBlock(block);
      const blockRect = blockEl!.getBoundingClientRect();

      const displayLang = store.displayLang;
      const mainLang = store.settings.mainLanguage || "en";
      const isTranslating = !!(displayLang && displayLang !== mainLang);

      fieldEl.setAttribute("contenteditable", "true");
      fieldEl.setAttribute("spellcheck", "true");
      const outlineColor = isTranslating
        ? "var(--amber-500, #f59e0b)"
        : "var(--primary, #6366f1)";
      fieldEl.style.outline = `2px solid ${outlineColor}`;
      fieldEl.style.outlineOffset = "2px";
      fieldEl.style.borderRadius = "2px";

      const originalText = fieldEl.innerText;

      if (isTranslating) {
        let translatedText = store.getTranslation(blockId, displayLang, field);
        if (!translatedText) {
          translatedText = String(cfg[field] ?? "");
          if (translatedText) {
            store.setTranslation(blockId, displayLang, field, translatedText);
          }
        }
        if (translatedText) {
          fieldEl.innerText = translatedText;
        }
      }

      const state: EditState = {
        blockId,
        field,
        originalText,
        originalCfg: cfg,
        blockRect,
        element: fieldEl,
        translatingLang: isTranslating ? displayLang : null,
      };
      setEditState(state);
      setIsTextEditing(true);
      setSelectedField(field);

      requestAnimationFrame(() => {
        fieldEl.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount === 0) {
          const range = document.createRange();
          range.selectNodeContents(fieldEl);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        toolbar.show(blockRect);
      });
    }

    container.addEventListener("dblclick", handleDblClick);
    return () => container.removeEventListener("dblclick", handleDblClick);
  }, [containerRef, toolbar, setEditState, setIsTextEditing, setSelectedField]);
}
