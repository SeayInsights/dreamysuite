# DreamySuite

![Deploy](https://github.com/dannis-seay/dreamysuite/actions/workflows/deploy.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue)

Event invitation SaaS — build beautiful wedding and event sites in a visual editor; guests RSVP through the published public site.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/dannis-seay/dreamysuite.git && cd dreamysuite

# 2. Install
npm install

# 3. Set environment variables
cp .env.example .env.local   # fill in CLOUDFLARE_* and AUTH_SECRET

# 4. Run the Next.js dev server
npm run dev

# 5. Preview on the Cloudflare Workers runtime
npm run preview
```

## Project Structure

```
src/app/
  (auth)/              Login + signup routes, cookie-based auth
  (dashboard)/         Authed shell — site list, per-site editor
    sites/[id]/
      editor.tsx       Visual editor (V2 default; V1 behind feature flag)
  [slug]/              Public site render (anonymous guests)
    route.ts           SSR fetch → hydrates client renderer
  api/
    health/            GET /api/health — liveness probe
    sites/[id]/        Authed site mutations (content, settings, templates)
    public/[siteSlug]/ Anonymous read + RSVP submission
  components/blocks/   Block renderer components (Hero, Text, RSVP, etc.)
  stores/editorStore.ts Zustand store
  lib/                 Auth helpers, D1 client, server utilities
migrations/            D1 SQL migrations, applied in filename order
scripts/               One-off seeds and generators (not part of deploy)
e2e/                   Playwright end-to-end specs
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | Cloudflare Workers via `@opennextjs/cloudflare` |
| Database | Cloudflare D1 (SQLite) |
| Auth | better-auth (email/password, cookie sessions) |
| Storage | Cloudflare R2 (site media) |
| Email | Resend (invites + RSVP confirmations) |
| Styling | Tailwind CSS v4 |
| Editor state | Zustand + `zundo` undo middleware |
| Animations | GSAP (public site intro, CDN-loaded) |
| Unit tests | Vitest |
| E2E tests | Playwright |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, commit format, and the PR checklist.

## Security

See [SECURITY.md](SECURITY.md) to report vulnerabilities.

## License

MIT
