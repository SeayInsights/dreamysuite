# Styles

Global CSS for the DreamySuite dashboard and editor.

## Files

- `dashboard.css` — Barrel that imports the four dashboard stylesheet modules
- `dashboard-tokens.css` — Design tokens (CSS custom properties), base styles, animations
- `dashboard-layout.css` — Shell layout, main content area, button primitives
- `dashboard-sidebar.css` — Sidebar navigation, logo, user footer
- `dashboard-components.css` — Site cards, grid, badges, empty state
- `site-blocks.css` — Block component styles shared between editor preview and public site

## Conventions

- Use CSS custom properties for theming (`--muted`, `--body-color`, `--border`, `--bg`)
- No hardcoded hex colors in block styles
- Tailwind CSS v4 is the primary utility framework; these files handle structural styles that don't fit utilities
