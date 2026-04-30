# Context — DreamySuite

## Domain Terms

| Term | Meaning |
|------|---------|
| Block | A visual content unit on a site page (e.g., Hero, RSVP, Schedule, FAQ). Blocks have types, settings, and positions. |
| Effect | A visual enhancement applied to a site — backgrounds (WebGL/canvas/CSS), text effects, cursor effects, decorations, nav styles, transitions. |
| Site | A user-created event invitation website. Has a slug, pages, blocks, theme, and settings. |
| Slug | The URL path for a published site (e.g., `/john-and-jane`). |
| Editor | The dashboard UI where users build their site by arranging blocks, editing text, and configuring settings. |
| Inspector | The right-side panel in the editor showing settings for the selected block or page. |
| Canvas | The main editing area in the editor where blocks are visually positioned. |
| Breakpoint | Responsive view mode — desktop (default), tablet, mobile. Blocks position differently per breakpoint. |
| Public site | The published guest-facing version at `[slug]` route. Separate render pipeline from editor. |
| Theme | A collection of CSS variables (--muted, --body-color, --border, --bg) that style the entire site. |
| Block offset | Absolute pixel position (blockOffsetX, blockOffsetY) for desktop layout. On tablet/mobile, blocks use normal flow instead. |
| Sort order | Integer determining block render order. Desktop uses absolute positioning (offset), tablet/mobile uses sort order for flow. |
| Layer | Visual stacking and ordering of blocks in the editor's layer panel. |
| RSVP | Guest response form — core feature for event invitations. |
| Guestbook | Public-facing message board for event sites. |

## Abbreviations

| Abbrev | Full |
|--------|------|
| D1 | Cloudflare D1 (SQLite at the edge) |
| R2 | Cloudflare R2 (object storage for media) |
| SSR | Server-side rendering |
| SSOT | Single source of truth |
| GSAP | GreenSock Animation Platform |

## Architecture Concepts

- **Editor preview ≠ public render**: Editor uses iframe + delta postMessage. Public uses SSR → client hydration. Different code paths.
- **Desktop = absolute positioning**: Blocks use `position: absolute` with pixel offsets on desktop.
- **Tablet/mobile = flow layout**: Blocks use normal document flow, sorted by `blockOffsetY` or `sortOrder`.
- **Effects are dynamically loaded**: All effects use `next/dynamic` with `{ ssr: false }`. Heavy libs (Three.js, OGL) are code-split per effect.
- **Preact runtime**: Public site effects use a Preact-based runtime (lighter than React) built by `scripts/build-public-effects.mjs`.
