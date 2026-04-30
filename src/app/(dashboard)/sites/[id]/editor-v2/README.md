# Editor V2

Visual block editor for event sites. Users drag, resize, and style content blocks on a canvas.

## Key modules

- `index.tsx` — Entry point, renders the editor shell
- `Canvas.tsx` — Viewport with zoom/pan, renders blocks via `SiteRenderer`
- `SelectionLayer.tsx` — Block selection, multi-select, click-through cycling
- `SidebarNav.tsx` — Left nav: page list, block inserter
- `InspectorV2.tsx` — Right panel: block properties, design, layout tabs

## Subdirectories

- `editing/` — Inline editors (text, image, video), toolbars, popovers
- `inspector/` — Property panels, per-block-type editors
- `trays/` — Slide-out panels (settings, pages, design theme, language)
- `hooks/` — Editor-specific hooks (drag, selection, shortcuts, clipboard)
- `commands/` — Undo/redo command system
- `topbar/` — Breakpoint toggle, undo/redo buttons, mode switch
- `blocks/` — Block-specific rendering wrappers
- `lib/` — Editor utilities (cascade config, etc.)

## Data flow

Editor store (Zustand) → Canvas renders blocks → User edits via inline editors or inspector → Store updates → API sync (debounced) → D1 database
