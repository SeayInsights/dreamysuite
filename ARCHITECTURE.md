# DreamySuite Architecture

Event invitation SaaS. Users build wedding/event sites in a visual editor; guests RSVP through the published public site.

## Stack

- **Framework:** Next.js 16 (App Router, Server Actions disabled for Workers)
- **Runtime:** Cloudflare Workers via `@opennextjs/cloudflare`
- **Database:** Cloudflare D1 (SQLite)
- **Auth:** better-auth (email/password, cookie sessions)
- **Object storage:** Cloudflare R2 (site media uploads)
- **Email:** Resend (invite + RSVP confirmations)
- **Styling:** Tailwind CSS v4, custom CSS modules for editor/dashboard
- **State (editor):** Zustand with `zundo` temporal middleware (partial — see PHASE 1 plan)
- **Animations:** GSAP (public-site intro animations only, loaded via CDN)
- **Drag-reorder:** SortableJS

## Directory map

```
src/app/
  (auth)/              Login + signup routes, cookie-based auth
  (dashboard)/         Authed shell — site list, per-site editor
    sites/[id]/
      editor.tsx       ⚠ monolithic 5400-line editor (Phase 3 target)
  [slug]/              Public site render (anonymous guests)
    route.ts           SSR fetch → hydrates client renderer
  api/
    sites/[id]/        Authed site mutations (content, settings, templates)
    public/[siteSlug]/ Anonymous read + RSVP submission
  components/blocks/   Block renderer components (Hero, Text, RSVP, etc.)
  stores/editorStore.ts Zustand store (currently blocks-only)
  lib/                 Auth helpers, D1 client, server utilities
migrations/            D1 SQL migrations, applied in filename order
scripts/               One-off seeds and generators (not part of deploy)
e2e/                   Playwright end-to-end specs
```

## Data flow

**Editor save:**
```
editor.tsx → POST /api/sites/[id]/content   (blocks, debounced 800ms)
          → PUT  /api/sites/[id]/settings   (immediate)
          → POST /api/sites/[id]/templates  (template apply)
```

Routes call `requireSiteOwnership(siteId, userId)` before mutation. Each route currently re-declares its own copy of this helper (Phase 1 consolidation target).

**Public view:**
```
browser → /[slug] (SSR) → D1 lookup site by slug
       → requires site.status = 'published'
       → returns JSON site tree
       → client renders via components/blocks/*
```

RSVP submission:
```
browser → POST /api/public/[slug]/rsvp → D1 insert into guest_response
```

## Deploy

**Pushing to `main` triggers the GitHub Actions CI deploy** (`.github/workflows/`). CI runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`. Do not run `wrangler deploy` locally.

Branches/PRs build but do not deploy.

## Migrations

21 migrations numbered `0001_auth.sql` through `0021_show_nav_brand.sql`. New migrations: next sequential number. Applied via `wrangler d1 migrations apply dreamysuite` (CI does this on deploy).

Historical squashing is deferred — squashing retroactively would require coordinating with production D1 state. If fresh environments become common, create a baseline dump and archive older migrations.

## Known issues / future work

These are tracked here instead of as scattered TODOs. See commit history for specifics.

1. **Editor refactor (Phase 1-3)** — `editor.tsx` is 5400 lines, 600+ `useState` calls, three fragmented state layers. Plan: Zod schemas → TanStack Query → decompose into panels.
2. **Public render parity** — editor preview iframe uses delta `postMessage`; can silently desync from the real render. Plan (Phase 4): share a `<RenderBlock>` component between editor preview and `[slug]` route.
3. **Dashboard cold-start** — `/` route can take ~45s on Cloudflare Worker cold starts. Candidate fix: split public renderer into its own worker. Not scheduled.
4. **Keyboard shortcuts** — Undo/redo are toolbar-only. No `Ctrl+Z` / `Ctrl+Shift+Z`.
5. **E2E test install path** — `package.json` scripts reference `../../node_modules/@playwright/test/cli.js` (studio monorepo's install). Fragile. Fix: add `@playwright/test` as a local devDependency.
6. **GSAP intro animation coverage** — E2E suite skips the GSAP assertion; requires configuring an intro animation in site settings first.

## Testing

Playwright specs in `e2e/` hit a live deploy. Not run in CI. Local:
```
npm run test:e2e        # headless
npm run test:e2e:ui     # UI mode
npm run test:e2e:report # view last report
```
