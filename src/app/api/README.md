# API Routes

Next.js App Router API routes. All mutations go through these routes (Server Actions are disabled on Cloudflare Workers).

## Conventions

- Auth: routes under `sites/[id]/` require authenticated session via `getAuthSession()`
- Response: JSON with `{ data }` or `{ error }` shape
- Validation: request bodies validated with Zod schemas from `@/lib/schemas/`
- DB: queries via Kysely against Cloudflare D1

## Route groups

- `auth/` — Better Auth catch-all handler
- `sites/` — Site CRUD, nested resources (blocks, pages, guests, media, settings, templates)
- `public/[siteSlug]/` — Public endpoints (RSVP submission, guestbook)
- `canva/` — Canva integration OAuth flow
- `domain/` — Custom domain check and purchase
- `places/` — Google Places API proxy (search, details, photos)
- `maps/` — Google Maps embed proxy
- `health/` — Health check endpoint
- `telemetry/` — Client telemetry ingestion
