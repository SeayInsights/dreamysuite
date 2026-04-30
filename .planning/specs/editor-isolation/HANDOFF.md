# Editor Isolation — Session Handoff

**Date:** 2026-04-30
**Status:** Phase 2 complete

---

## What was done

### Phase 1 (same-document cleanup) — merged to `main`

| PR | What |
|---|---|
| #208 | CSS namespace (`--site-*` prefix) + theme chain flatten + dead code cleanup |
| #209 | Focus restoration pattern (replaces `closest()` exemption lists) |
| #212 | Narrow store selectors (9 block subscribers + BreakpointFrame settings) |
| #213 | Documentation (GOTCHAS.md + CONSTITUTION.md updated) |

### Phase 2 (iframe isolation) — merged to `main`

| PR | Task | What |
|---|---|---|
| #214 | T201 | IframeCanvas component — React portal into `<iframe srcDoc>`, stylesheet cloning, theme/background/font sync |
| #215 | T202, T203 | SelectionLayer reads rects from iframe doc; EditorOverlay native listeners with `ownerDocument.elementsFromPoint()` |
| #216 | T204 | Cross-iframe focus/keyboard — `el.ownerDocument` for all DOM APIs, keyboard event forwarding, `setLastFocusedElement` explicit setter |
| #217 | T205 | Cross-iframe drag — `attachListeners` on both iframe and parent windows, auto-scroll targets iframe scroll container |
| #218 | T206 | Mouse event forwarding from iframe to parent for effects (cursor, interactive backgrounds) |

### Key patterns established

1. **React portal into iframe** — `createPortal(children, iframeDoc.body)`. Same React tree, two DOMs.
2. **`el.ownerDocument` rule** — any code touching canvas DOM uses `el.ownerDocument` (not `document`) and `el.ownerDocument.defaultView` (not `window`).
3. **Event forwarding bridge** — BreakpointFrame forwards keyboard and mouse events from iframe to parent window so global shortcuts and effects work.
4. **Dual-window listeners** — drag code detects `isCrossFrame` and listens on both iframe and parent windows for pointer events.
5. **SelectionLayer in parent frame** — overlays iframe; reads `getBoundingClientRect()` from iframe elements directly (1:1 coordinate mapping since iframe fills its container).

### Known limitations

- Effects that inject `<style>` into `document.head` affect the parent document, not the iframe (cosmetic cursor:none styles). Low impact.
- Touch event forwarding not implemented (desktop editor context only).
- `window.innerWidth` in effects resolves to parent viewport width, not iframe width. Most effects size from their container element, so this is rarely an issue.

---

## Architecture reference

- **SSOT map:** `.planning/CONSTITUTION.md` (updated with iframe entries)
- **Gotchas:** `.planning/GOTCHAS.md` (two new entries for iframe patterns)
- **Canvas architecture:** Memory file `reference_dreamysuite_canvas.md`
