"use client";

import { useEffect } from "react";

import { useEditorStore } from "@/app/stores/editorStore";

/**
 * Global keyboard map for the V2 editor.
 *
 * Shortcuts (all fire only when focus is outside editable text):
 *   [           toggle icon rail
 *   ]           toggle inspector
 *   Cmd/Ctrl+.  toggle full-preview (hides all chrome)
 *   G           toggle grid overlay (consumed by Phase 3 canvas)
 *   I           open inspector (force-open; idempotent)
 *   P           open preview in new tab (consumed by top bar handler)
 *   Cmd/Ctrl+Z          undo
 *   Cmd/Ctrl+Shift+Z    redo
 *
 * The hook dispatches a synthetic `editor-v2:shortcut` CustomEvent for the
 * non-store cases (grid, preview) so whichever component owns that UI can
 * subscribe without this hook knowing the details.
 */

export type ShortcutEvent =
	| { kind: "grid:toggle" }
	| { kind: "preview:open" };

function isEditableTarget(el: EventTarget | null): boolean {
	if (!(el instanceof HTMLElement)) return false;
	if (el.isContentEditable) return true;
	const tag = el.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function useShortcuts() {
	const toggleRail = useEditorStore((s) => s.toggleRail);
	const toggleInspector = useEditorStore((s) => s.toggleInspector);
	const setInspectorOpen = useEditorStore((s) => s.setInspectorOpen);
	const toggleFullPreview = useEditorStore((s) => s.toggleFullPreview);
	const selectBlock = useEditorStore((s) => s.selectBlock);

	useEffect(() => {
		function handler(e: KeyboardEvent) {
			if (isEditableTarget(e.target)) return;

			if (e.key === "Escape") {
				e.preventDefault();
				selectBlock(null);
				return;
			}

			const mod = e.metaKey || e.ctrlKey;

			if (mod && !e.shiftKey && e.key.toLowerCase() === "z") {
				e.preventDefault();
				useEditorStore.temporal.getState().undo();
				return;
			}
			if (mod && e.shiftKey && e.key.toLowerCase() === "z") {
				e.preventDefault();
				useEditorStore.temporal.getState().redo();
				return;
			}
			if (mod && e.key === ".") {
				e.preventDefault();
				toggleFullPreview();
				return;
			}
			if (mod || e.altKey) return;

			switch (e.key) {
				case "[":
					e.preventDefault();
					toggleRail();
					return;
				case "]":
					e.preventDefault();
					toggleInspector();
					return;
				case "i":
				case "I":
					e.preventDefault();
					setInspectorOpen(true);
					return;
				case "g":
				case "G":
					e.preventDefault();
					window.dispatchEvent(
						new CustomEvent<ShortcutEvent>("editor-v2:shortcut", {
							detail: { kind: "grid:toggle" },
						}),
					);
					return;
				case "p":
				case "P":
					e.preventDefault();
					window.dispatchEvent(
						new CustomEvent<ShortcutEvent>("editor-v2:shortcut", {
							detail: { kind: "preview:open" },
						}),
					);
					return;
			}
		}

		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [toggleRail, toggleInspector, setInspectorOpen, toggleFullPreview, selectBlock]);
}
