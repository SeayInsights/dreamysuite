# DreamySuite

![CI](https://github.com/SeayInsights/dreamysuite/actions/workflows/deploy.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue)

Event invitation SaaS — build beautiful wedding and event sites in a visual editor; guests RSVP through the published public site.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/SeayInsights/dreamysuite.git && cd dreamysuite

# 2. Install
npm install

# 3. Set environment variables
cp .env.example .env.local   # fill in AUTH_SECRET, CLOUDFLARE_*, RESEND_API_KEY

# 4. Run the Next.js dev server
npm run dev

# 5. Preview on the Cloudflare Workers runtime
npm run preview
```

## Project Structure

```
src/
  app/
    (auth)/              Login + signup pages
    (dashboard)/         Authed shell — site list, per-site editor
      sites/[id]/
        editor-v2/       V2 visual editor (default)
          blocks/        Block registry + per-block renderers
          editing/       Canvas drag/resize + SectionToolbar + popovers/
          hooks/         useBlockSync, useSelectedBlock, useShortcuts …
          inspector/     Right-panel tabs: content, style, layout, motion
            editors/     Per-block content editors (Faq, Schedule, Travel …)
    [slug]/              Public site SSR (anonymous guests)
    api/
      sites/[id]/        Authed CRUD — blocks, pages, guests, settings …
        blocks/reorder   PATCH batch reorder endpoint
      public/[siteSlug]/ Anonymous read + RSVP submission (rate-limited)
      telemetry/         Page-view analytics
  lib/
    api/                 requireSiteOwnership + shared API helpers
    cloudflare.ts        getEnv() — typed Cloudflare context accessor
    color.ts             Shared hexToRgb / rgbToHex utilities
    crypto/              hashGuestPassword / verifyGuestPassword (PBKDF2)
    effects/             Effects registry + lazy-loaded components
    languages.ts         Canonical language list (code, label, flag …)
    rateLimit.ts         KV-based IP rate limiter
    schemas/             Zod block + settings schemas
  stores/
    slices/              Zustand slices: document, editorShell, settings, theme
    editorStore.ts       Combined store
migrations/              D1 SQL migrations (apply via wrangler d1 execute)
scripts/
  build-public-effects.mjs  Bundles effect components for the public site
  rehash-passwords.mjs      One-off: re-hash any legacy plaintext passwords
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | Cloudflare Workers via `@opennextjs/cloudflare` |
| Database | Cloudflare D1 (SQLite) + Kysely |
| Auth | better-auth (email/password, cookie sessions) |
| Storage | Cloudflare R2 (site media) + KV (caching, rate limiting) |
| Email | Resend (invites + RSVP confirmations) |
| Styling | Tailwind CSS v4 |
| Editor state | Zustand + Zundo (undo/redo) |
| Effects | GSAP, Three.js / R3F, Matter.js, Rapier physics (all lazy-loaded) |
| Unit tests | Vitest |

## Applying DB Migrations

```bash
# Apply a specific migration
npx wrangler d1 execute dreamysuite-db --file=migrations/<file>.sql --remote

# Local dev
npx wrangler d1 execute dreamysuite-db --file=migrations/<file>.sql
```

## License

MIT
