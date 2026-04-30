# Public Site Renderer

Renders published event sites as standalone HTML documents at `/:slug`.

## Architecture

This is NOT a React render path. The route handler builds raw HTML strings for performance on Cloudflare Workers. Each module handles one concern:

- `route.ts` — GET/POST handlers (orchestrator, ~185 lines)
- `queries.ts` — All database queries (site, pages, blocks, settings)
- `auth.ts` — Guest password verification, session checks
- `types.ts` — Shared interfaces (SiteRow, BlockRow, etc.)
- `helpers.ts` — HTML escaping, URL sanitization, utilities
- `styles.ts` — CSS generation from site settings
- `renderers.ts` — Per-block-type HTML rendering
- `scripts.ts` — Client-side JavaScript builders (countdown, animations, responsive)
- `html-builder.ts` — Full document assembly
- `pages.ts` — Static pages (coming soon, 404, intro overlay)

## Testing changes

Block rendering changes must be tested in BOTH the editor preview AND this public renderer — they are separate code paths.
